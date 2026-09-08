import "dotenv/config";
import path from "node:path";

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: (process.env.CORS_ORIGIN || "https://localhost:5173")
    .split(",")
    .map((s) => s.trim()),

  auth: {
    jwtSecret: process.env.JWT_SECRET || "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  },

  dataDir: path.resolve(process.env.DATA_DIR || "./data"),

  stock: {
    seuilFaible_g: Number(process.env.STOCK_SEUIL_FAIBLE_G || 100),
    seuilCritique_g: Number(process.env.STOCK_SEUIL_CRITIQUE_G || 20),
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 120),
  },
};

/**
 * Verifie que la configuration minimale (essentiellement le secret JWT) est
 * bien definie. Un JWT_SECRET par defaut/faible rendrait toutes les
 * sessions falsifiables : on prefere echouer tot et clairement.
 */
export function assertAuthConfigured() {
  const missing = [];
  if (!config.auth.jwtSecret || config.auth.jwtSecret.length < 16) {
    missing.push("JWT_SECRET (doit faire au moins 16 caracteres)");
  }
  return missing;
}
