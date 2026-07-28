import { COOKIE_NAME, readCookie, resolveSession, setSessionCookie } from "../lib/sessions.js";

// Attaches req.user when a valid session cookie is present. Never rejects —
// routes that need a user say so with requireAuth, so public endpoints
// (health, login, the SPA shell) stay reachable.
export function attachUser(req, res, next) {
  const token = readCookie(req, COOKIE_NAME);
  const session = token ? resolveSession(token) : null;
  if (session) {
    req.user = session.user;
    req.sessionToken = token;
    // Sliding expiry: re-stamp the cookie when the row was extended, so a
    // daily-use app never logs you out mid-week.
    if (session.refreshed) setSessionCookie(res, token);
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "authentication required" });
  next();
}

// Fixed-window limiter, in memory. This app runs as a single machine with a
// single volume (a Fly volume attaches to exactly one), so per-process state
// is per-deployment state. Swap for a shared store if that ever changes.
const buckets = new Map();

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, key: keyFn } = {}) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.ip;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      // Opportunistic sweep so the map can't grow without bound.
      if (buckets.size > 5000) {
        for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
      }
      return next();
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
      });
    }

    bucket.count += 1;
    next();
  };
}

export function clearRateLimit(key) {
  buckets.delete(key);
}
