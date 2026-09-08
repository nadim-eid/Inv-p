/**
 * Stockage de session locale (token JWT + utilisateur), sans dependance a
 * un fournisseur d'identite externe. sessionStorage est utilise (et non
 * localStorage) pour que la session ne survive pas indefiniment sur un
 * telephone partage entre techniciens de labo.
 */

const TOKEN_KEY = "csm_token";
const USER_KEY = "csm_user";

let listeners = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  notify();
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  notify();
}
