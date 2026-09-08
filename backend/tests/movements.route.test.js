import { jest } from "@jest/globals";
import { describe, test, expect, beforeAll } from "@jest/globals";

jest.unstable_mockModule("../src/middleware/auth.js", () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: "u1", username: "technicien.test", displayName: "Technicien Test", role: "technicien" };
    next();
  },
}));

class MockDataStoreError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataStoreError";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const fakeStock = { "CHEM-AAAAAAAA": 850 };

jest.unstable_mockModule("../src/services/productService.js", () => ({
  DataStoreError: MockDataStoreError,
  SAVE_IMPOSSIBLE_MESSAGE: "Enregistrement impossible. Aucune modification n'a été enregistrée.",
  applyWithdrawalAndRecordMovement: async ({ productId, quantite_g }) => {
    await delay(50); // simule une latence disque, utile pour le test de concurrence

    const stockAvant = fakeStock[productId];
    if (stockAvant === undefined) {
      throw new MockDataStoreError("Produit inconnu.");
    }
    if (quantite_g <= 0 || quantite_g > stockAvant) {
      throw new MockDataStoreError("Quantité invalide.");
    }

    const stockApres = stockAvant - quantite_g;
    fakeStock[productId] = stockApres;

    return {
      updatedProduct: { id: productId, masseRestante_g: stockApres, tare_g: 0, poidsBrutActuel_g: stockApres },
      movement: {
        movementId: "MOV-TEST",
        productId,
        quantite_g,
        stockAvant_g: stockAvant,
        stockApres_g: stockApres,
      },
    };
  },
  listMovements: () => [],
}));

let app;

beforeAll(async () => {
  const express = (await import("express")).default;
  const { movementsRouter } = await import("../src/routes/movements.js");
  const { errorHandler } = await import("../src/middleware/errorHandler.js");

  app = express();
  app.use(express.json());
  app.use("/api/movements", movementsRouter);
  app.use(errorHandler);
});

describe("POST /api/movements/withdrawal", () => {
  test("ID inconnu => 'Produit inconnu'", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app)
      .post("/api/movements/withdrawal")
      .send({ productId: "CHEM-DEADBEEF", quantite_g: 10, expectedStockAvant_g: 1000 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Produit inconnu/);
  });

  test("soutirage valide met a jour le stock", async () => {
    const request = (await import("supertest")).default;
    const res = await request(app)
      .post("/api/movements/withdrawal")
      .send({ productId: "CHEM-AAAAAAAA", quantite_g: 25, expectedStockAvant_g: 850 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Soutirage enregistré");
    expect(res.body.nouveauStock_g).toBe(825);
  });

  test("double-validation simultanee : la seconde requete est refusee (409)", async () => {
    const request = (await import("supertest")).default;
    fakeStock["CHEM-BBBBBBBB"] = 500;

    const [res1, res2] = await Promise.all([
      request(app)
        .post("/api/movements/withdrawal")
        .send({ productId: "CHEM-BBBBBBBB", quantite_g: 50, expectedStockAvant_g: 500 }),
      request(app)
        .post("/api/movements/withdrawal")
        .send({ productId: "CHEM-BBBBBBBB", quantite_g: 50, expectedStockAvant_g: 500 }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);
  });
});
