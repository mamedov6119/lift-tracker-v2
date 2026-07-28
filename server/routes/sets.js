import { Router } from "express";
import { todayISO } from "../../shared/rules.js";
import * as repo from "../lib/repo.js";

const router = Router();

router.get("/sets", (req, res) => {
  const { from, to, date, exerciseId } = req.query;
  res.json(repo.listSets(req.user.id, { from: date || from, to: date || to, exerciseId }));
});

router.post("/sets", (req, res) => {
  const { exerciseId, weight, reps, durationSeconds, rpe, date = todayISO() } = req.body || {};
  if (!exerciseId) return res.status(400).json({ error: "exerciseId is required" });

  const exercise = repo.getExercise(req.user.id, exerciseId);
  if (!exercise) return res.status(404).json({ error: `unknown exercise: ${exerciseId}` });

  // Timed exercises are measured in seconds and have no rep count; everything
  // else needs reps to mean anything.
  const positive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;
  if (exercise.metric === "time") {
    if (!positive(durationSeconds)) {
      return res.status(400).json({ error: "durationSeconds must be a positive number" });
    }
  } else if (!positive(reps)) {
    return res.status(400).json({ error: "reps must be a positive number" });
  }

  res.status(201).json(repo.addSet(req.user.id, {
    date, exerciseId,
    weight: Number(weight) || 0,
    reps: Number(reps) || 0,
    durationSeconds: Number(durationSeconds) || 0,
    rpe: rpe == null || rpe === "" ? null : Number(rpe),
  }));
});

router.delete("/sets/:id", (req, res) => {
  if (!repo.deleteSet(req.user.id, Number(req.params.id))) {
    return res.status(404).json({ error: "set not found" });
  }
  res.status(204).end();
});

export default router;
