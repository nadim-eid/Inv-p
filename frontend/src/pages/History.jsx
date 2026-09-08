import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api, ApiError } from "../api/client.js";

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

export default function History() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [produit, setProduit] = useState("");
  const [utilisateur, setUtilisateur] = useState("");
  const [date, setDate] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listMovements({ produit, utilisateur, date })
      .then((res) => setMovements(res.movements || []))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Enregistrement impossible. Aucune modification n'a été enregistrée.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produit, utilisateur, date]);

  return (
    <Layout title="Historique" showBack>
      <div className="search-row">
        <input
          type="text"
          placeholder="Produit (nom ou ID)…"
          value={produit}
          onChange={(e) => setProduit(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
      <div className="search-row">
        <input
          type="text"
          placeholder="Utilisateur…"
          value={utilisateur}
          onChange={(e) => setUtilisateur(e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && <div className="banner banner-error">{error}</div>}
      {loading && <p className="helper-text">Chargement…</p>}
      {!loading && !error && movements.length === 0 && (
        <div className="banner banner-info">Aucun mouvement ne correspond à votre recherche.</div>
      )}

      {!loading &&
        movements.map((m) => (
          <div key={m.movementId} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{m.nomProduit}</p>
              <span style={{ fontWeight: 700, color: "var(--danger)" }}>-{m.quantite_g} g</span>
            </div>
            <p className="product-id" style={{ margin: "2px 0" }}>{m.productId}</p>
            <p style={{ margin: "6px 0 0" }}>
              {m.stockAvant_g} g → {m.stockApres_g} g
            </p>
            <p className="helper-text" style={{ margin: "4px 0 0" }}>
              {formatDateTime(m.dateHeure)} — {m.utilisateur}
            </p>
          </div>
        ))}
    </Layout>
  );
}
