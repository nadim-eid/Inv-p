import { DataStoreError, SAVE_IMPOSSIBLE_MESSAGE } from "../services/productService.js";
import { StockError } from "../services/stockLogic.js";

/**
 * Middleware d'erreur centralise. Regle d'or : ne jamais repondre 200/succes
 * si une operation a echoue.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof DataStoreError) {
    console.error("[DataStoreError]", err.message, err.cause || "");
    const status = err.message === "Produit inconnu." ? 404 : 500;
    return res.status(status).json({
      error: "ENREGISTREMENT_IMPOSSIBLE",
      message: err.message || SAVE_IMPOSSIBLE_MESSAGE,
    });
  }

  if (err instanceof StockError) {
    return res.status(400).json({ error: err.code, message: err.message });
  }

  console.error("[ErreurNonGeree]", err);
  res.status(500).json({
    error: "ERREUR_SERVEUR",
    message: "Une erreur inattendue est survenue. Aucune modification n'a été enregistrée.",
  });
}
