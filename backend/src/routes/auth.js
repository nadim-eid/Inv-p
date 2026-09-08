import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyCredentials, issueToken, AuthError } from "../services/userService.js";

export const authRouter = Router();

// Limite plus stricte specifiquement sur le login pour freiner les
// tentatives de mot de passe par force brute.
const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const user = await verifyCredentials(username, password);
    const token = issueToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(401).json({ error: err.code, message: err.message });
    }
    next(err);
  }
});
