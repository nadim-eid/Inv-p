/**
 * Configuration de la taille d'etiquette imprimable.
 *
 * Pour changer le format d'etiquette utilise dans toute l'application,
 * modifier uniquement `ACTIVE_LABEL_SIZE` ci-dessous (ou ajouter un nouveau
 * preset). La feuille d'impression (styles/print.css) lit ces valeurs via
 * des variables CSS injectees au montage du composant Label.
 */

export const LABEL_SIZE_PRESETS = {
  "50x30": { widthMm: 50, heightMm: 30, label: "50 mm × 30 mm (standard)" },
  "40x20": { widthMm: 40, heightMm: 20, label: "40 mm × 20 mm (compacte)" },
  "60x40": { widthMm: 60, heightMm: 40, label: "60 mm × 40 mm (grande)" },
};

// Format actif par defaut, conforme au cahier des charges (50 x 30 mm).
export const ACTIVE_LABEL_SIZE = "50x30";

export function getLabelSize(key = ACTIVE_LABEL_SIZE) {
  return LABEL_SIZE_PRESETS[key] || LABEL_SIZE_PRESETS[ACTIVE_LABEL_SIZE];
}
