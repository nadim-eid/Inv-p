import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";
import { getUserByUsername, insertUser, getAllUsers } from "../db/store.js";

const SALT_ROUNDS = 10;

export class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export async function createUser({ username, password, displayName, role = "technicien" }) {
  if (!username || username.trim().length < 3) {
    throw new AuthError("Le nom d'utilisateur doit faire au moins 3 caractères.", "USERNAME_INVALIDE");
  }
  if (!password || password.length < 8) {
    throw new AuthError("Le mot de passe doit faire au moins 8 caractères.", "PASSWORD_TROP_COURT");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    await insertUser({
      id: uuidv4(),
      username: username.trim(),
      displayName: (displayName || username).trim(),
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err.message === "USER_DUPLICATE") {
      throw new AuthError("Ce nom d'utilisateur existe déjà.", "USER_DUPLICATE");
    }
    throw err;
  }
}

export async function verifyCredentials(username, password) {
  const user = getUserByUsername(username || "");
  if (!user) {
    throw new AuthError("Identifiants incorrects.", "IDENTIFIANTS_INCORRECTS");
  }
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) {
    throw new AuthError("Identifiants incorrects.", "IDENTIFIANTS_INCORRECTS");
  }
  return user;
}

export function issueToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, displayName: user.displayName, role: user.role },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
}

export function listUsersPublic() {
  return getAllUsers().map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt,
  }));
}
