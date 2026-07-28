import { db, tx } from "../db.js";
import { epley1RM, setVolume, shiftISO, todayISO } from "../../shared/rules.js";

// ---------- row shaping ----------
// node:sqlite returns null-prototype rows with snake_case columns; the client
// speaks camelCase, so every read goes through one of these mappers.

export const toExercise = (r) => (!r ? null : {
  id: r.id, name: r.name, category: r.category, icon: r.icon,
  thumb: r.thumb, metric: r.metric, isCustom: !!r.is_custom,
});

// "3 sets · 10 reps" / "3 sets · 45s" — the design's subtitle line, with the
// target expressed in whatever unit the exercise is actually measured in.
function planSub(r) {
  const target = r.metric === "time" ? `${r.target_seconds}s` : `${r.target_reps} reps`;
  return `${r.target_sets} ${r.target_sets === 1 ? "set" : "sets"} · ${target}`;
}

export const toPlanItem = (r) => (!r ? null : {
  id: r.id, date: r.date, exerciseId: r.exercise_id, name: r.name,
  category: r.category, icon: r.icon, thumb: r.thumb, metric: r.metric,
  targetSets: r.target_sets, targetReps: r.target_reps, targetSeconds: r.target_seconds,
  completed: !!r.completed, source: r.source, position: r.position,
  sub: planSub(r),
});

export const toSet = (r) => (!r ? null : {
  id: r.id, date: r.date, exerciseId: r.exercise_id, exerciseName: r.name,
  metric: r.metric, weight: r.weight, reps: r.reps,
  durationSeconds: r.duration_seconds, rpe: r.rpe, createdAt: r.created_at,
});

// ---------- profile ----------
export function getProfile(userId) {
  const r = db.prepare(`SELECT * FROM profile WHERE id = ?`).get(userId);
  return { id: r.id, name: r.name, trainingStyle: r.training_style, unit: r.unit, muted: !!r.muted };
}

const PROFILE_FIELDS = {
  name: "name", trainingStyle: "training_style", unit: "unit", muted: "muted",
};

export function updateProfile(userId, patch) {
  const entries = Object.entries(patch).filter(([k]) => k in PROFILE_FIELDS);
  if (entries.length) {
    const setClause = entries.map(([k]) => `${PROFILE_FIELDS[k]} = ?`).join(", ");
    const values = entries.map(([, v]) => (typeof v === "boolean" ? Number(v) : v));
    db.prepare(`UPDATE profile SET ${setClause} WHERE id = ?`).run(...values, userId);
  }
  return getProfile(userId);
}

// ---------- exercises ----------
// The built-in catalog (owner_id IS NULL) is shared; custom exercises are
// visible only to the account that created them.
const VISIBLE_EXERCISE = `(owner_id IS NULL OR owner_id = ?)`;

export function listExercises(userId) {
  return db.prepare(`SELECT * FROM exercises WHERE ${VISIBLE_EXERCISE} ORDER BY is_custom, name`)
    .all(userId).map(toExercise);
}

export function getExercise(userId, id) {
  return toExercise(
    db.prepare(`SELECT * FROM exercises WHERE id = ? AND ${VISIBLE_EXERCISE}`).get(id, userId)
  );
}

