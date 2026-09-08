import { v4 as uuidv4 } from "uuid";

/**
 * Construit un identifiant court et lisible de type "CHEM-A81F42D3"
 * a partir d'un UUID v4 fraichement genere.
 *
 * L'UUID complet garantit l'unicite statistique ; on n'expose que les 8
 * premiers caracteres (hex, majuscules) pour un identifiant compact
 * adapte a un QR code et a une petite etiquette imprimee.
 */
export function generateProductId() {
  const uuid = uuidv4();
  const shortHex = uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
  return {
    id: `CHEM-${shortHex}`,
    uuid,
  };
}

/**
 * Valide le format d'un identifiant produit.
 */
export function isValidProductId(id) {
  return typeof id === "string" && /^CHEM-[0-9A-F]{8}$/.test(id.trim());
}

/**
 * Genere un identifiant de mouvement (historique), prefixe MOV-.
 */
export function generateMovementId() {
  const uuid = uuidv4();
  const shortHex = uuid.replace(/-/g, "").slice(0, 10).toUpperCase();
  return `MOV-${shortHex}`;
}
