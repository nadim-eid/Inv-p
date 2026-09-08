import React from "react";
import { useNavigate } from "react-router-dom";

export default function Layout({ title, showBack = false, children, headerRight = null }) {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="app-header">
        {showBack ? (
          <button className="app-header__back" onClick={() => navigate(-1)} aria-label="Retour">
            ← Retour
          </button>
        ) : (
          <span style={{ width: 40 }} />
        )}
        <span className="app-header__title">{title}</span>
        <span>{headerRight}</span>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
