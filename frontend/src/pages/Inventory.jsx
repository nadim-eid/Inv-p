import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StockBadge from "../components/StockBadge.jsx";
import { api, ApiError } from "../api/client.js";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

export default function Inventory() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [emplacement, setEmplacement] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listProducts({ q: query, emplacement })
      .then((res) => setProducts(res.products || []))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Enregistrement impossible. Aucune modification n'a été enregistrée.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 250); // petit debounce sur la saisie
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, emplacement]);

  const emplacements = useMemo(
    () => Array.from(new Set(products.map((p) => p.emplacement).filter(Boolean))).sort(),
    [products]
  );

  return (
    <Layout title="Inventaire" showBack>
      <div className="search-row">
        <input
          type="text"
          placeholder="Rechercher par nom ou ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
      <div className="search-row">
        <select value={emplacement} onChange={(e) => setEmplacement(e.target.value)} style={{ flex: 1 }}>
          <option value="">Tous les emplacements</option>
          {emplacements.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="banner banner-error">{error}</div>}
      {loading && <p className="helper-text">Chargement…</p>}
      {!loading && !error && products.length === 0 && (
        <div className="banner banner-info">Aucun produit ne correspond à votre recherche.</div>
      )}

      {!loading && products.length > 0 && (
        <>
          {/* Vue tableau (ordinateur) */}
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>ID</th>
                <th>Emplacement</th>
                <th>Stock restant</th>
                <th>Dernière modif.</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/produit/${p.id}`)} style={{ cursor: "pointer" }}>
                  <td>{p.nom}</td>
                  <td className="product-id">{p.id}</td>
                  <td>{p.emplacement}</td>
                  <td>
                    {p.masseRestante_g} g <StockBadge masseRestante_g={p.masseRestante_g} />
                  </td>
                  <td>{formatDate(p.derniereModification)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Vue cartes (mobile) */}
          <div className="inventory-cards">
            {products.map((p) => (
              <div key={p.id} className="card" onClick={() => navigate(`/produit/${p.id}`)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>{p.nom}</p>
                    <p className="product-id" style={{ margin: "2px 0" }}>{p.id}</p>
                  </div>
                  <StockBadge masseRestante_g={p.masseRestante_g} />
                </div>
                <p style={{ margin: "8px 0 0" }}>
                  {p.masseRestante_g} g restants — {p.emplacement}
                </p>
                <p className="helper-text" style={{ margin: "2px 0 0" }}>
                  Modifié le {formatDate(p.derniereModification)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
