import { Router } from "express";
import fs from "node:fs";
import { config } from "../config/env.js";

export const healthRouter = Router();

// Sonde simple, sans authentification (pour supervision / uptime check)
healthRouter.get("/", (req, res) => {
  const dataDirOk = fs.existsSync(config.dataDir);
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stockageLocal: dataDirOk ? "accessible" : "introuvable",
  });
});
