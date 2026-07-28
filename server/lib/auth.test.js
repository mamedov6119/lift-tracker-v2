import { beforeAll, describe, expect, it } from "vitest";

// Every test here shares one in-memory database. Set before importing db.js,
// which reads the path at module load.
process.env.LIFT_DB = ":memory:";
process.env.LIFT_SEED_DEMO = "0";

const { hashPassword, verifyPassword, validatePassword, validateEmail, normalizeEmail } =
  await import("./passwords.js");
const { createSession, resolveSession, destroySession, destroyUserSessions, purgeExpiredSessions, readCookie } =
  await import("./sessions.js");
const { db } = await import("../db.js");
const repo = await import("./repo.js");

// ---------- passwords ----------
describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("Correct horse battery", hash)).toBe(false);
  });

  it("never stores the password itself", async () => {
    const hash = await hashPassword("hunter2hunter2");
    expect(hash).not.toContain("hunter2hunter2");
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("salts, so the same password hashes differently every time", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a).not.toEqual(b);
    expect(await verifyPassword("same password", a)).toBe(true);
    expect(await verifyPassword("same password", b)).toBe(true);
  });

  it("can still verify hashes written with weaker parameters", async () => {
    // Simulates raising the cost factor later: the params live in the string.
    const { scrypt } = await import("node:crypto");
    const { promisify } = await import("node:util");
    const derive = promisify(scrypt);
    const salt = Buffer.alloc(16, 7);
    const key = await derive("legacy pw", salt, 64, { N: 1024, r: 8, p: 1 });
    const legacy = `scrypt$1024$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
    expect(await verifyPassword("legacy pw", legacy)).toBe(true);
    expect(await verifyPassword("wrong", legacy)).toBe(false);
  });

  it("does not throw on malformed stored hashes", async () => {
    for (const bad of ["", "nonsense", "scrypt$x", null, undefined, "scrypt$1$2$3$$"]) {
      expect(await verifyPassword("whatever", bad)).toBe(false);
    }
  });

  it("enforces a minimum length and rejects absurd input", () => {
    expect(validatePassword("short")).toBeTruthy();
    expect(validatePassword("longenough")).toBeNull();
    expect(validatePassword("x".repeat(500))).toBeTruthy();
  });

  it("validates and normalises emails", () => {
    expect(normalizeEmail("  Murad@Example.COM ")).toBe("murad@example.com");
    expect(validateEmail("murad@example.com")).toBeNull();
    expect(validateEmail("not-an-email")).toBeTruthy();
    expect(validateEmail("")).toBeTruthy();
  });
});

// ---------- sessions ----------
describe("sessions", () => {
  let userId;
  beforeAll(() => {
    const { lastInsertRowid } = db.prepare(
      `INSERT INTO users (email, password_hash, name) VALUES ('a@example.com', 'x', 'A')`
    ).run();
    userId = Number(lastInsertRowid);
  });

  it("resolves a freshly issued token to its user", () => {
    const token = createSession(userId);
    expect(resolveSession(token).user.id).toBe(userId);
  });

  it("stores only a hash of the token", () => {
    const token = createSession(userId);
    const rows = db.prepare(`SELECT id FROM sessions`).all();
    expect(rows.some((r) => r.id === token)).toBe(false);
  });

  it("rejects unknown, empty and tampered tokens", () => {
    const token = createSession(userId);
    expect(resolveSession("not-a-real-token")).toBeNull();
    expect(resolveSession("")).toBeNull();
    expect(resolveSession(null)).toBeNull();
    expect(resolveSession(token + "x")).toBeNull();
  });

  it("stops resolving after logout", () => {
    const token = createSession(userId);
    destroySession(token);
    expect(resolveSession(token)).toBeNull();
  });

  it("rejects an expired session and drops the row it looked up", () => {
    const token = createSession(userId);
    const before = db.prepare(`SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?`).get(userId).n;
    db.prepare(`UPDATE sessions SET expires_at = ? WHERE user_id = ?`)
      .run(new Date(Date.now() - 1000).toISOString(), userId);

    expect(resolveSession(token)).toBeNull();
    // Only the row that was actually resolved gets deleted — the rest are
    // cleared by purgeExpiredSessions at boot, not on every request.
    const after = db.prepare(`SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?`).get(userId).n;
    expect(after).toBe(before - 1);
  });

  it("signs out other devices but keeps the current one", () => {
    const keep = createSession(userId);
    const other = createSession(userId);
    destroyUserSessions(userId, keep);
    expect(resolveSession(keep)).not.toBeNull();
    expect(resolveSession(other)).toBeNull();
  });

  it("purges expired rows", () => {
    createSession(userId);
    db.prepare(`UPDATE sessions SET expires_at = ?`).run(new Date(Date.now() - 1000).toISOString());
    expect(purgeExpiredSessions()).toBeGreaterThan(0);
  });

  it("parses the session cookie out of a crowded header", () => {
    const req = { headers: { cookie: "other=1; lift_session=abc123; another=2" } };
    expect(readCookie(req, "lift_session")).toBe("abc123");
    expect(readCookie({ headers: {} }, "lift_session")).toBeNull();
  });
});

// ---------- per-user data isolation ----------
// The point of the whole refactor: one account must never see another's data.
describe("data isolation between accounts", () => {
  let alice;
  let bob;

  beforeAll(() => {
    const mk = (email) => {
      const { lastInsertRowid } = db.prepare(
        `INSERT INTO users (email, password_hash, name) VALUES (?, 'x', ?)`
      ).run(email, email);
      const id = Number(lastInsertRowid);
      db.prepare(`INSERT INTO profile (id, name) VALUES (?, ?)`).run(id, email);
      return id;
    };
    alice = mk("alice@example.com");
    bob = mk("bob@example.com");
    db.prepare(`
      INSERT INTO exercises (id, name, category, icon, thumb, metric, is_custom, owner_id)
      VALUES ('squat-shared', 'Squat', '', 'barbell', '', 'weight', 0, NULL)
    `).run();
  });

  it("keeps logged sets private", () => {
    repo.addSet(alice, { date: "2026-01-05", exerciseId: "squat-shared", weight: 100, reps: 5 });
    expect(repo.listSets(alice).length).toBe(1);
    expect(repo.listSets(bob).length).toBe(0);
  });

  it("will not delete another account's set", () => {
    const set = repo.addSet(alice, { date: "2026-01-06", exerciseId: "squat-shared", weight: 100, reps: 5 });
    expect(repo.deleteSet(bob, set.id)).toBe(false);
    expect(repo.getSet(alice, set.id)).not.toBeNull();
  });

  it("keeps plan items private", () => {
    const item = repo.addPlanItem(alice, { date: "2026-01-07", exerciseId: "squat-shared" });
    expect(repo.listPlan(bob, "2026-01-07")).toEqual([]);
    expect(repo.getPlanItem(bob, item.id)).toBeNull();
    expect(repo.deletePlanItem(bob, item.id)).toBe(false);
  });

  it("hides custom exercises from other accounts but shares the catalog", () => {
    const custom = repo.createExercise(alice, { name: "Zercher Squat", metric: "weight" });
    expect(repo.getExercise(alice, custom.id)).not.toBeNull();
    expect(repo.getExercise(bob, custom.id)).toBeNull();

    const bobIds = repo.listExercises(bob).map((e) => e.id);
    expect(bobIds).not.toContain(custom.id);
    expect(bobIds).toContain("squat-shared");
  });

  it("gives colliding custom names distinct ids per account", () => {
    const a = repo.createExercise(alice, { name: "Sissy Squat", metric: "weight" });
    const b = repo.createExercise(bob, { name: "Sissy Squat", metric: "weight" });
    expect(a.id).not.toBe(b.id);
    expect(repo.getExercise(alice, b.id)).toBeNull();
  });

  it("scopes analytics to the account", () => {
    expect(repo.monthSummary(bob, "2026-01").totalVolume).toBe(0);
    expect(repo.monthSummary(alice, "2026-01").totalVolume).toBeGreaterThan(0);
    expect(repo.trackedExercises(bob)).toEqual([]);
  });

  it("resets only the calling account's data", () => {
    repo.addSet(bob, { date: "2026-02-01", exerciseId: "squat-shared", weight: 60, reps: 5 });
    const aliceBefore = repo.listSets(alice).length;
    repo.resetData(bob);
    expect(repo.listSets(bob).length).toBe(0);
    expect(repo.listSets(alice).length).toBe(aliceBefore);
    // Alice's custom exercises survive Bob's reset.
    expect(repo.listExercises(alice).some((e) => e.isCustom)).toBe(true);
  });
});
