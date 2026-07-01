// ─── Client API — DLC backend (dlc-api) ──────────────────────────────────────
// Si VITE_API_URL n'est pas défini, l'application bascule sur des données de
// démonstration en mémoire (voir mockApi.js) — aucun backend requis.
import * as mockApi from "./mockApi";

const API_BASE = import.meta.env.VITE_API_URL;
export const USING_MOCK = !API_BASE;

if (USING_MOCK) {
  console.info(
    "[DLC] VITE_API_URL non défini — utilisation des données de démonstration en mémoire. " +
    "Définissez VITE_API_URL (ex: http://localhost:3001/api) pour vous connecter au vrai backend."
  );
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let body = null;
  try { body = await res.json(); } catch { /* réponse vide */ }
  if (!res.ok) {
    throw new Error(body?.error || `Erreur serveur (${res.status})`);
  }
  return body;
}

// Implémentation réseau — utilisée uniquement quand VITE_API_URL est défini.
const httpApi = {
  // ── Utilisateurs ──
  login(email, password) {
    return request("/users/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  getUsers() {
    return request("/users");
  },
  createUser({ name, email, password, roles }) {
    return request("/users", { method: "POST", body: JSON.stringify({ name, email, password, roles }) });
  },
  updateUserRoles(id, roles) {
    return request(`/users/${id}/roles`, { method: "PATCH", body: JSON.stringify({ roles }) });
  },
  deleteUser(id) {
    return request(`/users/${id}`, { method: "DELETE" });
  },

  // ── Demandes ──
  getRequests(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/requests${qs ? `?${qs}` : ""}`);
  },
  createRequest(data) {
    return request("/requests", { method: "POST", body: JSON.stringify(data) });
  },
  actionRequest(id, { newStatus, comment, adminComment, by, updatedRows }) {
    return request(`/requests/${id}/action`, {
      method: "PATCH",
      body: JSON.stringify({ newStatus, comment, adminComment, by, updatedRows }),
    });
  },
  updateItems(id, updatedRows) {
    return request(`/requests/${id}/items`, { method: "PATCH", body: JSON.stringify({ updatedRows }) });
  },
  updateRequest(id, { title, formData }) {
    return request(`/requests/${id}`, { method: "PUT", body: JSON.stringify({ title, formData }) });
  },
  deleteRequest(id) {
    return request(`/requests/${id}`, { method: "DELETE" });
  },
  deleteSchoolYear(year) {
    return request(`/requests/school-year/${encodeURIComponent(year)}`, { method: "DELETE" });
  },

  // ── Paramètres ──
  getSettings() {
    return request("/settings");
  },
  updateSetting(key, value) {
    return request(`/settings/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) });
  },
};

// On expose soit le client réseau, soit l'API simulée en mémoire.
const impl = USING_MOCK ? mockApi : httpApi;

export const {
  login,
  getUsers,
  createUser,
  updateUserRoles,
  deleteUser,
  getRequests,
  createRequest,
  actionRequest,
  updateItems,
  updateRequest,
  deleteRequest,
  deleteSchoolYear,
  getSettings,
  updateSetting,
} = impl;
