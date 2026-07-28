import { db, LEGACY_PROFILE_ID, tx } from "./db.js";
import { shiftISO, todayISO } from "../shared/rules.js";

// Thumbs are the gradient swatches from the design — cheap, asset-free art
// direction that still gives each exercise a recognisable colour.
const GRADIENT = {
  iron: "linear-gradient(135deg,#3a361c,#1c1c1e)",
  steel: "linear-gradient(135deg,#3a3a3c,#1c1c1e)",
  moss: "linear-gradient(135deg,#2a3a2e,#1c1c1e)",
  slate: "linear-gradient(135deg,#2a2e3a,#1c1c1e)",
  plum: "linear-gradient(135deg,#332a3c,#1c1c1e)",
};

export const CATALOG = [
  { id: "back-squat",     name: "Back Squat",        category: "Compound · Legs",            icon: "barbell", thumb: GRADIENT.iron,  metric: "weight" },
  { id: "bench-press",    name: "Bench Press",       category: "Compound · Chest",           icon: "barbell", thumb: GRADIENT.iron,  metric: "weight" },
  { id: "deadlift",       name: "Deadlift",          category: "Compound · Posterior chain", icon: "barbell", thumb: GRADIENT.iron,  metric: "weight" },
  { id: "front-squat",    name: "Front Squat",       category: "Compound · Legs",            icon: "barbell", thumb: GRADIENT.iron,  metric: "weight" },
  { id: "rdl",            name: "Romanian Deadlift", category: "Compound · Posterior chain", icon: "barbell", thumb: GRADIENT.iron,  metric: "weight" },
  { id: "hip-thrust",     name: "Hip Thrust",        category: "Compound · Glutes",          icon: "barbell", thumb: GRADIENT.iron,  metric: "weight" },
  { id: "bent-row",       name: "Bent-over Row",     category: "Compound · Back",            icon: "arrows",  thumb: GRADIENT.slate, metric: "weight" },
  { id: "overhead-press", name: "Overhead Press",    category: "Compound · Shoulders",       icon: "barbell", thumb: GRADIENT.slate, metric: "weight" },
  { id: "farmers-carry",  name: "Farmer's Carry",    category: "Loaded carry · Full body",   icon: "arrows",  thumb: GRADIENT.slate, metric: "time" },
  { id: "pull-up",        name: "Pull-up",           category: "Bodyweight · Back",          icon: "chevron", thumb: GRADIENT.moss,  metric: "reps" },
  { id: "walking-lunge",  name: "Walking Lunges",    category: "Unilateral · Legs",          icon: "chevron", thumb: GRADIENT.moss,  metric: "reps" },
  { id: "box-jump",       name: "Box Jumps",         category: "Plyometric · Power",         icon: "chevron", thumb: GRADIENT.moss,  metric: "reps" },
  { id: "push-up",        name: "Push-up",           category: "Bodyweight · Chest",         icon: "chevron", thumb: GRADIENT.moss,  metric: "reps" },
  { id: "battle-ropes",   name: "Battle Ropes",      category: "Conditioning · Full body",   icon: "rope",    thumb: GRADIENT.steel, metric: "time" },
  { id: "plank",          name: "Plank Hold",        category: "Core · Isometric",           icon: "rope",    thumb: GRADIENT.plum,  metric: "time" },
  { id: "dead-hang",      name: "Dead Hang",         category: "Grip · Isometric",           icon: "rope",    thumb: GRADIENT.plum,  metric: "time" },
];

export function seedCatalog() {
  const upsert = db.prepare(`
    INSERT INTO exercises (id, name, category, icon, thumb, metric, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, category = excluded.category, icon = excluded.icon,
      thumb = excluded.thumb, metric = excluded.metric
  `);
  tx(() => {
    for (const e of CATALOG) upsert.run(e.id, e.name, e.category, e.icon, e.thumb, e.metric);
  });
}

