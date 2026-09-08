import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getUser, setSession, clearSession, subscribe } from "../auth/session.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:4000/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());

  useEffect(() => subscribe(() => setUser(getUser())), []);

  const login = useCallback(async (username, password) => {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error(
        "Impossible de joindre le serveur. Vérifiez votre connexion réseau."
      );
    }

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      throw new Error(body?.message || "Connexion impossible.");
    }

    setSession(body.token, body.user);
  }, []);

  const logout = useCallback(() => clearSession(), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  return ctx;
}
