import { describe, test, expect } from "@jest/globals";
import {
  computeWithdrawal,
  validateWithdrawal,
  computePoidsBrut,
  getStockLevel,
  StockError,
} from "../src/services/stockLogic.js";

describe("computeWithdrawal", () => {
  test("Stock=1000g, soutirage=100g => 900g", () => {
    const result = computeWithdrawal(1000, 100);
    expect(result).toEqual({ stockAvant: 1000, quantite: 100, stockApres: 900 });
  });

  test("Stock=850g, soutirage=25g => 825g (exemple du cahier des charges)", () => {
    const result = computeWithdrawal(850, 25);
    expect(result.stockApres).toBe(825);
  });

  test("Stock=50g, soutirage=60g => refuse (stock insuffisant)", () => {
    expect(() => computeWithdrawal(50, 60)).toThrow(StockError);
    try {
      computeWithdrawal(50, 60);
    } catch (e) {
      expect(e.code).toBe("STOCK_INSUFFISANT");
    }
  });

  test("Stock=50g, soutirage=-10g => refuse (quantite negative)", () => {
    expect(() => computeWithdrawal(50, -10)).toThrow(StockError);
    try {
      computeWithdrawal(50, -10);
    } catch (e) {
      expect(e.code).toBe("QUANTITE_NULLE_OU_NEGATIVE");
    }
  });

  test("quantite = 0 => refuse (quantite nulle)", () => {
    expect(() => computeWithdrawal(50, 0)).toThrow(StockError);
  });

  test("quantite exactement egale au stock disponible => autorise, stock final = 0", () => {
    const result = computeWithdrawal(50, 50);
    expect(result.stockApres).toBe(0);
  });

  test("quantite non numerique => refuse", () => {
    expect(() => computeWithdrawal(50, "abc")).toThrow(StockError);
    expect(() => computeWithdrawal(50, NaN)).toThrow(StockError);
    expect(() => computeWithdrawal(50, undefined)).toThrow(StockError);
  });

  test("arrondi a 3 decimales", () => {
    const result = computeWithdrawal(10.1234, 0.0001);
    expect(result.stockApres).toBeCloseTo(10.1233, 3);
  });
});

describe("validateWithdrawal", () => {
  test("ne leve pas d'erreur pour un cas valide", () => {
    expect(() => validateWithdrawal(100, 10)).not.toThrow();
  });
});

describe("computePoidsBrut", () => {
  test("PoidsBrutActuel_g = Tare_g + MasseRestante_g", () => {
    expect(computePoidsBrut(120, 825)).toBe(945);
  });

  test("tare invalide leve une StockError", () => {
    expect(() => computePoidsBrut(NaN, 100)).toThrow(StockError);
  });
});

describe("getStockLevel", () => {
  test("vert quand stock au-dessus du seuil faible", () => {
    expect(getStockLevel(500, 100, 20)).toBe("vert");
  });
  test("orange quand stock entre seuil critique et seuil faible", () => {
    expect(getStockLevel(50, 100, 20)).toBe("orange");
  });
  test("rouge quand stock au ou sous le seuil critique", () => {
    expect(getStockLevel(10, 100, 20)).toBe("rouge");
    expect(getStockLevel(20, 100, 20)).toBe("rouge");
  });
});
