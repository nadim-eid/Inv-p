import { generateMovementId } from "./idGenerator.js";
import { computePoidsBrut } from "./stockLogic.js";
import {
  getAllProducts,
  getProductById,
  insertProduct,
  updateProduct,
  getAllMovements,
  insertMovement,
} from "../db/store.js";

/**
 * services/productService.js
 * ---------------------------
 * Remplace l'ancien services/excelService.js : meme contrat (memes
 * garanties), mais la source de verite est le stockage local
 * (src/db/store.js) au lieu de Microsoft Graph / Excel.
 *
 * Regle inchangee : on ne renvoie JAMAIS un succes simule. Toute erreur
 * d'ecriture disque est remontee sous forme de DataStoreError avec un
 * message clair, sans mise a jour partielle consideree "faite".
 */

export const SAVE_IMPOSSIBLE_MESSAGE =
  "Enregistrement impossible. Aucune modification n'a été enregistrée.";

export class DataStoreError extends Error {
  constructor(message = SAVE_IMPOSSIBLE_MESSAGE, cause) {
    super(message);
    this.name = "DataStoreError";
    this.cause = cause;
  }
}

export function listProducts({ q = "", emplacement = "" } = {}) {
  let products = getAllProducts();
  const needle = q.trim().toLowerCase();
  if (needle) {
    products = products.filter(
      (p) => p.nom.toLowerCase().includes(needle) || p.id.toLowerCase().includes(needle)
    );
  }
  if (emplacement.trim()) {
    products = products.filter((p) => p.emplacement === emplacement.trim());
  }
  return products;
}

export function findProductById(id) {
  return getProductById(id.trim());
}

export async function createProduct(product) {
  try {
    return await insertProduct(product);
  } catch (err) {
    if (err.message === "ID_DUPLICATE") {
      throw new DataStoreError(
        "Cet identifiant produit existe déjà. Réessayez.",
        "ID_DUPLICATE"
      );
    }
    throw new DataStoreError(SAVE_IMPOSSIBLE_MESSAGE, err);
  }
}

/**
 * Operation composite : met a jour le stock du produit ET insere la ligne
 * de mouvement correspondante. Si l'ecriture echoue a n'importe quelle
 * etape, une DataStoreError est levee et rien n'est considere enregistre.
 *
 * `expectedStockAvant_g`, quand fourni, protege contre une double
 * validation / une modification concurrente survenue entre l'affichage de
 * la fiche produit et la validation du soutirage.
 */
export async function applyWithdrawalAndRecordMovement({
  productId,
  quantite_g,
  utilisateur,
  expectedStockAvant_g,
}) {
  const product = findProductById(productId);
  if (!product) {
    throw new DataStoreError("Produit inconnu.", "PRODUCT_NOT_FOUND");
  }

  const stockActuel_g = product.masseRestante_g;

  if (
    typeof expectedStockAvant_g === "number" &&
    Math.abs(expectedStockAvant_g - stockActuel_g) > 0.0001
  ) {
    throw new DataStoreError(
      "Le stock a changé depuis l'affichage de la fiche. Ouvrez à nouveau la fiche produit avant de revalider.",
      "STOCK_OBSOLETE"
    );
  }

  if (quantite_g <= 0 || quantite_g > stockActuel_g) {
    throw new DataStoreError(
      "Quantité invalide par rapport au stock disponible.",
      "QUANTITE_INVALIDE"
    );
  }

  const stockApres_g = Math.round((stockActuel_g - quantite_g) * 1000) / 1000;
  const nowIso = new Date().toISOString();

  const updates = {
    masseRestante_g: stockApres_g,
    poidsBrutActuel_g: computePoidsBrut(product.tare_g, stockApres_g),
    derniereModification: nowIso,
  };

  let updatedProduct;
  try {
    updatedProduct = await updateProduct(productId, updates);
  } catch (err) {
    throw new DataStoreError(SAVE_IMPOSSIBLE_MESSAGE, err);
  }
  if (!updatedProduct) {
    throw new DataStoreError("Produit inconnu.", "PRODUCT_NOT_FOUND");
  }

  const movement = {
    movementId: generateMovementId(),
    dateHeure: nowIso,
    productId,
    nomProduit: product.nom,
    type: "Soutirage",
    quantite_g,
    stockAvant_g: stockActuel_g,
    stockApres_g,
    utilisateur,
  };

  try {
    await insertMovement(movement);
  } catch (err) {
    // Le stock a deja ete mis a jour mais le mouvement n'a pas pu etre
    // journalise : on le signale explicitement plutot que de masquer
    // l'incoherence potentielle.
    throw new DataStoreError(
      "Le stock a été mis à jour mais le mouvement n'a pas pu être enregistré. Vérifiez l'historique.",
      err
    );
  }

  return { updatedProduct, movement };
}

export function listMovements({ produit = "", utilisateur = "", date = "" } = {}) {
  let movements = getAllMovements();

  const p = produit.trim().toLowerCase();
  const u = utilisateur.trim().toLowerCase();
  const d = date.trim();

  if (p) {
    movements = movements.filter(
      (m) => m.nomProduit.toLowerCase().includes(p) || m.productId.toLowerCase().includes(p)
    );
  }
  if (u) {
    movements = movements.filter((m) => m.utilisateur.toLowerCase().includes(u));
  }
  if (d) {
    movements = movements.filter((m) => String(m.dateHeure).startsWith(d));
  }

  return movements.sort(
    (a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime()
  );
}
