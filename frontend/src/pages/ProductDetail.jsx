import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StockBadge from "../components/StockBadge.jsx";
import { api, ApiError } from "../api/client.js";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [quantite, setQuantite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);

  // Verrou local supplementaire (en plus de `submitting`) pour bloquer
  // absolument tout double-appui, meme avant que React ne re-rende.
  const inFlightRef = useRef(false);

  const loadProduct = () => {
    setLoading(true);
    setNotFound(false);
    setLoadError("");
    api
      .getProduct(id)
      .then((res) => setProduct(res.product))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(err instanceof ApiError ? err.message : "Enregistrement impossible. Aucune modification n'a été enregistrée.");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleValidate = async (e) => {
    e.preventDefault();
    setValidationError("");
    setSyncError("");
    setSuccessInfo(null);

    if (inFlightRef.current || submitting) return; // anti double-validation

    const qte = Number(quantite);
    if (quantite === "" || Number.isNaN(qte)) {
      setValidationError("Saisissez une quantité valide.");
      return;
    }
    if (qte <= 0) {
      setValidationError("La quantité doit être strictement supérieure à 0 g.");
      return;
    }
    if (qte > product.masseRestante_g) {
      setValidationError(
        `Quantité supérieure au stock disponible (stock actuel : ${product.masseRestante_g} g).`
      );
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.submitWithdrawal({
        productId: product.id,
        quantite_g: qte,
        expectedStockAvant_g: product.masseRestante_g,
      });
      setProduct(res.product);
      setSuccessInfo({ message: res.message, nouveauStock_g: res.nouveauStock_g });
      setQuantite("");
    } catch (err) {
      setSyncError(
        err instanceof ApiError ? err.message : "Enregistrement impossible. Aucune modification n'a été enregistrée."
      );
    } finally {
      setSubmitting(false);
      inFlightRef.current = false;
    }
  };

  if (loading) {
    return (
      <Layout title="Fiche produit" showBack>
        <p>Chargement…</p>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout title="Fiche produit" showBack>
        <div className="banner banner-error" style={{ fontSize: 18, textAlign: "center" }}>
          Produit inconnu
        </div>
        <p className="helper-text" style={{ textAlign: "center" }}>
          Identifiant recherché : <span className="product-id">{id}</span>
        </p>
        <button className="btn btn-primary btn-large" onClick={() => navigate("/scanner")}>
          Rescanner
        </button>
      </Layout>
    );
  }

  if (loadError) {
    return (
      <Layout title="Fiche produit" showBack>
        <div className="banner banner-error">{loadError}</div>
        <button className="btn btn-large" onClick={loadProduct}>
          Réessayer
        </button>
      </Layout>
    );
  }

  return (
    <Layout title="Fiche produit" showBack>
      {successInfo && (
        <div className="banner banner-success">
          {successInfo.message}
          <br />
          Nouveau stock : {successInfo.nouveauStock_g} g
        </div>
      )}
      {syncError && <div className="banner banner-error">{syncError}</div>}

      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: 24 }}>{product.nom}</h2>
        <p className="product-id" style={{ marginTop: 0 }}>{product.id}</p>
        <div style={{ margin: "10px 0" }}>
          <StockBadge masseRestante_g={product.masseRestante_g} />
        </div>

        <dl style={{ margin: 0 }}>
          <Row label="Masse restante" value={`${product.masseRestante_g} g`} />
          <Row label="Tare" value={`${product.tare_g} g`} />
          <Row label="Poids brut actuel" value={`${product.poidsBrutActuel_g} g`} />
          <Row label="Emplacement" value={product.emplacement} />
          <Row label="Dernière modification" value={formatDate(product.derniereModification)} />
        </dl>

        <button
          className="btn btn-ghost"
          style={{ marginTop: 12 }}
          onClick={() => navigate(`/etiquette/${product.id}`, { state: { product } })}
        >
          🏷️ Voir / imprimer l'étiquette
        </button>
      </div>

      <div className="card">
        <p style={{ fontWeight: 700, fontSize: 18, marginTop: 0 }}>Quantité soutirée</p>
        <p className="helper-text">Stock actuel : {product.masseRestante_g} g</p>

        <form onSubmit={handleValidate}>
          <div className="field field-suffix">
            <label htmlFor="quantite">Quantité soutirée</label>
            <input
              id="quantite"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              placeholder="25"
              disabled={submitting}
            />
            <span className="unit">g</span>
          </div>

          {validationError && <div className="banner banner-error">{validationError}</div>}

          <button className="btn btn-primary btn-large" type="submit" disabled={submitting}>
            {submitting ? "Enregistrement…" : "VALIDER LE SOUTIRAGE"}
          </button>
        </form>
      </div>
    </Layout>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <dt style={{ color: "var(--ink-soft)" }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
    </div>
  );
}
