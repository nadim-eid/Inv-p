import fs from "node:fs";
import path from "node:path";
import { config } from "../config/env.js";

/**
 * db/store.js
 * -----------
 * Persistance locale, sans aucune dependance externe (pas de cloud, pas de
 * Microsoft). Trois fichiers JSON dans DATA_DIR : products.json,
 * movements.json, users.json.
 *
 * Chaque collection est chargee en memoire au demarrage puis reecrite sur
 * disque apres chaque mutation (ecriture complete du fichier). Les
 * ecritures sont serialisees par une file d'attente en memoire pour eviter
 * toute corruption en cas d'appels concurrents (double-validation, etc.).
 *
 * Pour une tres grosse volumetrie ou un acces multi-processus, remplacer
 * ce module par une vraie base (SQLite, Postgres...) tout en gardant la
 * meme interface (fonctions get.../insert.../update...) : aucun autre
 * fichier du projet ne connait le detail du stockage.
 */

const FILES = {
  products: "products.json",
  movements: "movements.json",
  users: "users.json",
};

let cache = null; // { products: [], movements: [], users: [] }
let writeQueue = Promise.resolve();

function filePath(name) {
  return path.join(config.dataDir, FILES[name]);
}

function ensureDataDir() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
}

function readJsonSafe(file) {
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function load() {
  if (cache) return cache;
  ensureDataDir();
  cache = {
    products: readJsonSafe(filePath("products")),
    movements: readJsonSafe(filePath("movements")),
    users: readJsonSafe(filePath("users")),
  };
  for (const key of Object.keys(FILES)) {
    if (!fs.existsSync(filePath(key))) {
      persist(key);
    }
  }
  return cache;
}

function persist(collection) {
  const data = load()[collection];
  const target = filePath(collection);
  const tmp = `${target}.tmp`;
  writeQueue = writeQueue
    .then(() => {
      ensureDataDir();
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tmp, target); // ecriture atomique (rename)
    })
    .catch((err) => {
      console.error(`[store] echec ecriture ${collection}.json`, err);
      throw err;
    });
  return writeQueue;
}

// ---------------------------------------------------------------------
// Produits
// ---------------------------------------------------------------------

export function getAllProducts() {
  return [...load().products];
}

export function getProductById(id) {
  return load().products.find((p) => p.id === id) || null;
}

export async function insertProduct(product) {
  const db = load();
  if (db.products.some((p) => p.id === product.id)) {
    throw new Error("ID_DUPLICATE");
  }
  db.products.push(product);
  await persist("products");
  return product;
}

export async function updateProduct(id, updates) {
  const db = load();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.products[idx] = { ...db.products[idx], ...updates };
  await persist("products");
  return db.products[idx];
}

// ---------------------------------------------------------------------
// Mouvements
// ---------------------------------------------------------------------

export function getAllMovements() {
  return [...load().movements];
}

export async function insertMovement(movement) {
  const db = load();
  db.movements.push(movement);
  await persist("movements");
  return movement;
}

// ---------------------------------------------------------------------
// Utilisateurs
// ---------------------------------------------------------------------

export function getAllUsers() {
  return [...load().users];
}

export function getUserByUsername(username) {
  const needle = username.trim().toLowerCase();
  return load().users.find((u) => u.username.toLowerCase() === needle) || null;
}

export async function insertUser(user) {
  const db = load();
  if (getUserByUsername(user.username)) {
    throw new Error("USER_DUPLICATE");
  }
  db.users.push(user);
  await persist("users");
  return user;
}

/**
 * Utilitaire de test : reinitialise le cache en memoire (pour isoler les
 * tests entre eux, chacun avec son propre DATA_DIR).
 */
export function _resetCacheForTests() {
  cache = null;
}
