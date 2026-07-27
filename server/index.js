import express from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DB_PATH } from "./db.js";
import { seed } from "./seed.js";
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

app.get("/api/health", (req, res) => res.json({ ok: true }));
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
  });
}