export function createExercise(userId, { id, name, category = "", icon = "barbell", thumb, metric = "weight" }) {
  const base = id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "exercise";
  // Ids are global, so two accounts naming the same lift would collide on the
  // primary key. Suffix until free.
  let slug = base;
  const taken = db.prepare(`SELECT 1 FROM exercises WHERE id = ?`);
  for (let n = 2; taken.get(slug); n++) slug = `${base}-${n}`;

  db.prepare(`
    INSERT INTO exercises (id, name, category, icon, thumb, metric, is_custom, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run(slug, name, category, icon, thumb || "linear-gradient(135deg,#3a3a3c,#1c1c1e)", metric, userId);
  return getExercise(userId, slug);
}

// ---------- plan ----------
const PLAN_SELECT = `
  SELECT p.*, e.name, e.category, e.icon, e.thumb, e.metric
  FROM plan_items p JOIN exercises e ON e.id = p.exercise_id
  WHERE p.profile_id = ?
`;

export function listPlan(userId, date) {
  return db.prepare(`${PLAN_SELECT} AND p.date = ? ORDER BY p.position, p.id`)
    .all(userId, date).map(toPlanItem);
}

export function getPlanItem(userId, id) {
  return toPlanItem(db.prepare(`${PLAN_SELECT} AND p.id = ?`).get(userId, id));
}

export function addPlanItem(userId, { date, exerciseId, targetSets = 3, targetReps = 10, targetSeconds = 45, source = "plan" }) {
  const exercise = getExercise(userId, exerciseId);
  if (!exercise) return null;
  const { next } = db.prepare(
    `SELECT COALESCE(MAX(position) + 1, 0) AS next FROM plan_items WHERE profile_id = ? AND date = ?`
  ).get(userId, date);
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO plan_items (profile_id, date, exercise_id, target_sets, target_reps, target_seconds, source, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, date, exerciseId, targetSets, targetReps, targetSeconds, source, next);
  return getPlanItem(userId, Number(lastInsertRowid));
}

export function updatePlanItem(userId, id, { completed }) {
  if (completed !== undefined) {
    db.prepare(`UPDATE plan_items SET completed = ? WHERE id = ? AND profile_id = ?`)
      .run(Number(!!completed), id, userId);
  }
  return getPlanItem(userId, id);
}

export function deletePlanItem(userId, id) {
  const { changes } = db.prepare(`DELETE FROM plan_items WHERE id = ? AND profile_id = ?`).run(id, userId);
  return changes > 0;
}

export function completeAllPlanItems(userId, date) {
  db.prepare(`UPDATE plan_items SET completed = 1 WHERE profile_id = ? AND date = ?`).run(userId, date);
  return listPlan(userId, date);
}

// ---------- sets ----------
const SET_SELECT = `
  SELECT s.*, e.name, e.metric FROM sets s JOIN exercises e ON e.id = s.exercise_id
  WHERE s.profile_id = ?
`;

export function listSets(userId, { from, to, exerciseId } = {}) {
  const clauses = [];
  const params = [userId];
  if (from) { clauses.push("s.date >= ?"); params.push(from); }
  if (to) { clauses.push("s.date <= ?"); params.push(to); }
  if (exerciseId) { clauses.push("s.exercise_id = ?"); params.push(exerciseId); }
  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  return db.prepare(`${SET_SELECT}${where} ORDER BY s.date, s.id`).all(...params).map(toSet);
}

export function getSet(userId, id) {
  return toSet(db.prepare(`${SET_SELECT} AND s.id = ?`).get(userId, id));
}

export function addSet(userId, { date = todayISO(), exerciseId, weight = 0, reps = 0, durationSeconds = 0, rpe = null }) {
  const exercise = getExercise(userId, exerciseId);
  if (!exercise) return null;
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO sets (profile_id, date, exercise_id, weight, reps, duration_seconds, rpe)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, date, exerciseId, weight, reps, durationSeconds, rpe);
  return getSet(userId, Number(lastInsertRowid));
}

export function deleteSet(userId, id) {
  const { changes } = db.prepare(`DELETE FROM sets WHERE id = ? AND profile_id = ?`).run(id, userId);
  return changes > 0;
}

// ---------- advisor ----------
// Suggestions are ranked by neglect: lifts absent from the plan today, least
// recently trained first. Anything already swiped today drops out of the queue.
export function advisorQueue(userId, date, limit = 6) {
  const rows = db.prepare(`
    SELECT e.*, (
      SELECT MAX(s.date) FROM sets s WHERE s.exercise_id = e.id AND s.profile_id = ?
    ) AS last_trained
    FROM exercises e
    WHERE (e.owner_id IS NULL OR e.owner_id = ?)
      AND e.id NOT IN (SELECT exercise_id FROM plan_items      WHERE profile_id = ? AND date = ?)
      AND e.id NOT IN (SELECT exercise_id FROM advisor_reviews WHERE profile_id = ? AND date = ?)
    ORDER BY last_trained IS NOT NULL, last_trained ASC, e.name
    LIMIT ?
  `).all(userId, userId, userId, date, userId, date, limit);
  return rows.map((r) => ({ ...toExercise(r), lastTrained: r.last_trained }));
}

export function reviewAdvisorCard(userId, { date, exerciseId, accepted }) {
  db.prepare(`
    INSERT INTO advisor_reviews (profile_id, date, exercise_id, accepted) VALUES (?, ?, ?, ?)
    ON CONFLICT(profile_id, date, exercise_id) DO UPDATE SET accepted = excluded.accepted
  `).run(userId, date, exerciseId, Number(!!accepted));
  return accepted ? addPlanItem(userId, { date, exerciseId, source: "advisor" }) : null;
}

// ---------- analytics ----------
// Month view for the Home calendar: which days have activity, plus the
// headline counters above it. Volume is weight moved (weight × reps), so
// bodyweight and timed work contributes nothing to it by design.
export function monthSummary(userId, month) {
  const from = `${month}-01`;
  const to = `${month}-31`;
  const setDays = db.prepare(`
    SELECT date, SUM(weight * reps) AS volume FROM sets
    WHERE profile_id = ? AND date BETWEEN ? AND ? GROUP BY date
  `).all(userId, from, to);
  const planDays = db.prepare(`
    SELECT date FROM plan_items
    WHERE profile_id = ? AND completed = 1 AND date BETWEEN ? AND ? GROUP BY date
  `).all(userId, from, to);

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
export function sessionSummary(userId, date) {
  const sets = listSets(userId, { from: date, to: date });
  const plan = listPlan(userId, date);
  const profile = getProfile(userId);
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
export function exerciseProgress(userId, exerciseId, weeks = 8) {
  const exercise = getExercise(userId, exerciseId);
  if (!exercise) return null;
  const profile = getProfile(userId);
  const unit = exercise.metric === "weight" ? profile.unit : exercise.metric === "time" ? "s" : "reps";
  const from = shiftISO(todayISO(), -weeks * 7);
  const sets = listSets(userId, { from, exerciseId });

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
export function trackedExercises(userId, minSessions = 1) {
  return db.prepare(`
    SELECT e.*, COUNT(DISTINCT s.date) AS sessions, MAX(s.date) AS last_trained
    FROM exercises e JOIN sets s ON s.exercise_id = e.id AND s.profile_id = ?
    WHERE (e.owner_id IS NULL OR e.owner_id = ?)
    GROUP BY e.id HAVING sessions >= ?
    ORDER BY last_trained DESC, e.name
  `).all(userId, userId, minSessions)
    .map((r) => ({ ...toExercise(r), sessions: r.sessions, lastTrained: r.last_trained }));
}

// ---------- insight log ----------
// The banner stays up for the whole day once an insight fires; dismissal is
// what hides it. `insight_events` therefore records what was surfaced (useful
// history) without feeding back into rule suppression.
export function dismissedToday(userId, date) {
  const rows = db.prepare(`SELECT insight_id FROM insight_events WHERE profile_id = ? AND date = ? AND dismissed = 1`).all(userId, date);
  return new Set(rows.map((r) => r.insight_id));
}

export function recordInsightShown(userId, insightId, date) {
  db.prepare(`INSERT OR IGNORE INTO insight_events (profile_id, insight_id, date) VALUES (?, ?, ?)`)
    .run(userId, insightId, date);
}

export function dismissInsight(userId, insightId, date) {
  db.prepare(`
    INSERT INTO insight_events (profile_id, insight_id, date, dismissed) VALUES (?, ?, ?, 1)
    ON CONFLICT(profile_id, insight_id, date) DO UPDATE SET dismissed = 1
  `).run(userId, insightId, date);
}

// ---------- danger zone ----------
// Wipes logged history and any custom exercises, but leaves the built-in
// catalog and the profile row intact so the app still boots into a usable state.
export function resetData(userId) {
  tx(() => {
    for (const table of ["sets", "plan_items", "advisor_reviews", "insight_events"]) {
      db.prepare(`DELETE FROM ${table} WHERE profile_id = ?`).run(userId);
    }
    db.prepare(`DELETE FROM exercises WHERE is_custom = 1 AND owner_id = ?`).run(userId);
  });
}