// Eight weeks of plausible history. Without it the progress charts and the
// calendar have nothing to draw, which makes the app impossible to evaluate.
// Skipped entirely once any real set exists.
export function seedDemoData() {
  const { count } = db.prepare(`SELECT COUNT(*) AS count FROM sets`).get();
  if (count > 0) return false;
  // Demo data lands under the legacy profile, which the first account created
  // then adopts (see createUserWithProfile). Never runs once accounts exist.
  if (db.prepare(`SELECT COUNT(*) AS n FROM users`).get().n > 0) return false;
  db.prepare(`INSERT OR IGNORE INTO profile (id, name) VALUES (?, ?)`).run(LEGACY_PROFILE_ID, "Athlete");

  const today = todayISO();
  const insertSet = db.prepare(`
    INSERT INTO sets (profile_id, date, exercise_id, weight, reps, duration_seconds, rpe)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPlan = db.prepare(`
    INSERT INTO plan_items (profile_id, date, exercise_id, target_sets, target_reps, target_seconds, completed, source, position)
    VALUES (?, ?, ?, ?, ?, ?, 0, 'plan', ?)
  `);

  // Three training days a week, rotating the big three plus accessories.
  // [exerciseId, baseWeight, baseReps, baseSeconds]
  const week = [
    { offset: 0, lifts: [["back-squat", 225, 5, 0], ["walking-lunge", 0, 20, 0], ["plank", 0, 0, 45]] },
    { offset: 2, lifts: [["bench-press", 155, 5, 0], ["bent-row", 135, 8, 0], ["battle-ropes", 0, 0, 40]] },
    { offset: 4, lifts: [["deadlift", 275, 3, 0], ["hip-thrust", 185, 10, 0], ["pull-up", 0, 8, 0]] },
  ];
  // Weekly growth per lift, so the Progress tab shows a real trend.
  const growth = {
    "back-squat": 4.3, "bench-press": 2.9, deadlift: 5.7,
    "hip-thrust": 3.0, "bent-row": 2.0, "walking-lunge": 1.7,
    "battle-ropes": 3.2, "pull-up": 0.6, plank: 4.5,
  };

  tx(() => {
    for (let weekIdx = 7; weekIdx >= 0; weekIdx--) {
      // Anchor each block to a Monday `weekIdx` weeks back from today.
      const monday = shiftISO(today, -(weekIdx * 7) - ((new Date(today).getDay() + 6) % 7));
      const elapsed = 7 - weekIdx;
      for (const day of week) {
        const date = shiftISO(monday, day.offset);
        if (date > today) continue;
        for (const [exerciseId, baseWeight, baseReps, baseSeconds] of day.lifts) {
          const step = growth[exerciseId] * elapsed;
          const weight = baseWeight ? Math.round((baseWeight + step) / 5) * 5 : 0;
          const reps = baseReps ? (baseWeight ? baseReps : Math.round(baseReps + step)) : 0;
          const seconds = baseSeconds ? Math.round(baseSeconds + step) : 0;
          // RPE drifts up across the block — this is what feeds the
          // effort-reassurance and high-effort rules.
          const rpe = Math.min(10, 6.5 + elapsed * 0.35);
          insertSet.run(LEGACY_PROFILE_ID, date, exerciseId, weight, reps, seconds, Number(rpe.toFixed(1)));
        }
      }
    }

    // Today's plan: two items still open, matching the design's Home screen.
    const plan = [
      ["battle-ropes", 3, 0, 45],
      ["plank", 3, 0, 60],
    ];
    plan.forEach(([exerciseId, sets, reps, seconds], i) => {
      insertPlan.run(LEGACY_PROFILE_ID, today, exerciseId, sets, reps, seconds, i);
    });
  });

  return true;
}

// The catalog is real reference data and always loads. The demo history is
// fabricated, so it must never appear in production: a deployed app that
// invents eight weeks of lifts you never did is worse than an empty one.
//   LIFT_SEED_DEMO=1  force it on   (e.g. a staging demo)
//   LIFT_SEED_DEMO=0  force it off
//   unset             on in dev, off in production
export function shouldSeedDemo() {
  if (process.env.LIFT_SEED_DEMO === "1") return true;
  if (process.env.LIFT_SEED_DEMO === "0") return false;
  return process.env.NODE_ENV !== "production";
}

export function seed() {
  seedCatalog();
  return shouldSeedDemo() ? seedDemoData() : false;
}
