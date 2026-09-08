import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Renseignez votre nom d'utilisateur et votre mot de passe.");
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div
        className="app-main"
        style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Chemical Stock Manager</h1>
          <p className="helper-text" style={{ marginBottom: 20 }}>
            Connectez-vous avec votre compte local.
          </p>

          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            <div className="field">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                disabled={submitting}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>

            {error && <div className="banner banner-error">{error}</div>}

            <button className="btn btn-primary btn-large" type="submit" disabled={submitting}>
              {submitting ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="helper-text" style={{ marginTop: 16 }}>
            Pas encore de compte ? Demandez à un administrateur d'en créer un
            via <code>npm run create-user</code> sur le serveur.
          </p>
        </div>
      </div>
    </div>
  );
}
