import { getToken, clearSession } from "../auth/session.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:4000/api";

export const SAVE_IMPOSSIBLE_MESSAGE =
  "Enregistrement impossible. Aucune modification n'a été enregistrée.";

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  if (!token) {
    throw new ApiError("Vous devez vous connecter.", { code: "NON_CONNECTE" });
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError(SAVE_IMPOSSIBLE_MESSAGE, { code: "RESEAU" });
  }

  if (response.status === 401) {
    clearSession();
    throw new ApiError("Session expirée. Reconnectez-vous.", {
      status: 401,
      code: "SESSION_EXPIREE",
    });
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new ApiError(body?.message || SAVE_IMPOSSIBLE_MESSAGE, {
      status: response.status,
      code: body?.error,
    });
  }

  return body;
}

/**
 * Telecharge l'export Excel courant. Contrairement aux autres appels,
 * ceci ne peut pas passer par un simple lien <a href> puisqu'un en-tete
 * Authorization est requis : on recupere le fichier en memoire (blob) puis
 * on declenche le telechargement programmatiquement.
 */
async function downloadExcelExport() {
  const token = getToken();
  if (!token) {
    throw new ApiError("Vous devez vous connecter.", { code: "NON_CONNECTE" });
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/export/excel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(SAVE_IMPOSSIBLE_MESSAGE, { code: "RESEAU" });
  }

  if (!response.ok) {
    throw new ApiError("Export impossible pour le moment.", { status: response.status });
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "Inventaire_Chimique.xlsx";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  listProducts: ({ q, emplacement } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (emplacement) params.set("emplacement", emplacement);
    const qs = params.toString();
    return apiFetch(`/products${qs ? `?${qs}` : ""}`);
  },

  getProduct: (id) => apiFetch(`/products/${encodeURIComponent(id)}`),

  createProduct: (payload) =>
    apiFetch("/products", { method: "POST", body: JSON.stringify(payload) }),

  submitWithdrawal: (payload) =>
    apiFetch("/movements/withdrawal", { method: "POST", body: JSON.stringify(payload) }),

  listMovements: ({ produit, utilisateur, date } = {}) => {
    const params = new URLSearchParams();
    if (produit) params.set("produit", produit);
    if (utilisateur) params.set("utilisateur", utilisateur);
    if (date) params.set("date", date);
    const qs = params.toString();
    return apiFetch(`/movements${qs ? `?${qs}` : ""}`);
  },

  exportExcel: () => downloadExcelExport(),
};
