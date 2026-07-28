import { Router } from "express";
import { todayISO } from "../../shared/rules.js";
import * as repo from "../lib/repo.js";

const router = Router();

router.get("/plan", (req, res) => {
  res.json(repo.listPlan(req.user.id, req.query.date || todayISO()));
});

router.post("/plan", (req, res) => {
  const { exerciseId, date = todayISO(), targetSets, targetReps, targetSeconds } = req.body || {};
  if (!exerciseId) return res.status(400).json({ error: "exerciseId is required" });
  const item = repo.addPlanItem(req.user.id, { date, exerciseId, targetSets, targetReps, targetSeconds });
  if (!item) return res.status(404).json({ error: `unknown exercise: ${exerciseId}` });
  res.status(201).json(item);
});

router.patch("/plan/:id", (req, res) => {
  const item = repo.updatePlanItem(req.user.id, Number(req.params.id), req.body || {});
  if (!item) return res.status(404).json({ error: "plan item not found" });
  res.json(item);
});

router.delete("/plan/:id", (req, res) => {
  if (!repo.deletePlanItem(req.user.id, Number(req.params.id))) {
    return res.status(404).json({ error: "plan item not found" });
  }
  res.status(204).end();
});

// "Mark Complete" on the Training tab — one call rather than N patches.
router.post("/plan/complete-all", (req, res) => {
  res.json(repo.completeAllPlanItems(req.user.id, req.body?.date || todayISO()));
});

// ---------- exercise advisor ----------
router.get("/advisor", (req, res) => {
  res.json(repo.advisorQueue(req.user.id, req.query.date || todayISO()));
});

router.post("/advisor", (req, res) => {
  const { exerciseId, accepted = false, date = todayISO() } = req.body || {};
  if (!exerciseId) return res.status(400).json({ error: "exerciseId is required" });
  const planItem = repo.reviewAdvisorCard(req.user.id, { date, exerciseId, accepted });
  res.json({ accepted: !!accepted, planItem });
});

export default router;
