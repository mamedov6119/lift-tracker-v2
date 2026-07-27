import { db, PROFILE_ID, tx } from "../db.js";
import { epley1RM, setVolume, shiftISO, todayISO } from "../../shared/rules.js";

// ---------- row shaping ----------
// node:sqlite returns null-prototype rows with snake_case columns; the client
// speaks camelCase, so every read goes through one of these mappers.

export const toExercise = (r) => r && ({
  id: r.id, name: r.name, category: r.category, icon: r.icon,
  thumb: r.thumb, metric: r.metric, isCustom: !!r.is_custom,
});

// "3 sets · 10 reps" / "3 sets · 45s" — the design's subtitle line, with the
// target expressed in whatever unit the exercise is actually measured in.
function planSub(r) {
  const target = r.metric === "time" ? `${r.target_seconds}s` : `${r.target_reps} reps`;
  return `${r.target_sets} ${r.target_sets === 1 ? "set" : "sets"} · ${target}`;
}

export const toPlanItem = (r) => r && ({
  id: r.id, date: r.date, exerciseId: r.exercise_id, name: r.name,
  category: r.category, icon: r.icon, thumb: r.thumb, metric: r.metric,
  targetSets: r.target_sets, targetReps: r.target_reps, targetSeconds: r.target_seconds,
  completed: !!r.completed, source: r.source, position: r.position,
  sub: planSub(r),
});

export const toSet = (r) => r && ({
  id: r.id, date: r.date, exerciseId: r.exercise_id, exerciseName: r.name,
  metric: r.metric, weight: r.weight, reps: r.reps,
  durationSeconds: r.duration_seconds, rpe: r.rpe, createdAt: r.created_at,
});

// ---------- profile ----------
export function getProfile() {
  const r = db.prepare(`SELECT * FROM profile WHERE id = ?`).get(PROFILE_ID);
  return { id: r.id, name: r.name, trainingStyle: r.training_style, unit: r.unit, muted: !!r.muted };
}

const PROFILE_FIELDS = {
  name: "name", trainingStyle: "training_style", unit: "unit", muted: "muted",
};

export function updateProfile(patch) {
  const entries = Object.entries(patch).filter(([k]) => k in PROFILE_FIELDS);
  if (entries.length) {
    const setClause = entries.map(([k]) => `${PROFILE_FIELDS[k]} = ?`).join(", ");
    const values = entries.map(([, v]) => (typeof v === "boolean" ? Number(v) : v));
    db.prepare(`UPDATE profile SET ${setClause} WHERE id = ?`).run(...values, PROFILE_ID);
  }
  return getProfile();
}

// ---------- exercises ----------
export function listExercises() {
  return db.prepare(`SELECT * FROM exercises ORDER BY is_custom, name`).all().map(toExercise);
}

export function getExercise(id) {
  return toExercise(db.prepare(`SELECT * FROM exercises WHERE id = ?`).get(id));
}

