import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

/**
 * Middleware Express : exige un JWT local valide, emis par
 * POST /api/auth/login (voir routes/auth.js et services/userService.js).
 * Aucune dependance a un fournisseur d'identite externe.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "NON_AUTHENTIFIE",
      message: "Connexion requise.",
    });
  }

  try {
    const decoded = jwt.verify(match[1], config.auth.jwtSecret);
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      displayName: decoded.displayName,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      error: "TOKEN_INVALIDE",
      message: "Session invalide ou expirée. Reconnectez-vous.",
    });
  }
}
