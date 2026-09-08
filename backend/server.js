import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config, assertAuthConfigured } from "./src/config/env.js";
import { authRouter } from "./src/routes/auth.js";
import { productsRouter } from "./src/routes/products.js";
import { movementsRouter } from "./src/routes/movements.js";
import { healthRouter } from "./src/routes/health.js";
import { exportRouter } from "./src/routes/export.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/movements", movementsRouter);
app.use("/api/export", exportRouter);

app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route inconnue." });
});

app.use(errorHandler);

const missing = assertAuthConfigured();
if (missing.length && config.nodeEnv !== "test") {
  console.warn(
    `⚠️  Configuration incomplète. Variables manquantes: ${missing.join(", ")}.\n` +
      "   Générez un JWT_SECRET (voir .env.example) avant de créer des utilisateurs ou d'accepter des connexions."
  );
}

app.listen(config.port, () => {
  console.log(`✅ Chemical Stock Manager API démarrée sur le port ${config.port} (${config.nodeEnv})`);
  console.log(`   Stockage local : ${config.dataDir}`);
  console.log(`   Créer un compte : npm run create-user -- <utilisateur> <mot-de-passe>`);
});

export default app;
