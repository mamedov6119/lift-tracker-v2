import { Router } from "express";
import * as repo from "../lib/repo.js";

const router = Router();

router.get("/profile", (req, res) => {
  res.json(repo.getProfile());
});

router.patch("/profile", (req, res) => {
  res.json(repo.updateProfile(req.body || {}));
});

router.get("/exercises", (req, res) => {
  res.json(repo.listExercises());
});

router.post("/exercises", (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });
  res.status(201).json(repo.createExercise(req.body));
});

// Account → Reset all data. Confirmed twice in the UI before it fires.
router.delete("/data", (req, res) => {
  repo.resetData();
  res.status(204).end();
});

export default router;
