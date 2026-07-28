import { Router } from "express";
import { evaluateRules, todayISO } from "../../shared/rules.js";
import * as repo from "../lib/repo.js";

const router = Router();

router.get("/summary", (req, res) => {
  const month = req.query.month || todayISO().slice(0, 7);
  res.json(repo.monthSummary(req.user.id, month));
});

router.get("/session", (req, res) => {
  res.json(repo.sessionSummary(req.user.id, req.query.date || todayISO()));
});

router.get("/progress", (req, res) => {
  res.json(repo.trackedExercises(req.user.id));
});

router.get("/progress/:exerciseId", (req, res) => {
  const data = repo.exerciseProgress(req.user.id, req.params.exerciseId, Number(req.query.weeks) || 8);
  if (!data) return res.status(404).json({ error: "exercise not found" });
  res.json(data);
});

// The rules engine runs server-side over the full set history, so the same
// insight text is available to any future client (push notification, digest
// email) and not just this browser tab.
router.get("/insights", (req, res) => {
  const date = req.query.date || todayISO();
  const profile = repo.getProfile(req.user.id);
  if (profile.muted) return res.json([]);

  const dismissed = repo.dismissedToday(req.user.id, date);
  const insights = evaluateRules(repo.listSets(req.user.id), {}).filter((i) => !dismissed.has(i.id));
  insights.forEach((i) => repo.recordInsightShown(req.user.id, i.id, date));
  res.json(insights);
});

router.post("/insights/:id/dismiss", (req, res) => {
  repo.dismissInsight(req.user.id, req.params.id, req.body?.date || todayISO());
  res.status(204).end();
});

export default router;
