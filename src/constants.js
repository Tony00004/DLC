// ─── Color palette (from HTML files) ────────────────────────────────────────
export const COLORS = {
  bleu: "#04043C",
  vert: "#008c4a",
  vertFonce: "#006c39",
  rouge: "#b42318",
  gris: "#666",
  grisClair: "#e5e7eb",
  fond: "#f6f7f9",
  blanc: "#ffffff",
  noir: "#171717",
};

// ─── Paramètres globaux modifiables par admin ────────────────────────────────
export const config = { coutLiberationDefault: "233.34" };

// ─── Status helpers ──────────────────────────────────────────────────────────
export const STATUSES = {
  soumise:               { label: "Soumise",                color: "#64748b" },
  acceptee:              { label: "Approuvée",              color: "#0284c7" },
  validee:               { label: "Vérifiée",               color: "#7c3aed" },
  commandee:             { label: "En commande",            color: "#ea580c" },
  partiellement_traitee: { label: "Partiellement complétée", color: "#f59e0b" },
  traitee:               { label: "Traitée",                color: "#008c4a" },
  refusee:               { label: "Refusée",                color: "#b42318" },
  annulee:               { label: "Annulée",                color: "#78350f" },
};

export const REQUEST_TYPES = {
  achat: "Demande d'achat de matériel",
  activite: "Demande d'activités et de sorties",
  requisition: "Demande de réquisition interne",
};

export const MATIERES = ["Accueil","Adaptation scolaire","Anglais","Arts","Culture et citoyenneté québécoise (CCQ)","Éducation physique","Français","Mathématiques","Science","Univers social / Histoire","Non applicable","Autre"];
export const NIVEAUX  = ["Accueil","Année transitoire (AT)","EMS","Pré-DÉP","S1","S2","S3","S4","S5","Soutien à l'apprentissage (SA)","Soutien à l'autonomie et la socialisation (SAS)","Autre","Non applicable"];

export const CUSTOM_EVENT_COLORS = {
  mauve:      { label: "Mauve",      bg: "#ede9fe", border: "#7c3aed", dot: "#7c3aed" },
  bleu_fonce: { label: "Bleu foncé", bg: "#dbeafe", border: "#1e40af", dot: "#1e40af" },
  rose:       { label: "Rose",       bg: "#fce7f3", border: "#db2777", dot: "#db2777" },
  orange:     { label: "Orange",     bg: "#ffedd5", border: "#ea580c", dot: "#ea580c" },
  turquoise:  { label: "Turquoise",  bg: "#ccfbf1", border: "#0d9488", dot: "#0d9488" },
  gris:       { label: "Gris",       bg: "#f3f4f6", border: "#6b7280", dot: "#6b7280" },
};
