import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as store from "./store.js";
import { computeProgress, needsReview, childSummary } from "./compute.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

function serializeGoal(goal, { includeCheckIns = false } = {}) {
  const children = store.childrenOf(goal.id);
  const out = {
    ...goal,
    computed: {
      progress: computeProgress(goal),
      needsReview: needsReview(goal),
      children: children.length ? childSummary(children) : [],
    },
  };
  if (!includeCheckIns) delete out.check_ins;
  return out;
}

const router = express.Router();

router.get("/goals", (req, res) => {
  res.json(store.getAll().map((g) => serializeGoal(g)));
});

router.post("/goals", (req, res) => {
  const { title, tier, frequency_target } = req.body;
  if (!title || !tier || !frequency_target) {
    return res.status(400).json({ error: "title, tier, and frequency_target are required" });
  }
  const goal = store.create(req.body);
  res.status(201).json(serializeGoal(goal, { includeCheckIns: true }));
});

router.get("/goals/:id", (req, res) => {
  const goal = store.getById(req.params.id);
  if (!goal) return res.status(404).json({ error: "not found" });
  res.json(serializeGoal(goal, { includeCheckIns: true }));
});

router.put("/goals/:id", (req, res) => {
  const goal = store.update(req.params.id, req.body);
  if (!goal) return res.status(404).json({ error: "not found" });
  res.json(serializeGoal(goal, { includeCheckIns: true }));
});

router.delete("/goals/:id", (req, res) => {
  const ok = store.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

router.post("/goals/:id/check-ins", (req, res) => {
  const result = store.addCheckIn(req.params.id, req.body || {});
  if (!result) return res.status(404).json({ error: "not found" });
  res.status(201).json(serializeGoal(result.goal, { includeCheckIns: true }));
});

router.delete("/goals/:id/check-ins/:checkInId", (req, res) => {
  const goal = store.removeCheckIn(req.params.id, req.params.checkInId);
  if (!goal) return res.status(404).json({ error: "not found" });
  res.json(serializeGoal(goal, { includeCheckIns: true }));
});

router.get("/goals-flat", (req, res) => {
  res.json(store.getAll().map((g) => ({ id: g.id, title: g.title, tier: g.tier })));
});

app.use("/api", router);

const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`goal-tracker server listening on http://localhost:${PORT}`);
});
