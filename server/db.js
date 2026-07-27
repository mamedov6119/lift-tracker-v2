import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// node:sqlite ships with Node — no native module to compile, no service to run.
// Point LIFT_DB at :memory: in tests, or at another path to keep separate data.
export const DB_PATH = process.env.LIFT_DB || resolve(here, "../data/lift.db");

if (DB_PATH !== ":memory:") mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// Single-user app for now (see PROFILE_ID): every row belongs to profile 1.
// The columns are already shaped so adding a real users table later is a
// matter of relaxing the constant, not reshaping the schema.
export const PROFILE_ID = 1;

// Each exercise is measured one way, and that choice drives the log form, the
// plan subtitle and the progress chart:
//   weight — barbell/dumbbell work, charted as estimated 1RM
//   reps   — bodyweight work (pull-ups, box jumps), charted as best reps
//   time   — held or continuous work (planks, battle ropes), charted as seconds
export const METRICS = ["weight", "reps", "time"];

db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id            INTEGER PRIMARY KEY,
    name          TEXT    NOT NULL DEFAULT 'Athlete',
    training_style TEXT   NOT NULL DEFAULT 'Powerlifting',
    unit          TEXT    NOT NULL DEFAULT 'lb',
    muted         INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id        TEXT PRIMARY KEY,
    name      TEXT    NOT NULL,
    category  TEXT    NOT NULL DEFAULT '',
    icon      TEXT    NOT NULL DEFAULT 'barbell',
    thumb     TEXT    NOT NULL DEFAULT 'linear-gradient(135deg,#3a3a3c,#1c1c1e)',
    metric    TEXT    NOT NULL DEFAULT 'weight',
    is_custom INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS plan_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id     INTEGER NOT NULL DEFAULT 1,
    date           TEXT    NOT NULL,
    exercise_id    TEXT    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    target_sets    INTEGER NOT NULL DEFAULT 3,
    target_reps    INTEGER NOT NULL DEFAULT 10,
    target_seconds INTEGER NOT NULL DEFAULT 45,
    completed      INTEGER NOT NULL DEFAULT 0,
    source         TEXT    NOT NULL DEFAULT 'plan',
    position       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sets (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id       INTEGER NOT NULL DEFAULT 1,
    date             TEXT    NOT NULL,
    exercise_id      TEXT    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    weight           REAL    NOT NULL DEFAULT 0,
    reps             INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    rpe              REAL,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- One row per exercise the advisor has already shown, so a card the lifter
  -- swiped away doesn't come back the same day.
  CREATE TABLE IF NOT EXISTS advisor_reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id  INTEGER NOT NULL DEFAULT 1,
    date        TEXT    NOT NULL,
    exercise_id TEXT    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    accepted    INTEGER NOT NULL DEFAULT 0,
    UNIQUE (profile_id, date, exercise_id)
  );

  -- Cooldown log for the rules engine: an insight surfaces once per day.
  CREATE TABLE IF NOT EXISTS insight_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL DEFAULT 1,
    insight_id TEXT    NOT NULL,
    date       TEXT    NOT NULL,
    dismissed  INTEGER NOT NULL DEFAULT 0,
    UNIQUE (profile_id, insight_id, date)
  );

  CREATE INDEX IF NOT EXISTS idx_sets_date     ON sets (profile_id, date);
  CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets (profile_id, exercise_id, date);
  CREATE INDEX IF NOT EXISTS idx_plan_date     ON plan_items (profile_id, date);
`);

// ---------- migrations ----------
// Calorie tracking was dropped and exercises gained an explicit metric. These
// run against databases created before that change; on a fresh file every
// column already matches and each step is a no-op.
const columns = (table) =>
  new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name));

function addColumn(table, name, definition) {
  if (!columns(table).has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
}

function dropColumn(table, name) {
  if (columns(table).has(name)) db.exec(`ALTER TABLE ${table} DROP COLUMN ${name}`);
}

addColumn("exercises", "metric", "TEXT NOT NULL DEFAULT 'weight'");
addColumn("sets", "duration_seconds", "INTEGER NOT NULL DEFAULT 0");
addColumn("plan_items", "target_seconds", "INTEGER NOT NULL DEFAULT 45");

// Carry the old per-exercise `unit` over to `metric` before it goes away:
// 'kcal' and 'sets' were the timed exercises, 'reps' the bodyweight ones.
if (columns("exercises").has("unit")) {
  db.exec(`
    UPDATE exercises SET metric = CASE
      WHEN unit IN ('kcal', 'sets', 'time') THEN 'time'
      WHEN unit = 'reps' THEN 'reps'
      ELSE 'weight'
    END
  `);
}

dropColumn("exercises", "unit");
dropColumn("exercises", "kcal_per_rep");
dropColumn("plan_items", "kcal");
dropColumn("sets", "kcal");
dropColumn("profile", "kcal_goal");

db.prepare(`INSERT OR IGNORE INTO profile (id, name) VALUES (?, 'Athlete')`).run(PROFILE_ID);

export function tx(fn) {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