export function createExercise({ id, name, category = "", icon = "barbell", thumb, metric = "weight" }) {
  const slug = id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  db.prepare(`
    INSERT INTO exercises (id, name, category, icon, thumb, metric, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(slug, name, category, icon, thumb || "linear-gradient(135deg,#3a3a3c,#1c1c1e)", metric);
  return getExercise(slug);
}

// ---------- plan ----------
const PLAN_SELECT = `
  SELECT p.*, e.name, e.category, e.icon, e.thumb, e.metric
  FROM plan_items p JOIN exercises e ON e.id = p.exercise_id
  WHERE p.profile_id = ?
`;

export function listPlan(date) {
  return db.prepare(`${PLAN_SELECT} AND p.date = ? ORDER BY p.position, p.id`)
    .all(PROFILE_ID, date).map(toPlanItem);
}

export function getPlanItem(id) {
  return toPlanItem(db.prepare(`${PLAN_SELECT} AND p.id = ?`).get(PROFILE_ID, id));
}

export function addPlanItem({ date, exerciseId, targetSets = 3, targetReps = 10, targetSeconds = 45, source = "plan" }) {
  const exercise = getExercise(exerciseId);
  if (!exercise) return null;
  const { next } = db.prepare(
    `SELECT COALESCE(MAX(position) + 1, 0) AS next FROM plan_items WHERE profile_id = ? AND date = ?`
  ).get(PROFILE_ID, date);
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO plan_items (profile_id, date, exercise_id, target_sets, target_reps, target_seconds, source, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(PROFILE_ID, date, exerciseId, targetSets, targetReps, targetSeconds, source, next);
  return getPlanItem(Number(lastInsertRowid));
}

export function updatePlanItem(id, { completed }) {
  if (completed !== undefined) {
    db.prepare(`UPDATE plan_items SET completed = ? WHERE id = ? AND profile_id = ?`)
      .run(Number(!!completed), id, PROFILE_ID);
  }
  return getPlanItem(id);
}

export function deletePlanItem(id) {
  const { changes } = db.prepare(`DELETE FROM plan_items WHERE id = ? AND profile_id = ?`).run(id, PROFILE_ID);
  return changes > 0;
}

export function completeAllPlanItems(date) {
  db.prepare(`UPDATE plan_items SET completed = 1 WHERE profile_id = ? AND date = ?`).run(PROFILE_ID, date);
  return listPlan(date);
}

// ---------- sets ----------
const SET_SELECT = `
  SELECT s.*, e.name, e.metric FROM sets s JOIN exercises e ON e.id = s.exercise_id
  WHERE s.profile_id = ?
`;

export function listSets({ from, to, exerciseId } = {}) {
  const clauses = [];
  const params = [PROFILE_ID];
  if (from) { clauses.push("s.date >= ?"); params.push(from); }
  if (to) { clauses.push("s.date <= ?"); params.push(to); }
  if (exerciseId) { clauses.push("s.exercise_id = ?"); params.push(exerciseId); }
  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  return db.prepare(`${SET_SELECT}${where} ORDER BY s.date, s.id`).all(...params).map(toSet);
}

export function getSet(id) {
  return toSet(db.prepare(`${SET_SELECT} AND s.id = ?`).get(PROFILE_ID, id));
}

export function addSet({ date = todayISO(), exerciseId, weight = 0, reps = 0, durationSeconds = 0, rpe = null }) {
  const exercise = getExercise(exerciseId);
  if (!exercise) return null;
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO sets (profile_id, date, exercise_id, weight, reps, duration_seconds, rpe)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(PROFILE_ID, date, exerciseId, weight, reps, durationSeconds, rpe);
  return getSet(Number(lastInsertRowid));
}

export function deleteSet(id) {
  const { changes } = db.prepare(`DELETE FROM sets WHERE id = ? AND profile_id = ?`).run(id, PROFILE_ID);
  return changes > 0;
}

// ---------- advisor ----------
// Suggestions are ranked by neglect: lifts absent from the plan today, least
// recently trained first. Anything already swiped today drops out of the queue.
export function advisorQueue(date, limit = 6) {
  const rows = db.prepare(`
    SELECT e.*, (
      SELECT MAX(s.date) FROM sets s WHERE s.exercise_id = e.id AND s.profile_id = ?
    ) AS last_trained
    FROM exercises e
    WHERE e.id NOT IN (SELECT exercise_id FROM plan_items      WHERE profile_id = ? AND date = ?)
      AND e.id NOT IN (SELECT exercise_id FROM advisor_reviews WHERE profile_id = ? AND date = ?)
    ORDER BY last_trained IS NOT NULL, last_trained ASC, e.name
    LIMIT ?
  `).all(PROFILE_ID, PROFILE_ID, date, PROFILE_ID, date, limit);
  return rows.map((r) => ({ ...toExercise(r), lastTrained: r.last_trained }));
}

export function reviewAdvisorCard({ date, exerciseId, accepted }) {
  db.prepare(`
    INSERT INTO advisor_reviews (profile_id, date, exercise_id, accepted) VALUES (?, ?, ?, ?)
    ON CONFLICT(profile_id, date, exercise_id) DO UPDATE SET accepted = excluded.accepted
  `).run(PROFILE_ID, date, exerciseId, Number(!!accepted));
  return accepted ? addPlanItem({ date, exerciseId, source: "advisor" }) : null;
}

// ---------- analytics ----------
// Month view for the Home calendar: which days have activity, plus the
// headline counters above it. Volume is weight moved (weight × reps), so
// bodyweight and timed work contributes nothing to it by design.
export function monthSummary(month) {
  const from = `${month}-01`;
  const to = `${month}-31`;
  const setDays = db.prepare(`
    SELECT date, SUM(weight * reps) AS volume FROM sets
    WHERE profile_id = ? AND date BETWEEN ? AND ? GROUP BY date
  `).all(PROFILE_ID, from, to);
  const planDays = db.prepare(`
    SELECT date FROM plan_items
    WHERE profile_id = ? AND completed = 1 AND date BETWEEN ? AND ? GROUP BY date
  `).all(PROFILE_ID, from, to);

  const active = new Set([...setDays.map((d) => d.date), ...planDays.map((d) => d.date)]);
  return {
    month,
    activeDays: [...active].sort(),
    volumeByDay: Object.fromEntries(setDays.map((d) => [d.date, d.volume])),
    totalVolume: setDays.reduce((sum, d) => sum + d.volume, 0),
    daysCompleted: active.size,
  };
}

// The Training tab's ring + stat column for one date.
export function sessionSummary(date) {
  const sets = listSets({ from: date, to: date });
  const plan = listPlan(date);
  const profile = getProfile();
  const rpes = sets.map((s) => s.rpe).filter((v) => v != null);
  return {
    date,
    volume: sets.reduce((sum, s) => sum + setVolume(s), 0),
    setCount: sets.length,
    completedCount: plan.filter((i) => i.completed).length,
    plannedCount: plan.length,
    // Timed work reports real seconds; everything else is estimated at ~3.5
    // min per logged set including rest.
    durationMinutes: Math.round(
      sets.reduce((sum, s) => sum + (s.durationSeconds ? s.durationSeconds / 60 : 3.5), 0)
    ),
    rpe: rpes.length ? Number((rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1)) : null,
    trainingStyle: profile.trainingStyle,
    unit: profile.unit,
  };
}

// The value one set contributes to its exercise's progress chart.
function setValue(set, metric) {
  if (metric === "time") return set.durationSeconds;
  if (metric === "reps") return set.reps;
  return epley1RM(set.weight, set.reps);
}

// Per-exercise trend for the Progress tab. Each point is that day's best
// effort, measured in whatever unit the exercise actually uses.
export function exerciseProgress(exerciseId, weeks = 8) {
  const exercise = getExercise(exerciseId);
  if (!exercise) return null;
  const profile = getProfile();
  const unit = exercise.metric === "weight" ? profile.unit : exercise.metric === "time" ? "s" : "reps";
  const from = shiftISO(todayISO(), -weeks * 7);
  const sets = listSets({ from, exerciseId });

  const byDay = new Map();
  for (const s of sets) {
    byDay.set(s.date, Math.max(byDay.get(s.date) || 0, setValue(s, exercise.metric)));
  }
  const series = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  if (series.length === 0) {
    return { exercise, metric: exercise.metric, unit, series: [], sessions: 0, current: 0, best: 0, avg: 0, trendPct: 0 };
  }
  const values = series.map((p) => p.value);
  const first = values[0];
  return {
    exercise,
    metric: exercise.metric,
    unit,
    series,
    sessions: series.length,
    current: values[values.length - 1],
    best: Math.max(...values),
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    trendPct: first ? Math.round(((values[values.length - 1] - first) / first) * 100) : 0,
  };
}

// Every exercise with any logged history, newest-trained first — this is what
// the Progress picker searches over, independent of any one day's plan.
export function trackedExercises(minSessions = 1) {
  return db.prepare(`
    SELECT e.*, COUNT(DISTINCT s.date) AS sessions, MAX(s.date) AS last_trained
    FROM exercises e JOIN sets s ON s.exercise_id = e.id AND s.profile_id = ?
    GROUP BY e.id HAVING sessions >= ?
    ORDER BY last_trained DESC, e.name
  `).all(PROFILE_ID, minSessions)
    .map((r) => ({ ...toExercise(r), sessions: r.sessions, lastTrained: r.last_trained }));
}

// ---------- insight log ----------
// The banner stays up for the whole day once an insight fires; dismissal is
// what hides it. `insight_events` therefore records what was surfaced (useful
// history) without feeding back into rule suppression.
export function dismissedToday(date) {
  const rows = db.prepare(`SELECT insight_id FROM insight_events WHERE profile_id = ? AND date = ? AND dismissed = 1`).all(PROFILE_ID, date);
  return new Set(rows.map((r) => r.insight_id));
}

export function recordInsightShown(insightId, date) {
  db.prepare(`INSERT OR IGNORE INTO insight_events (profile_id, insight_id, date) VALUES (?, ?, ?)`)
    .run(PROFILE_ID, insightId, date);
}

export function dismissInsight(insightId, date) {
  db.prepare(`
    INSERT INTO insight_events (profile_id, insight_id, date, dismissed) VALUES (?, ?, ?, 1)
    ON CONFLICT(profile_id, insight_id, date) DO UPDATE SET dismissed = 1
  `).run(PROFILE_ID, insightId, date);
}

// ---------- danger zone ----------
// Wipes logged history and any custom exercises, but leaves the built-in
// catalog and the profile row intact so the app still boots into a usable state.
export function resetData() {
  tx(() => {
    for (const table of ["sets", "plan_items", "advisor_reviews", "insight_events"]) {
      db.prepare(`DELETE FROM ${table} WHERE profile_id = ?`).run(PROFILE_ID);
    }
    db.prepare(`DELETE FROM exercises WHERE is_custom = 1`).run();
  });
}
