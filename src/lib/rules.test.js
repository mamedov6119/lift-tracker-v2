import { describe, it, expect } from "vitest";
import { evaluateRules, daysBetween, epley1RM, todayISO } from "./rules.js";

// ---------- test helpers ----------
function isoOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

let idCounter = 0;
function set(dateOffset, overrides = {}) {
  return {
    id: `test-${idCounter++}`,
    date: isoOffset(dateOffset),
    exercise: "Squat",
    weight: 100,
    reps: 5,
    rpe: 7,
    ...overrides,
  };
}

function insightIds(insights) {
  return insights.map((i) => i.id);
}

// ---------- missed_session ----------
describe("missed_session rule", () => {
  it("does not fire with no logged data at all", () => {
    expect(insightIds(evaluateRules([], {}))).not.toContain("missed_session");
  });

  it("does not fire the same day as the last log", () => {
    const insights = evaluateRules([set(0)], {});
    expect(insightIds(insights)).not.toContain("missed_session");
  });

  it("does not fire after only a 1-day gap", () => {
    const insights = evaluateRules([set(-1)], {});
    expect(insightIds(insights)).not.toContain("missed_session");
  });

  it("fires at a 2-day gap", () => {
    const insights = evaluateRules([set(-2)], {});
    expect(insightIds(insights)).toContain("missed_session");
  });

  it("fires at a 3-day gap", () => {
    const insights = evaluateRules([set(-3)], {});
    expect(insightIds(insights)).toContain("missed_session");
  });

  it("does NOT fire once the gap exceeds 3 days (by design — see note below)", () => {
    const insights = evaluateRules([set(-4)], {});
    expect(insightIds(insights)).not.toContain("missed_session");
  });

  it("does not re-fire if already logged as shown today", () => {
    const insightLog = { missed_session: todayISO() };
    const insights = evaluateRules([set(-2)], insightLog);
    expect(insightIds(insights)).not.toContain("missed_session");
  });
});

// ---------- streak ----------
describe("streak rule", () => {
  it("does not fire at 2 consecutive days", () => {
    const insights = evaluateRules([set(0), set(-1)], {});
    expect(insightIds(insights)).not.toContain("streak");
  });

  it("fires at exactly 3 consecutive days", () => {
    const insights = evaluateRules([set(0), set(-1), set(-2)], {});
    const streak = insights.find((i) => i.id === "streak");
    expect(streak).toBeDefined();
    expect(streak.title).toContain("3-day");
  });

  it("counts higher streaks correctly", () => {
    const sets = [set(0), set(-1), set(-2), set(-3), set(-4)];
    const streak = evaluateRules(sets, {}).find((i) => i.id === "streak");
    expect(streak.title).toContain("5-day");
  });

  it("breaks the count on a gap day", () => {
    // logged today and yesterday, but missing 2 days ago
    const insights = evaluateRules([set(0), set(-1), set(-3)], {});
    expect(insightIds(insights)).not.toContain("streak");
  });
});

// ---------- effort_reassurance ----------
describe("effort_reassurance rule", () => {
  it("does not fire with fewer than 6 session-days of history", () => {
    const insights = evaluateRules([set(-2, { rpe: 9 }), set(-1, { rpe: 9 })], {});
    expect(insightIds(insights)).not.toContain("effort_reassurance");
  });

  it("fires when RPE rises but volume holds across 6+ sessions", () => {
    const sets = [
      set(-6, { rpe: 6, weight: 100, reps: 5 }),
      set(-5, { rpe: 6, weight: 100, reps: 5 }),
      set(-4, { rpe: 6, weight: 100, reps: 5 }),
      set(-3, { rpe: 8, weight: 100, reps: 5 }),
      set(-2, { rpe: 8, weight: 100, reps: 5 }),
      set(-1, { rpe: 8, weight: 100, reps: 5 }),
    ];
    expect(insightIds(evaluateRules(sets, {}))).toContain("effort_reassurance");
  });

  it("does not fire when volume actually drops alongside rising RPE", () => {
    const sets = [
      set(-6, { rpe: 6, weight: 100, reps: 8 }),
      set(-5, { rpe: 6, weight: 100, reps: 8 }),
      set(-4, { rpe: 6, weight: 100, reps: 8 }),
      set(-3, { rpe: 8, weight: 60, reps: 5 }),
      set(-2, { rpe: 8, weight: 60, reps: 5 }),
      set(-1, { rpe: 8, weight: 60, reps: 5 }),
    ];
    expect(insightIds(evaluateRules(sets, {}))).not.toContain("effort_reassurance");
  });

  it("does not fire when RPE hasn't meaningfully risen", () => {
    const sets = [
      set(-6, { rpe: 7, weight: 100, reps: 5 }),
      set(-5, { rpe: 7, weight: 100, reps: 5 }),
      set(-4, { rpe: 7, weight: 100, reps: 5 }),
      set(-3, { rpe: 7.2, weight: 100, reps: 5 }),
      set(-2, { rpe: 7.2, weight: 100, reps: 5 }),
      set(-1, { rpe: 7.2, weight: 100, reps: 5 }),
    ];
    expect(insightIds(evaluateRules(sets, {}))).not.toContain("effort_reassurance");
  });
});

// ---------- helper functions ----------
describe("epley1RM", () => {
  it("estimates a higher 1RM for more reps at the same weight", () => {
    expect(epley1RM(100, 5)).toBeGreaterThan(epley1RM(100, 1));
  });
});

describe("daysBetween", () => {
  it("computes whole-day differences between ISO dates", () => {
    expect(daysBetween("2026-07-01", "2026-07-04")).toBe(3);
  });
});
