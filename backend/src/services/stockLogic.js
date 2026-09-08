/**
 * Logique metier pure (sans effet de bord, sans appel reseau) pour le calcul
 * et la validation des soutirages de stock. Isolee dans ce fichier pour
 * pouvoir etre testee unitairement de facon fiable et rapide.
 */

export class StockError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "StockError";
    this.code = code;
  }
}

/**
 * Valide qu'une quantite soutiree est correcte par rapport au stock actuel.
 * Leve une StockError explicite sinon.
 *
 * Regles :
 *  - la quantite doit etre un nombre fini
 *  - la quantite doit etre strictement positive (pas de zero, pas de negatif)
 *  - la quantite ne peut pas depasser le stock disponible
 */
export function validateWithdrawal(stockActuel_g, quantite_g) {
  if (typeof stockActuel_g !== "number" || !Number.isFinite(stockActuel_g)) {
    throw new StockError("STOCK_INVALIDE", "Le stock actuel est invalide.");
  }

  if (typeof quantite_g !== "number" || !Number.isFinite(quantite_g)) {
    throw new StockError(
      "QUANTITE_INVALIDE",
      "La quantite soutiree doit etre un nombre."
    );
  }

  if (quantite_g <= 0) {
    throw new StockError(
      "QUANTITE_NULLE_OU_NEGATIVE",
      "La quantite soutiree doit etre strictement superieure a 0 g."
    );
  }

  if (quantite_g > stockActuel_g) {
    throw new StockError(
      "STOCK_INSUFFISANT",
      `Quantite superieure au stock disponible (stock actuel : ${stockActuel_g} g).`
    );
  }

  return true;
}

/**
 * Calcule le nouveau stock apres un soutirage.
 * Renvoie { stockAvant, quantite, stockApres } avec arrondi a 3 decimales
 * (precision suffisante pour des masses en grammes en laboratoire).
 */
export function computeWithdrawal(stockActuel_g, quantite_g) {
  validateWithdrawal(stockActuel_g, quantite_g);

  const stockApres = round3(stockActuel_g - quantite_g);

  return {
    stockAvant: round3(stockActuel_g),
    quantite: round3(quantite_g),
    stockApres,
  };
}

/**
 * PoidsBrutActuel_g = Tare_g + MasseRestante_g
 */
export function computePoidsBrut(tare_g, masseRestante_g) {
  if (typeof tare_g !== "number" || !Number.isFinite(tare_g)) {
    throw new StockError("TARE_INVALIDE", "La tare est invalide.");
  }
  if (
    typeof masseRestante_g !== "number" ||
    !Number.isFinite(masseRestante_g)
  ) {
    throw new StockError(
      "MASSE_RESTANTE_INVALIDE",
      "La masse restante est invalide."
    );
  }
  return round3(tare_g + masseRestante_g);
}

/**
 * Determine le niveau d'alerte stock (vert / orange / rouge) selon des
 * seuils configurables (en grammes).
 */
export function getStockLevel(
  masseRestante_g,
  seuilFaible_g = 100,
  seuilCritique_g = 20
) {
  if (typeof masseRestante_g !== "number" || !Number.isFinite(masseRestante_g)) {
    return "inconnu";
  }
  if (masseRestante_g <= seuilCritique_g) return "rouge";
  if (masseRestante_g <= seuilFaible_g) return "orange";
  return "vert";
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}
