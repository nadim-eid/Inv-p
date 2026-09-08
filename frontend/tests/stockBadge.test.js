import { describe, test, expect } from "@jest/globals";
import { getStockLevel } from "../src/utils/stockLevel.js";

// Note: getStockLevel est une fonction pure exportee par StockBadge.jsx ;
// on la teste isolement, sans monter de composant React (pas besoin de
// jsdom / react-testing-library pour ce cas).
describe("getStockLevel (frontend)", () => {
  test("vert au-dessus du seuil faible", () => {
    expect(getStockLevel(500, 100, 20)).toBe("vert");
  });
  test("orange entre seuil critique et seuil faible", () => {
    expect(getStockLevel(50, 100, 20)).toBe("orange");
  });
  test("rouge au ou sous le seuil critique", () => {
    expect(getStockLevel(15, 100, 20)).toBe("rouge");
  });
  test("inconnu si valeur non numerique", () => {
    expect(getStockLevel(undefined, 100, 20)).toBe("inconnu");
    expect(getStockLevel(NaN, 100, 20)).toBe("inconnu");
  });
});
