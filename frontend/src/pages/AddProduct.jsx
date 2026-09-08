import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { api, ApiError } from "../api/client.js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    tare_g: "",
    masseInitiale_g: "",
    emplacement: "",
    dateEntree: todayIso(),
  });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validateClientSide = () => {
    const errs = [];
    if (!form.nom.trim()) errs.push("Le nom du produit est requis.");
    const tare = Number(form.tare_g);
    if (form.tare_g === "" || Number.isNaN(tare) || tare < 0)
      errs.push("La tare doit être un nombre positif ou nul.");
    const masse = Number(form.masseInitiale_g);
    if (form.masseInitiale_g === "" || Number.isNaN(masse) || masse <= 0)
      errs.push("La masse initiale doit être un nombre strictement positif.");
    if (!form.emplacement.trim()) errs.push("L'emplacement est requis.");
    if (!form.dateEntree) errs.push("La date d'entrée est requise.");
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSyncError("");
    const clientErrors = validateClientSide();
    setErrors(clientErrors);
    if (clientErrors.length) return;

    setSubmitting(true);
    try {
      const { product } = await api.createProduct({
        nom: form.nom.trim(),
        tare_g: Number(form.tare_g),
        masseInitiale_g: Number(form.masseInitiale_g),
        emplacement: form.emplacement.trim(),
        dateEntree: form.dateEntree,
      });
      navigate(`/etiquette/${product.id}`, { state: { product, justCreated: true } });
    } catch (err) {
      if (err instanceof ApiError) {
        setSyncError(err.message);
      } else {
        setSyncError("Synchronisation impossible. Aucune modification n'a été enregistrée.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Ajouter un produit" showBack>
      {syncError && <div className="banner banner-error">{syncError}</div>}
      {errors.length > 0 && (
        <div className="banner banner-error">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nom">Nom du produit</label>
          <input id="nom" type="text" value={form.nom} onChange={update("nom")} placeholder="Ex : Acétone" autoComplete="off" />
        </div>

        <div className="field field-suffix">
          <label htmlFor="tare">Tare du contenant</label>
          <input id="tare" type="number" inputMode="decimal" min="0" step="0.1" value={form.tare_g} onChange={update("tare_g")} placeholder="0" />
          <span className="unit">g</span>
        </div>

        <div className="field field-suffix">
          <label htmlFor="masse">Masse initiale du produit</label>
          <input id="masse" type="number" inputMode="decimal" min="0" step="0.1" value={form.masseInitiale_g} onChange={update("masseInitiale_g")} placeholder="0" />
          <span className="unit">g</span>
        </div>

        <div className="field">
          <label htmlFor="emplacement">Emplacement</label>
          <input id="emplacement" type="text" value={form.emplacement} onChange={update("emplacement")} placeholder="Ex : Armoire A3" autoComplete="off" />
        </div>

        <div className="field">
          <label htmlFor="date">Date d'entrée</label>
          <input id="date" type="date" value={form.dateEntree} onChange={update("dateEntree")} />
        </div>

        <button className="btn btn-primary btn-large" type="submit" disabled={submitting}>
          {submitting ? "Enregistrement…" : "Enregistrer et générer le QR code"}
        </button>
      </form>
    </Layout>
  );
}
