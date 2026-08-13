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
  brouillon:             { label: "Brouillon",              color: "#94a3b8" },
  soumise:               { label: "Soumise",                color: "#64748b" },
  acceptee:              { label: "Approuvée",              color: "#0284c7" },
  acceptee2:             { label: "Approuvée (Approbateur +)", color: "#2563eb" },
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

// ─── Messages conditionnels des formulaires (modifiables par l'administrateur) ──
// Affichés selon les cases cochées / réponses données dans les formulaires.
export const DEFAULT_FORM_MESSAGES = {
  achatPersonnelWarning: "À noter que vous devez attendre la confirmation avant de procéder à l'achat du matériel. Si vous achetez le tout avant, il se peut qu'il soit impossible de procéder à votre remboursement.",
  conferencierWarning: "Dans un minimum de trois semaines avant la conférence, il est important que le conférencier ou la conférencière remplisse le formulaire « Déclaration relative aux antécédents judiciaires ». Pour plus d'informations, merci de communiquer avec la secrétaire de l'école.",
  zoneGriseeWarning: "Merci de valider que {type} n'a pas lieu dans la zone grisée du calendrier scolaire.",
  dateProcheWarning: "La date de l'activité ou de la sortie est très près. Il se peut que la demande soit refusée. Merci de communiquer avec la direction.",
  autobusWarning: "Le coût de la location d'un autobus doit être ajouté au coût de l'activité. Si la sortie se fait dans le cadre d'une passion, ces coûts doivent être inclus dans votre budget. Veuillez contacter l'agente de bureau responsable du dossier pour plus de détails.",
};

export const CUSTOM_EVENT_COLORS = {
  mauve:      { label: "Mauve",      bg: "#ede9fe", border: "#7c3aed", dot: "#7c3aed" },
  bleu_fonce: { label: "Bleu foncé", bg: "#dbeafe", border: "#1e40af", dot: "#1e40af" },
  rose:       { label: "Rose",       bg: "#fce7f3", border: "#db2777", dot: "#db2777" },
  orange:     { label: "Orange",     bg: "#ffedd5", border: "#ea580c", dot: "#ea580c" },
  turquoise:  { label: "Turquoise",  bg: "#ccfbf1", border: "#0d9488", dot: "#0d9488" },
  gris:       { label: "Gris",       bg: "#f3f4f6", border: "#6b7280", dot: "#6b7280" },
};
