const SEUIL_FAIBLE_G = Number(import.meta.env?.VITE_STOCK_SEUIL_FAIBLE_G || 100);
const SEUIL_CRITIQUE_G = Number(import.meta.env?.VITE_STOCK_SEUIL_CRITIQUE_G || 20);

export function getStockLevel(
  masseRestante_g,
  seuilFaible = SEUIL_FAIBLE_G,
  seuilCritique = SEUIL_CRITIQUE_G
) {
  if (typeof masseRestante_g !== "number" || Number.isNaN(masseRestante_g)) return "inconnu";
  if (masseRestante_g <= seuilCritique) return "rouge";
  if (masseRestante_g <= seuilFaible) return "orange";
  return "vert";
}
