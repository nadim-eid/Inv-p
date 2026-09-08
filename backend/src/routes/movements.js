import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateWithdrawal, StockError } from "../services/stockLogic.js";
import { isValidProductId } from "../services/idGenerator.js";
import { applyWithdrawalAndRecordMovement, listMovements } from "../services/productService.js";
import { tryAcquireLock, releaseLock } from "../utils/operationLock.js";

export const movementsRouter = Router();

movementsRouter.use(requireAuth);

// POST /api/movements/withdrawal
// body: { productId, quantite_g, expectedStockAvant_g }
movementsRouter.post("/withdrawal", async (req, res, next) => {
  const { productId, quantite_g, expectedStockAvant_g } = req.body || {};

  if (!productId || !isValidProductId(String(productId).toUpperCase())) {
    return res.status(400).json({ error: "ID_INVALIDE", message: "Identifiant produit invalide." });
  }

  const id = String(productId).toUpperCase();

  // Verrou anti double-validation : si une operation est deja en cours
  // pour ce produit, on refuse immediatement la seconde requete.
  if (!tryAcquireLock(id)) {
    return res.status(409).json({
      error: "OPERATION_EN_COURS",
      message: "Une validation est déjà en cours pour ce produit. Patientez.",
    });
  }

  try {
    try {
      validateWithdrawal(
        typeof expectedStockAvant_g === "number" ? expectedStockAvant_g : Infinity,
        Number(quantite_g)
      );
    } catch (e) {
      if (e instanceof StockError) {
        return res.status(400).json({ error: e.code, message: e.message });
      }
      throw e;
    }

    const { updatedProduct, movement } = await applyWithdrawalAndRecordMovement({
      productId: id,
      quantite_g: Number(quantite_g),
      utilisateur: req.user?.displayName || req.user?.username || "Inconnu",
      expectedStockAvant_g:
        typeof expectedStockAvant_g === "number" ? expectedStockAvant_g : undefined,
    });

    res.json({
      message: "Soutirage enregistré",
      product: updatedProduct,
      movement,
      nouveauStock_g: updatedProduct.masseRestante_g,
    });
  } catch (err) {
    next(err);
  } finally {
    releaseLock(id);
  }
});

// GET /api/movements?produit=&utilisateur=&date=
movementsRouter.get("/", (req, res, next) => {
  try {
    const movements = listMovements({
      produit: (req.query.produit || "").toString(),
      utilisateur: (req.query.utilisateur || "").toString(),
      date: (req.query.date || "").toString(),
    });
    res.json({ movements });
  } catch (err) {
    next(err);
  }
});
