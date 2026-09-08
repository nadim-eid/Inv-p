/**
 * Verrou en memoire tres simple, par cle (ex: productId), pour empecher
 * deux soutirages simultanes sur le meme produit d'etre traites en
 * parallele (double-clic, double appui, requete rejouee par le reseau
 * mobile). Complementaire de la desactivation du bouton cote frontend et
 * du controle "expectedStockAvant_g" dans excelService.
 *
 * NB : pour un deploiement multi-instance (plusieurs processus/serveurs),
 * remplacer ce verrou memoire par un verrou distribue (ex: Redis).
 */

const locks = new Set();

export function tryAcquireLock(key) {
  if (locks.has(key)) return false;
  locks.add(key);
  return true;
}

export function releaseLock(key) {
  locks.delete(key);
}
