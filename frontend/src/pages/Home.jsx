import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Layout from "../components/Layout.jsx";
import { api, ApiError } from "../api/client.js";

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const handleExport = async () => {
    setExportError("");
    setExporting(true);
    try {
      await api.exportExcel();
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Export impossible.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout
      title="Chemical Stock Manager"
      headerRight={
        <button
          onClick={logout}
          style={{ background: "transparent", border: "none", color: "#fff", fontSize: 13, cursor: "pointer" }}
        >
          Déconnexion
        </button>
      }
    >
      {user && <p className="helper-text">Connecté : {user.displayName || user.username}</p>}

      <div className="home-grid">
        <button className="home-tile" onClick={() => navigate("/scanner")}>
          <span className="home-tile__icon">📷</span>
          SCANNER
        </button>
        <button className="home-tile" onClick={() => navigate("/ajouter")}>
          <span className="home-tile__icon">➕</span>
          AJOUTER UN PRODUIT
        </button>
        <button className="home-tile" onClick={() => navigate("/inventaire")}>
          <span className="home-tile__icon">📦</span>
          INVENTAIRE
        </button>
        <button className="home-tile" onClick={() => navigate("/historique")}>
          <span className="home-tile__icon">📊</span>
          HISTORIQUE
        </button>
      </div>

      {exportError && <div className="banner banner-error" style={{ marginTop: 16 }}>{exportError}</div>}

      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={handleExport} disabled={exporting}>
        {exporting ? "Export en cours…" : "⬇️ Exporter vers Excel"}
      </button>
    </Layout>
  );
}
