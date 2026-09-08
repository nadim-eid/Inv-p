import { jest } from "@jest/globals";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let app;
let tmpDataDir;

beforeAll(async () => {
  // Repertoire de donnees temporaire et isole pour ce test, et un
  // JWT_SECRET de test suffisamment long.
  tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "csm-test-"));
  process.env.DATA_DIR = tmpDataDir;
  process.env.JWT_SECRET = "test-secret-key-at-least-16-chars";
  process.env.NODE_ENV = "test";

  const express = (await import("express")).default;
  const { authRouter } = await import("../src/routes/auth.js");
  const { createUser } = await import("../src/services/userService.js");

  await createUser({ username: "test.user", password: "MotDePasse123!", displayName: "Test User" });

  app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
});

afterAll(() => {
  fs.rmSync(tmpDataDir, { recursive: true, force: true });
});

describe("POST /api/auth/login", () => {
  test("identifiants valides => token renvoye", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "test.user", password: "MotDePasse123!" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.username).toBe("test.user");
  });

  test("mot de passe incorrect => 401, aucun token", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "test.user", password: "mauvais-mot-de-passe" });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test("utilisateur inexistant => 401, aucun token", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "inconnu", password: "peu-importe123" });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });
});
