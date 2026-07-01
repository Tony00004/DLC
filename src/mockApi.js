// ─── API simulée en mémoire (mode hors-ligne) ───────────────────────────────
// Reproduit le comportement du backend dlc-api sans réseau. Les écritures
// mutent un magasin en mémoire : les changements persistent le temps de la
// session (jusqu'au rechargement de la page).

import { MOCK_USERS, MOCK_SETTINGS, MOCK_REQUESTS } from "./mockData";

const clone = (v) => JSON.parse(JSON.stringify(v));
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

// État mutable de la session, initialisé à partir des données d'amorçage.
const store = {
  users:    clone(MOCK_USERS),
  settings: clone(MOCK_SETTINGS),
  requests: clone(MOCK_REQUESTS),
  // Ordre de création (le plus récent en premier, comme orderBy createdAt desc)
  seq: MOCK_REQUESTS.length,
};

// Association demande → rang de création, pour reproduire le tri du backend.
const createdRank = new Map(MOCK_REQUESTS.map((r, i) => [r.id, i]));

function nextId(collection) {
  return collection.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

// Calcule l'année scolaire d'une date (ex: "2025-2026") — identique au backend.
function getSchoolYear(dateStr) {
  if (!dateStr) return "Inconnue";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

// ── Utilisateurs ──
export async function login(email, password) {
  await delay();
  const user = store.users.find((u) => u.email === email);
  if (!user || user.password !== password) {
    throw new Error("Identifiants incorrects");
  }
  return clone(user);
}

export async function getUsers() {
  await delay();
  return clone(store.users).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createUser({ name, email, password, roles = [] }) {
  await delay();
  if (!name || !email || !password) throw new Error("name, email et password sont requis");
  if (store.users.some((u) => u.email === email)) {
    throw new Error("Cet identifiant courriel est déjà utilisé");
  }
  const user = { id: nextId(store.users), name, email, password, roles };
  store.users.push(user);
  return clone(user);
}

export async function updateUserRoles(id, roles) {
  await delay();
  const user = store.users.find((u) => u.id === Number(id));
  if (!user) throw new Error("Utilisateur introuvable");
  user.roles = roles;
  return clone(user);
}

export async function deleteUser(id) {
  await delay();
  const idx = store.users.findIndex((u) => u.id === Number(id));
  if (idx === -1) throw new Error("Utilisateur introuvable");
  store.users.splice(idx, 1);
  return { message: "Utilisateur supprimé" };
}

// ── Demandes ──
export async function getRequests(params = {}) {
  await delay();
  const { type, status, authorId, schoolYear } = params;
  let result = store.requests.filter((r) => {
    if (type && r.type !== type) return false;
    if (status && r.status !== status) return false;
    if (authorId && r.authorId !== Number(authorId)) return false;
    if (schoolYear && getSchoolYear(r.date) !== schoolYear) return false;
    return true;
  });
  // orderBy createdAt desc : les plus récentes en premier.
  result = result.sort((a, b) => (createdRank.get(b.id) ?? 0) - (createdRank.get(a.id) ?? 0));
  return clone(result);
}

export async function createRequest(data) {
  await delay();
  const { type, title, authorId, authorName, date, formData, status, historyComment, requestNumber } = data;
  if (!type || !title || !authorId || !authorName || !date || !formData) {
    throw new Error("Champs obligatoires manquants");
  }
  const initialStatus = status || "soumise";
  const request = {
    id: nextId(store.requests),
    type, title, status: initialStatus,
    requestNumber: requestNumber || undefined,
    authorId: Number(authorId), authorName, date,
    formData: clone(formData),
    history: [{ status: initialStatus, by: authorName, date: today(), comment: historyComment || "", adminComment: "" }],
  };
  store.requests.push(request);
  createdRank.set(request.id, ++store.seq); // le plus récent → rang le plus élevé
  return clone(request);
}

function findRequest(id) {
  const request = store.requests.find((r) => r.id === Number(id));
  if (!request) throw new Error("Demande introuvable");
  return request;
}

export async function actionRequest(id, { newStatus, comment, adminComment, by, updatedRows }) {
  await delay();
  if (!newStatus || !by) throw new Error("newStatus et by sont requis");
  const request = findRequest(id);
  request.status = newStatus;
  if (updatedRows) request.formData._rows = clone(updatedRows);
  request.history.push({ status: newStatus, by, date: today(), comment: comment || "", adminComment: adminComment || "" });
  return clone(request);
}

export async function updateItems(id, updatedRows) {
  await delay();
  if (!Array.isArray(updatedRows)) throw new Error("updatedRows doit être un tableau");
  const request = findRequest(id);
  request.formData._rows = clone(updatedRows);
  return clone(request);
}

export async function updateRequest(id, { title, formData }) {
  await delay();
  if (!formData) throw new Error("formData requis");
  const request = findRequest(id);
  if (title) request.title = title;
  request.formData = clone(formData);
  return clone(request);
}

export async function deleteRequest(id) {
  await delay();
  const idx = store.requests.findIndex((r) => r.id === Number(id));
  if (idx === -1) throw new Error("Demande introuvable");
  store.requests.splice(idx, 1);
  return { message: "Demande supprimée" };
}

export async function deleteSchoolYear(year) {
  await delay();
  const before = store.requests.length;
  store.requests = store.requests.filter((r) => getSchoolYear(r.date) !== year);
  const deleted = before - store.requests.length;
  return deleted === 0
    ? { deleted: 0, message: "Aucune demande pour cette année scolaire" }
    : { deleted, message: `${deleted} demande(s) supprimée(s)` };
}

// ── Paramètres ──
export async function getSettings() {
  await delay();
  return clone(store.settings);
}

export async function updateSetting(key, value) {
  await delay();
  store.settings[key] = clone(value);
  return { key, value: clone(value) };
}
