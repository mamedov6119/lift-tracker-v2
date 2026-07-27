import { createHash, timingSafeEqual } from "node:crypto";

// Hashing first means the comparison is constant-time even when the supplied
// value is a different length from the real one — timingSafeEqual throws on
// mismatched buffer sizes, which would itself leak length.
const digest = (value) => createHash("sha256").update(String(value)).digest();
const safeEqual = (a, b) => timingSafeEqual(digest(a), digest(b));

// Single shared password over HTTP Basic. Not a user system — it's a lock on
// the front door of a single-profile app, which is what a personal training
// log on a public URL actually needs.
//
// With no password configured the middleware is a no-op, so local development
// stays friction-free; production without one logs a loud warning at boot.
export function basicAuth({ password, user = "lifter", exempt = [] } = {}) {
  return function basicAuthMiddleware(req, res, next) {
    if (!password) return next();
    if (exempt.includes(req.path)) return next();

    const [scheme, encoded] = (req.get("authorization") || "").split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const separator = decoded.indexOf(":");
      const suppliedUser = decoded.slice(0, separator);
      const suppliedPassword = decoded.slice(separator + 1);
      if (safeEqual(suppliedUser, user) && safeEqual(suppliedPassword, password)) {
        return next();
      }
    }

    res.set("WWW-Authenticate", 'Basic realm="Lift Tracker", charset="UTF-8"');
    res.status(401).json({ error: "authentication required" });
  };
}
