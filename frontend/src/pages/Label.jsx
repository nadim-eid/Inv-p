import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import QRCode from "qrcode";
import Layout from "../components/Layout.jsx";
import { api, ApiError } from "../api/client.js";
import { LABEL_SIZE_PRESETS, ACTIVE_LABEL_SIZE, getLabelSize } from "../config/labelConfig.js";

export default function Label() {
  const { id } = useParams();
  const location = useLocation();

  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [sizeKey, setSizeKey] = useState(ACTIVE_LABEL_SIZE);

  const size = useMemo(() => getLabelSize(sizeKey), [sizeKey]);

  useEffect(() => {
    if (product) return;
    let cancelled = false;
    setLoading(true);
    api
      .getProduct(id)
      .then((res) => !cancelled && setProduct(res.product))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Produit inconnu"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!product) return;
    // Le QR ne contient QUE l'identifiant du produit (QRValue), jamais le detail.
    QRCode.toDataURL(product.qrValue || product.id, { margin: 1, width: 300 }).then(
      setQrDataUrl
    );
  }, [product]);

  useEffect(() => {
    document.documentElement.style.setProperty("--label-width", `${size.widthMm}mm`);
    document.documentElement.style.setProperty("--label-height", `${size.heightMm}mm`);
  }, [size]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <Layout title="Étiquette" showBack>
        <p>Chargement…</p>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout title="Étiquette" showBack>
        <div className="banner banner-error">{error || "Produit inconnu"}</div>
      </Layout>
    );
  }

  return (
    <Layout title="Étiquette" showBack>
      {location.state?.justCreated && (
        <div className="banner banner-success">Produit enregistré avec succès.</div>
      )}

      <div className="card">
        <div className="field">
          <label htmlFor="label-size">Format d'étiquette</label>
          <select id="label-size" value={sizeKey} onChange={(e) => setSizeKey(e.target.value)}>
            {Object.entries(LABEL_SIZE_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <p className="helper-text">Aperçu à l'échelle (le format papier est fixé lors de l'impression) :</p>

        <div className="label-preview">
          <div
            className="label-box"
            style={{ width: `${size.widthMm * 3}px`, height: `${size.heightMm * 3}px` }}
          >
            {qrDataUrl && <img src={qrDataUrl} alt="QR code" style={{ height: "100%" }} />}
            <div className="label-box__text">
              <div className="label-box__nom">{product.nom}</div>
              <div className="label-box__id">{product.id}</div>
              <div className="label-box__meta">Tare : {product.tare_g} g</div>
              <div className="label-box__meta">{product.emplacement}</div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-large" onClick={handlePrint}>
          🖨️ Imprimer l'étiquette
        </button>
      </div>

      {/* Zone strictement dediee a l'impression (voir styles/print.css) */}
      <div id="printable-label" className="print-only-root" aria-hidden="true">
        {qrDataUrl && <img src={qrDataUrl} alt="" />}
        <div className="print-text">
          <div className="print-nom">{product.nom}</div>
          <div className="print-id">{product.id}</div>
          <div className="print-meta">Tare : {product.tare_g} g</div>
          <div className="print-meta">{product.emplacement}</div>
        </div>
      </div>
    </Layout>
  );
}
