import { Router } from "express";
import { db, hasLegacyData, LEGACY_PROFILE_ID, tx } from "../db.js";
import {
  fakeVerify, hashPassword, normalizeEmail, validateEmail, validatePassword, verifyPassword,
} from "../lib/passwords.js";
import {
  clearSessionCookie, createSession, destroySession, destroyUserSessions, setSessionCookie,
} from "../lib/sessions.js";
import { rateLimit, requireAuth } from "../middleware/auth.js";

const router = Router();

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, createdAt: u.created_at ?? u.createdAt });

// Optional gate for personal deployments: with LIFT_SIGNUP_CODE set, a new
// account needs the code. Unset means open registration.
function signupAllowed(code) {
  const required = process.env.LIFT_SIGNUP_CODE;
  if (!required) return true;
  return typeof code === "string" && code.trim() === required;
}

// Everything logged before accounts existed lives under profile id 1. The very
// first account created takes it over, so an existing deployment's history
// survives the upgrade instead of being stranded.
function createUserWithProfile({ email, passwordHash, name }) {
  return tx(() => {
    const adopt = hasLegacyData();
    const { lastInsertRowid } = db.prepare(
      `INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)`
    ).run(email, passwordHash, name);
    const id = Number(lastInsertRowid);

    if (adopt && id === LEGACY_PROFILE_ID) {
      db.prepare(`UPDATE profile SET name = ? WHERE id = ?`).run(name, id);
    } else {
      db.prepare(`INSERT OR IGNORE INTO profile (id, name) VALUES (?, ?)`).run(id, name);
    }
    return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  });
}

router.post(
  "/auth/signup",
  rateLimit({ max: 5, windowMs: 60 * 60 * 1000 }),
  async (req, res) => {
    const { password, name, signupCode } = req.body || {};
    const email = normalizeEmail(req.body?.email);

    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ error: emailError });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });
    if (!signupAllowed(signupCode)) {
      return res.status(403).json({ error: "This app requires a signup code." });
    }

    if (db.prepare(`SELECT 1 FROM users WHERE email = ? COLLATE NOCASE`).get(email)) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const displayName = (typeof name === "string" && name.trim()) || email.split("@")[0];
    const user = createUserWithProfile({
      email,
      passwordHash: await hashPassword(password),
      name: displayName.slice(0, 60),
    });

    setSessionCookie(res, createSession(user.id, req.get("user-agent") || ""));
    res.status(201).json(publicUser(user));
  }
);

router.post(
  "/auth/login",
  // Keyed on the address, not the IP, so one account under attack can't lock
  // out everyone behind the same NAT.
  rateLimit({ max: 10, windowMs: 15 * 60 * 1000, key: (req) => `login:${normalizeEmail(req.body?.email)}` }),
  async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body || {};

    const row = email ? db.prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`).get(email) : null;

    // Same message and comparable timing whether or not the account exists, so
    // this endpoint can't be used to enumerate registered addresses.
    const ok = row && typeof password === "string"
      ? await verifyPassword(password, row.password_hash)
      : await fakeVerify();

    if (!ok) return res.status(401).json({ error: "Incorrect email or password." });

    setSessionCookie(res, createSession(row.id, req.get("user-agent") || ""));
    res.json(publicUser(row));
  }
);

router.post("/auth/logout", (req, res) => {
  destroySession(req.sessionToken);
  clearSessionCookie(res);
  res.status(204).end();
});

// The client calls this on boot to learn whether it has a live session.
router.get("/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "not signed in" });
  res.json(req.user);
});

router.post("/auth/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const error = validatePassword(newPassword);
  if (error) return res.status(400).json({ error });

  const row = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(req.user.id);
  if (!(await verifyPassword(currentPassword ?? "", row.password_hash))) {
    return res.status(403).json({ error: "Current password is incorrect." });
  }

  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`)
    .run(await hashPassword(newPassword), req.user.id);
  // Signs out every other device — the point of changing a password.
  destroyUserSessions(req.user.id, req.sessionToken);
  res.status(204).end();
});

export default router;
