import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { generateProductId, isValidProductId } from "../services/idGenerator.js";
import { computePoidsBrut } from "../services/stockLogic.js";
import { listProducts, findProductById, createProduct } from "../services/productService.js";
import { config } from "../config/env.js";

export const productsRouter = Router();

productsRouter.use(requireAuth);

// GET /api/products?q=&emplacement=
productsRouter.get("/", (req, res, next) => {
  try {
    const products = listProducts({
      q: (req.query.q || "").toString(),
      emplacement: (req.query.emplacement || "").toString(),
    });
    res.json({
      products,
      seuils: {
        faible_g: config.stock.seuilFaible_g,
        critique_g: config.stock.seuilCritique_g,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id -> fiche produit (utilise par le scanner)
productsRouter.get("/:id", (req, res, next) => {
  try {
    const id = (req.params.id || "").trim().toUpperCase();

    if (!isValidProductId(id)) {
      return res.status(404).json({ error: "PRODUIT_INCONNU", message: "Produit inconnu" });
    }

    const product = findProductById(id);
    if (!product) {
      return res.status(404).json({ error: "PRODUIT_INCONNU", message: "Produit inconnu" });
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products -> creation d'un nouveau produit
productsRouter.post("/", async (req, res, next) => {
  try {
    const { nom, tare_g, masseInitiale_g, emplacement, dateEntree } = req.body || {};

    const errors = [];
    if (!nom || typeof nom !== "string" || !nom.trim())
      errors.push("Le nom du produit est requis.");
    if (typeof tare_g !== "number" || !Number.isFinite(tare_g) || tare_g < 0)
      errors.push("La tare doit être un nombre positif ou nul.");
    if (
      typeof masseInitiale_g !== "number" ||
      !Number.isFinite(masseInitiale_g) ||
      masseInitiale_g <= 0
    )
      errors.push("La masse initiale doit être un nombre strictement positif.");
    if (!emplacement || typeof emplacement !== "string" || !emplacement.trim())
      errors.push("L'emplacement est requis.");
    if (!dateEntree || typeof dateEntree !== "string")
      errors.push("La date d'entrée est requise.");

    if (errors.length) {
      return res.status(400).json({ error: "VALIDATION", messages: errors });
    }

    const { id } = generateProductId();
    const nowIso = new Date().toISOString();

    const product = {
      id,
      nom: nom.trim(),
      tare_g,
      masseInitiale_g,
      masseRestante_g: masseInitiale_g,
      poidsBrutActuel_g: computePoidsBrut(tare_g, masseInitiale_g),
      emplacement: emplacement.trim(),
      dateEntree,
      qrValue: id,
      derniereModification: nowIso,
    };

    await createProduct(product);

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});
