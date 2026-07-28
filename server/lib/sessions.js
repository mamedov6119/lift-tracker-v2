import { createHash, randomBytes } from "node:crypto";
import { db } from "../db.js";

export const COOKIE_NAME = "lift_session";
const DAY = 24 * 60 * 60 * 1000;
export const SESSION_TTL_MS = 30 * DAY;
// Re-issued once it's this old, so an app in daily use never expires mid-week.
const REFRESH_AFTER_MS = 15 * DAY;

// Only the hash goes in the database. A stolen database copy then yields no
// usable sessions — the same reasoning as not storing raw passwords.
const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export function createSession(userId, userAgent = "") {
  const token = randomBytes(32).toString("base64url");
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, user_agent)
    VALUES (?, ?, ?, ?)
  `).run(hashToken(token), userId, new Date(Date.now() + SESSION_TTL_MS).toISOString(), userAgent.slice(0, 255));
  return token;
}

// Returns the owning user, or null. Expired rows are deleted on sight so the
// table self-cleans without a scheduled job.
export function resolveSession(token) {
  if (!token) return null;
  const id = hashToken(token);
  const row = db.prepare(`
    SELECT s.id, s.user_id, s.expires_at,
           u.email, u.name, u.created_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `).get(id);
  if (!row) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
    return null;
  }

  const remaining = new Date(row.expires_at).getTime() - Date.now();
  const shouldRefresh = remaining < SESSION_TTL_MS - REFRESH_AFTER_MS;
  if (shouldRefresh) {
    db.prepare(`UPDATE sessions SET expires_at = ? WHERE id = ?`)
      .run(new Date(Date.now() + SESSION_TTL_MS).toISOString(), id);
  }

  return {
    user: { id: row.user_id, email: row.email, name: row.name, createdAt: row.created_at },
    refreshed: shouldRefresh,
  };
}

export function destroySession(token) {
  if (!token) return;
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(hashToken(token));
}

// Used when a password changes: every other device is signed out.
export function destroyUserSessions(userId, exceptToken) {
  if (exceptToken) {
    db.prepare(`DELETE FROM sessions WHERE user_id = ? AND id != ?`).run(userId, hashToken(exceptToken));
  } else {
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
  }
}

export function purgeExpiredSessions() {
  const { changes } = db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(new Date().toISOString());
  return changes;
}

// Express has res.cookie but no cookie reader without cookie-parser; this is
// the whole of what we need from it.
export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

export function cookieOptions() {
  return {
    httpOnly: true, // unreadable from JS, so XSS can't exfiltrate the session
    secure: process.env.NODE_ENV === "production", // Fly terminates TLS; localhost is http
    sameSite: "lax", // blocks cross-site POSTs, which is our CSRF defence
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}
