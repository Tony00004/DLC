// ─── Client API — DLC backend (dlc-api) ──────────────────────────────────────
const API_BASE = "http://localhost:3001/api";

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

// ── Utilisateurs ──
export function login(email, password) {
  return request("/users/login", { method: "POST", body: JSON.stringify({ email, password }) });
}
export function getUsers() {
  return request("/users");
}
export function createUser({ name, email, password, roles }) {
  return request("/users", { method: "POST", body: JSON.stringify({ name, email, password, roles }) });
}
export function updateUserRoles(id, roles) {
  return request(`/users/${id}/roles`, { method: "PATCH", body: JSON.stringify({ roles }) });
}
export function deleteUser(id) {
  return request(`/users/${id}`, { method: "DELETE" });
}

// ── Demandes ──
export function getRequests(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/requests${qs ? `?${qs}` : ""}`);
}
export function createRequest(data) {
  return request("/requests", { method: "POST", body: JSON.stringify(data) });
}
export function actionRequest(id, { newStatus, comment, adminComment, by, updatedRows }) {
  return request(`/requests/${id}/action`, {
    method: "PATCH",
    body: JSON.stringify({ newStatus, comment, adminComment, by, updatedRows }),
  });
}
export function updateItems(id, updatedRows) {
  return request(`/requests/${id}/items`, { method: "PATCH", body: JSON.stringify({ updatedRows }) });
}
export function updateRequest(id, { title, formData }) {
  return request(`/requests/${id}`, { method: "PUT", body: JSON.stringify({ title, formData }) });
}
export function deleteRequest(id) {
  return request(`/requests/${id}`, { method: "DELETE" });
}
export function deleteSchoolYear(year) {
  return request(`/requests/school-year/${encodeURIComponent(year)}`, { method: "DELETE" });
}

// ── Paramètres ──
export function getSettings() {
  return request("/settings");
}
export function updateSetting(key, value) {
  return request(`/settings/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) });
}
