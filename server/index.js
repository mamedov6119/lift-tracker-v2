import express from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DB_PATH } from "./db.js";
import { seed } from "./seed.js";
import { purgeExpiredSessions } from "./lib/sessions.js";
import { attachUser, requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import planRoutes from "./routes/plan.js";
import setRoutes from "./routes/sets.js";
import analyticsRoutes from "./routes/analytics.js";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

// Catalog is idempotent; demo history only lands on a first-run empty DB.
const seededDemo = seed();

export const app = express();
app.use(express.json());

// Declared before the auth middleware so Fly's health checks don't need
// credentials — a 401 here would mark the machine unhealthy and roll back
// every deploy.
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Reads the session cookie if present; never rejects on its own.
app.use(attachUser);

// Public: sign up, sign in, and the "am I signed in?" probe.
app.use("/api", authRoutes);

// Everything below needs an account. Each handler then scopes its queries to
// req.user.id, so one account can never read another's data.
app.use("/api", requireAuth);
app.use("/api", profileRoutes);
app.use("/api", planRoutes);
app.use("/api", setRoutes);
app.use("/api", analyticsRoutes);

app.use("/api", (req, res) => res.status(404).json({ error: `no route for ${req.method} ${req.originalUrl}` }));

// Express 5 passes thrown errors here; without this a bad request would hang.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "internal error" });
});

// In production the API also serves the built SPA, so there's one thing to
// deploy. In dev, Vite serves the client and proxies /api here.
const dist = resolve(here, "../dist");
const hasClient = existsSync(dist);
if (hasClient) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(resolve(dist, "index.html")));
}

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`lift-tracker api  →  http://localhost:${PORT}`);
    console.log(`sqlite            →  ${DB_PATH}`);
    if (seededDemo) console.log(`demo history seeded — delete ${DB_PATH} to reset`);
    if (!hasClient) {
      console.log("no dist/ found — serving the API only. Run `npm run build` to serve the app too.");
    }
    console.log(`auth              →  accounts, signup ${process.env.LIFT_SIGNUP_CODE ? "requires a code" : "open"}`);
    const purged = purgeExpiredSessions();
    if (purged) console.log(`sessions          →  purged ${purged} expired`);
  });
}
