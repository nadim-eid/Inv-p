import { describe, test, expect } from "@jest/globals";
import {
  generateProductId,
  isValidProductId,
  generateMovementId,
} from "../src/services/idGenerator.js";

describe("generateProductId", () => {
  test("produit un identifiant au format CHEM-XXXXXXXX", () => {
    const { id } = generateProductId();
    expect(id).toMatch(/^CHEM-[0-9A-F]{8}$/);
  });

  test("genere des identifiants differents a chaque appel", () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateProductId().id));
    expect(ids.size).toBe(200);
  });
});

describe("isValidProductId", () => {
  test("accepte un identifiant valide", () => {
    expect(isValidProductId("CHEM-A81F42D3")).toBe(true);
  });
  test("rejette un identifiant invalide", () => {
    expect(isValidProductId("CHEM-123")).toBe(false);
    expect(isValidProductId("XXXX-A81F42D3")).toBe(false);
    expect(isValidProductId("")).toBe(false);
    expect(isValidProductId(null)).toBe(false);
  });
});

describe("generateMovementId", () => {
  test("produit un identifiant au format MOV-XXXXXXXXXX", () => {
    expect(generateMovementId()).toMatch(/^MOV-[0-9A-F]{10}$/);
  });
});
