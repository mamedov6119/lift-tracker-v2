import { Router } from "express";
import { evaluateRules, todayISO } from "../../shared/rules.js";
import * as repo from "../lib/repo.js";

const router = Router();

router.get("/summary", (req, res) => {
  const month = req.query.month || todayISO().slice(0, 7);
  res.json(repo.monthSummary(month));
});

router.get("/session", (req, res) => {
  res.json(repo.sessionSummary(req.query.date || todayISO()));
});

router.get("/progress", (req, res) => {
  res.json(repo.trackedExercises());
});

router.get("/progress/:exerciseId", (req, res) => {
  const data = repo.exerciseProgress(req.params.exerciseId, Number(req.query.weeks) || 8);
  if (!data) return res.status(404).json({ error: "exercise not found" });
  res.json(data);
});

// The rules engine runs server-side over the full set history, so the same
// insight text is available to any future client (push notification, digest
// email) and not just this browser tab.
router.get("/insights", (req, res) => {
  const date = req.query.date || todayISO();
  const profile = repo.getProfile();
  if (profile.muted) return res.json([]);

  const dismissed = repo.dismissedToday(date);
  const insights = evaluateRules(repo.listSets(), {}).filter((i) => !dismissed.has(i.id));
  insights.forEach((i) => repo.recordInsightShown(i.id, date));
  res.json(insights);
});

router.post("/insights/:id/dismiss", (req, res) => {
  repo.dismissInsight(req.params.id, req.body?.date || todayISO());
  res.status(204).end();
});

export default router;
