import { useState, useEffect, useMemo } from "react";
// ═══════════════════════════════════════════════════
// FICHIER CORRIGÉ — Version finale — Date.now() retiré
// Si vous voyez cette ligne dans votre App.jsx, c'est le bon fichier
// ═══════════════════════════════════════════════════

// ─── Color palette (from HTML files) ────────────────────────────────────────
const COLORS = {
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

// ─── Mock users DB ───────────────────────────────────────────────────────────
const USERS = [
  { id: 1,  name: "Mario Dumont",    email: "mdupont",    password: "1234",  roles: [] },
  { id: 2,  name: "Jean Martin",     email: "jmartin",    password: "1234",  roles: ["A"] },
  { id: 8,  name: "Pierre Lefebvre", email: "plefebvre",  password: "1234",  roles: ["A"] },
  { id: 3,  name: "Sophie Bernard",  email: "sbernard",   password: "1234",  roles: ["B", "D"] },
  { id: 4,  name: "Luc Tremblay",    email: "ltremblay",  password: "1234",  roles: ["C1"] },
  { id: 6,  name: "Paula Gagnon",    email: "pgagnon",    password: "1234",  roles: ["C2"] },
  { id: 7,  name: "Michel Caron",    email: "mcaron",     password: "1234",  roles: ["C3"] },
  { id: 5,  name: "Admin Système",   email: "admin",      password: "admin", roles: ["D", "A", "B", "C1", "C2", "C3"] },
];

// ─── Paramètres globaux modifiables par admin ────────────────────────────────
let COUT_LIBERATION_DEFAULT = "233.34";

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUSES = {
  soumise: { label: "Soumise", color: "#64748b" },
  acceptee: { label: "Approuvée", color: "#0284c7" },
  validee: { label: "Vérifiée", color: "#7c3aed" },
  traitee: { label: "Traitée", color: "#008c4a" },
  refusee: { label: "Refusée", color: "#b42318" },
  annulee: { label: "Annulée", color: "#78350f" },
};

const REQUEST_TYPES = {
  achat: "Demande d'achat de matériel",
  activite: "Demande d'activités et de sorties",
  requisition: "Demande de réquisition interne",
};

// ─── Shared CSS-in-JS styles ─────────────────────────────────────────────────
const S = {
  // Layout
  page: { minHeight: "100vh", background: COLORS.fond, fontFamily: "Arial, Helvetica, sans-serif", color: COLORS.noir },
  topbar: {
    background: COLORS.bleu, display: "grid", gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center", padding: "14px 24px", gap: 16,
  },
  topbarLeft: { display: "flex", alignItems: "center", justifyContent: "flex-start" },
  topbarCenter: { textAlign: "center" },
  topbarRight: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 },
  appTitle: { margin: 0, fontSize: 22, color: "#fff", fontWeight: 700, letterSpacing: "0.07em" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#fff", opacity: 0.85 },
  content: { maxWidth: 1200, margin: "0 auto", padding: "28px 24px" },
  card: { background: "#fff", border: "1px solid #d9dee5", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", padding: "28px 32px", marginBottom: 24 },
  // Typography
  sectionTitle: { margin: "0 0 14px", fontSize: 18, color: COLORS.vertFonce, borderBottom: `2px solid ${COLORS.vertFonce}`, paddingBottom: 8, fontWeight: 700 },
  label: { display: "block", marginBottom: 6, fontWeight: 700, fontSize: 14 },
  // Inputs
  input: { width: "100%", border: "1px solid #bfc7d1", borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "#fff", boxSizing: "border-box" },
  select: { width: "100%", border: "1px solid #bfc7d1", borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "#fff", boxSizing: "border-box" },
  textarea: { width: "100%", border: "1px solid #bfc7d1", borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "#fff", boxSizing: "border-box", minHeight: 90, resize: "vertical" },
  // Buttons
  btnPrimary: { background: COLORS.vert, color: "#fff", border: `1px solid ${COLORS.vertFonce}`, borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 },
  btn: { background: "#fff", color: COLORS.noir, border: "1px solid #c8d0d8", borderRadius: 6, padding: "9px 16px", fontSize: 14, cursor: "pointer" },
  btnDanger: { background: COLORS.rouge, color: "#fff", border: `1px solid ${COLORS.rouge}`, borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
  btnSmall: { background: "#fff", color: COLORS.vert, border: `2px solid ${COLORS.vert}`, borderRadius: 6, padding: "2px 12px", fontSize: 18, fontWeight: 700, cursor: "pointer", lineHeight: 1 },
  // Grids
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 22px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px 22px" },
  field: { marginBottom: 0 },
  // Messages
  success: { background: "#e8f7ee", border: "1px solid #b7dfc5", color: "#146c3a", borderRadius: 6, padding: "12px 14px", marginTop: 14, fontSize: 14 },
  error: { background: "#fdecec", border: "1px solid #f5c2c7", color: "#842029", borderRadius: 6, padding: "12px 14px", marginTop: 14, fontSize: 14 },
  // Badges
  badge: (color) => ({ display: "inline-block", background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 700 }),
  // Tables
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: COLORS.vertFonce, color: "#fff", padding: "8px 10px", textAlign: "left", fontSize: 13, fontWeight: 700 },
  td: { padding: "8px 10px", borderBottom: "1px solid #e5e7eb", fontSize: 13, verticalAlign: "middle" },
};


// ─── Print styles ─────────────────────────────────────────────────────────────
const PRINT_STYLE = ``;

// Fonction utilitaire pour imprimer un formulaire dans une nouvelle fenêtre dédiée
function printZone() {
  var el = document.getElementById("print-zone");
  if (!el) { alert("Aucun contenu à imprimer."); return; }
  var html = el.innerHTML;
  var w = window.open("", "_blank", "width=900,height=700");
  var css = [
    "@page { margin: 10mm 12mm; size: legal portrait; }",
    "body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #111; margin: 16px; padding: 0; }",
    "h2 { font-size: 15px; margin: 0 0 4px; }",
    "h3 { font-size: 12px; margin: 10px 0 4px; border-bottom: 1px solid #006c39; padding-bottom: 3px; color: #006c39; }",
    "h4 { font-size: 12px; margin: 8px 0 4px; color: #006c39; border-bottom: 1px solid #006c39; padding-bottom: 3px; }",
    "label { font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #777; display: block; margin-bottom: 1px; }",
    "input, select, textarea { border: none; border-bottom: 1px solid #ccc; padding: 1px 0; font-size: 11px; width: 100%; box-sizing: border-box; background: transparent; }",
    "textarea { min-height: 24px; resize: none; }",
    "table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }",
    "th { background: #04043C; color: white; padding: 5px 6px; text-align: left; font-size: 10px; }",
    "td { padding: 4px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }",
    "tr:nth-child(even) td { background: #f5f7f5; }",
    "tfoot td { background: #e8f5ee !important; font-weight: bold; }",
    "a { color: #006c39; }",
    "button, .no-print { display: none !important; }",
    "div[style*='box-shadow'] { box-shadow: none !important; border: none !important; }",
    "body::after { content: 'Aucune demande papier ne sera accept\u00e9e.'; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 42px; font-weight: 900; color: rgba(0,0,0,0.04); white-space: nowrap; pointer-events: none; z-index: 9999; }"
  ].join(" ");
  var page = "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Impression DLC</title><style>" + css + "</style></head><body>" + html + "</body></html>";
  w.document.open();
  w.document.write(page);
  w.document.close();
  setTimeout(function() { w.focus(); w.print(); }, 500);
}

// ─── DLC Logo ────────────────────────────────────────────────────────────────
function DLCLogo({ size = 52 }) {
  return (
    <img
      src="data:image/png;base64,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"
      alt="DLC"
      style={{ height: size, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

// ─── École de la Croisée Logo ─────────────────────────────────────────────────
function EcoleLogo() {
  return (
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4AAAAQ4CAIAAABnsVYUAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFUmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTA2LTIzPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUhOWjNkdHQtSSZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBRmVtVTN2aEFNJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0NTUyBMYXZhbCZxdW90O308L0F0dHJpYjpEYXRhPgogICAgIDxBdHRyaWI6RXh0SWQ+M2Q2ZTdiNmEtYzJiMC00M2I3LWEwMTEtNmRjYWIwMjBkZWNhPC9BdHRyaWI6RXh0SWQ+CiAgICAgPEF0dHJpYjpGYklkPjUyNTI2NTkxNDE3OTU4MDwvQXR0cmliOkZiSWQ+CiAgICAgPEF0dHJpYjpUb3VjaFR5cGU+MjwvQXR0cmliOlRvdWNoVHlwZT4KICAgIDwvcmRmOmxpPgogICA8L3JkZjpTZXE+CiAgPC9BdHRyaWI6QWRzPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPkRlc2lnbiBzYW5zIHRpdHJlIC0gMTwvcmRmOmxpPgogICA8L3JkZjpBbHQ+CiAgPC9kYzp0aXRsZT4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6cGRmPSdodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvJz4KICA8cGRmOkF1dGhvcj5BbnRob255IENhc3Rvbmd1YXk8L3BkZjpBdXRob3I+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnhtcD0naHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyc+CiAgPHhtcDpDcmVhdG9yVG9vbD5DYW52YSAoUmVuZGVyZXIpIGRvYz1EQUhOWjNkdHQtSSB1c2VyPVVBRmVtVTN2aEFNIGJyYW5kPUNTUyBMYXZhbDwveG1wOkNyZWF0b3JUb29sPgogPC9yZGY6RGVzY3JpcHRpb24+CjwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9J3InPz5470MPAAAATmVYSWZNTQAqAAAACAAEARoABQAAAAEAAAA+ARsABQAAAAEAAABGASgAAwAAAAEAAgAAAhMAAwAAAAEAAQAAAAAAAAAAAGAAAAABAAAAYAAAAAF3Bd/nAAEqx0lEQVR4nOzYQQ0AIRDAwAVh51/WmaAhITMK+u6a+QYAAAAAAE7btwMAAAAAAHiTAQ0AAAAAQMKABgAAAAAgYUADAAAAAJAwoAEAAAAASBjQAAAAAAAkDGgAAAAAABIGNAAAAAAACQMaAAAAAICEAQ0AAAAAQMKABgAAAAAgYUADAAAAAJAwoAEAAAAASBjQAAAAAAAkDGgAAAAAABIGNAAAAAAACQMaAAAAAICEAQ0AAAAAQMKABgAAAAAgYUADAAAAAJAwoAEAAAAASBjQAAAAAAAkDGgAAAAAABIGNAAAAAAACQMaAAAAAICEAQ0AAAAAQMKABgAAAAAgYUADAAAAAJAwoAEAAAAASBjQAAAAAAAkDGgAAAAAABIGNAAAAAAACQMaAAAAAICEAQ0AAAAAQMKABgAAAAAgYUADAAAAAJAwoAEAAAAASBjQAAAAAAAkDGgAAAAAABIGNAAAAAAACQMaAAAAAICEAQ0AAAAAQMKABgAAAAAgYUADAAAAAJAwoAEAAAAASPwAAAD//+zYsQAAAADAIH/rUewrjAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAIAAD//+zYsQAAAADAIH/rUewrjAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAIAAD//+zYsQAAAADAIH/r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AQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAIAAD//+zYsQAAAADAIH/rUewrjAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAIAAD//+zYsQAAAADAIH/rUewrjAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAIAAD//+3YsQAAAADAIH/rUewrjAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAQ0AAAAAAALAQ0AAAAAAALAQ0AAAAAwEJAAwAAAACwENAAAAAAACwENAAAAAAACwENAAAAAMBCQAMAAAAAsBDQAAAAAAAsBDQAAAAAAAsBDQAAAADAQkADAAAAALAI78b5BkrrCj4AAAAASUVORK5CYII="
      alt="École de la Croisée"
      style={{ height: 50, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ user, onLogout, setView, requests }) {
  return (
    <div style={S.topbar}>
      <div style={S.topbarLeft}>
        <DLCLogo size={50} />
      </div>
      <div style={S.topbarCenter}>
        <h1 style={S.appTitle}>Demandes Locales Centralisées</h1>
        <p style={S.subtitle}>CSS Laval</p>
      </div>
      <div style={S.topbarRight}>
        {user && (
          <>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{user.name}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                {user.roles.length > 0
                  ? user.roles.map(r => r === "A" ? "Approbateur" : r === "B" ? "Vérificateur" : r === "C1" ? "Secrétaire" : r === "C2" ? "Magasinier" : r === "C3" ? "Concierge" : r === "D" ? "Administrateur" : r).join(", ")
                  : "Utilisateur"}
              </div>
            </div>
            <button style={{ ...S.btn, fontSize: 12, padding: "6px 12px" }} onClick={onLogout}>
              Déconnexion
            </button>
          </>
        )}
        <EcoleLogo />
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const u = USERS.find((x) => x.email === email && x.password === password);
    if (u) {
      setError("");
      onLogin(u);
    } else {
      setError("Courriel ou mot de passe invalide.");
    }
  }

  return (
    <div style={{ ...S.page, display: "flex", flexDirection: "column" }}>
      <Topbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ ...S.card, maxWidth: 460, width: "100%", padding: "0 0 32px", overflow: "hidden" }}>
          <div style={{ background: COLORS.bleu, padding: "36px 32px 28px", textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <DLCLogo size={110} />
            </div>
            <h2 style={{ margin: "0 0 6px", color: "#fff", fontSize: 24, fontWeight: 700, letterSpacing: "0.04em" }}>Connexion</h2>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.82)", fontSize: 13 }}>Accès réservé au personnel de l'école</p>
          </div>
          <div style={{ padding: "0 32px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Identifiant (courriel)</label>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #bfc7d1", borderRadius: 6, overflow: "hidden" }}>
                <input
                  style={{ ...S.input, border: "none", flex: 1, borderRadius: 0 }}
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom"
                  required
                />
                <span style={{ padding: "0 10px", background: "#f3f4f6", color: COLORS.gris, fontSize: 12, whiteSpace: "nowrap", borderLeft: "1px solid #bfc7d1", lineHeight: "38px" }}>
                  @csslaval.gouv.qc.ca
                </span>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Mot de passe</label>
              <input style={S.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <div style={S.error}>{error}</div>}
            <button type="submit" style={{ ...S.btnPrimary, width: "100%", padding: "12px", marginTop: 16, fontSize: 15 }}>
              Connexion
            </button>
          </form>
          <div style={{ marginTop: 24, padding: "14px 16px", background: "#f6f7f9", borderRadius: 6, fontSize: 12, color: COLORS.gris }}>
            <strong style={{ color: COLORS.bleu, fontSize: 13 }}>Comptes démo</strong>
            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              {[
                { email: "mdupont",   pwd: "1234",  nom: "Mario Dumont",   role: "Utilisateur",    color: "#6b7280" },
                { email: "jmartin",   pwd: "1234",  nom: "Jean Martin",     role: "Approbateur",    color: "#0284c7" },
                { email: "plefebvre", pwd: "1234",  nom: "Pierre Lefebvre", role: "Approbateur",    color: "#0284c7" },
                { email: "sbernard",  pwd: "1234",  nom: "Sophie Bernard",  role: "Vérificateur",   color: "#7c3aed" },
                { email: "ltremblay", pwd: "1234",  nom: "Luc Tremblay",   role: "Secrétaire",     color: "#ea580c" },
                { email: "pgagnon",   pwd: "1234",  nom: "Paula Gagnon",   role: "Magasinier",     color: "#0891b2" },
                { email: "mcaron",    pwd: "1234",  nom: "Michel Caron",   role: "Concierge",      color: "#059669" },
                { email: "admin",     pwd: "admin", nom: "Admin Système",  role: "Administrateur", color: "#dc2626" },
              ].map(c => (
                <div key={c.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", background: "#fff", borderRadius: 5, border: "1px solid #e5e7eb", cursor: "pointer" }}
                  onClick={() => { setEmail(c.email); setPassword(c.pwd); }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "#374151", fontSize: 12 }}>{c.nom}</span>
                    <span style={{ marginLeft: 6, fontSize: 11, background: c.color + "18", color: c.color, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>{c.role}</span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.gris }}>
                    {c.email} / {c.pwd}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "center" }}>Cliquez sur un compte pour le sélectionner</p>
          </div>
          </div>{/* fin padding div */}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, requests, setView, setSelectedRequest, activeForms, setPrevView }) {
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(null);
  const myRequests = requests.filter((r) => r.authorId === user.id);
  const pendingA  = requests.filter(r => r.status === "soumise" && ["achat","activite"].includes(r.type) && user.roles.includes("A")
    && (user.roles.includes("D") || !r.formData || r.formData.directionResponsable === user.name));
  const pendingB  = requests.filter(r => r.status === "acceptee" && user.roles.includes("B"));
  const pendingC1 = requests.filter(r => r.status === "validee" && ["achat","activite"].includes(r.type) && user.roles.includes("C1"));
  const pendingC2 = requests.filter(r => ((["validee","commandee"].includes(r.status) && r.type === "achat") || (r.status === "validee_C2" && r.type === "requisition")) && user.roles.includes("C2"));
  const pendingC3 = requests.filter(r => r.status === "validee_C3" && r.type === "requisition" && user.roles.includes("C3"));

  function statusCount(st) {
    return myRequests.filter((r) => r.status === st).length;
  }

  return (
    <div style={S.content}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Tableau de bord</h2>

      {/* Stats row — 5 catégories */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Mes demandes soumises",                  value: statusCount("soumise"),  color: "#6b7280", icon: "📝" },
          { label: "Mes demandes en cours d'approbation",    value: statusCount("acceptee"), color: "#0284c7", icon: "👍" },
          { label: "Mes demandes en cours de vérification",  value: statusCount("validee"),  color: "#7c3aed", icon: "✅" },
          { label: "Mes demandes en cours de traitement",    value: statusCount("validee"), color: "#ea580c", icon: "🔧" },
          { label: "Mes demandes complétées",                value: statusCount("traitee"), color: COLORS.vert, icon: "🏁" },
        ].map((stat) => (
          <div key={stat.label} style={{ ...S.card, textAlign: "center", padding: "16px 10px", marginBottom: 0 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: COLORS.gris, marginTop: 4, lineHeight: 1.3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Nouvelle demande (colonne gauche) + Calendrier (colonne droite) */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24, marginBottom: 24, alignItems: "start" }}>
        <div style={{ ...S.card, marginBottom: 0 }}>
          <h3 style={S.sectionTitle}>Nouvelle demande</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(REQUEST_TYPES).map(([key, label]) => (
              <button key={key} style={S.btnPrimary} onClick={() => setView("form_" + key)}>
                + {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...S.card, marginBottom: 0, padding: "18px 20px" }}>
          <h3 style={{ ...S.sectionTitle, fontSize: 15, marginBottom: 10, paddingBottom: 6 }}>Calendrier</h3>
          {(() => {
            const now = new Date();
            const todayIso = now.toISOString().slice(0, 10);

            const sortieDates = new Set();
            requests.forEach((r) => {
              if (r.type === "activite" && r.formData?.typeActivite?.includes("Sortie") && Array.isArray(r.formData?.datesPrevues)) {
                r.formData.datesPrevues.forEach((d) => { if (d.date) sortieDates.add(d.date); });
              }
            });

            const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
            const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

            const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
            const startOffset = (first.getDay() + 6) % 7; // lundi = 0
            const gridStart = new Date(first);
            gridStart.setDate(first.getDate() - startOffset);

            const cells = [];
            for (let i = 0; i < 42; i++) {
              const d = new Date(gridStart);
              d.setDate(gridStart.getDate() + i);
              const iso = d.toISOString().slice(0, 10);
              const inMonth = d.getMonth() === calMonth.getMonth();
              const dowIdx = (d.getDay() + 6) % 7; // lundi = 0 … dimanche = 6
              cells.push({ iso, day: d.getDate(), inMonth, isWeekend: dowIdx >= 5, isToday: iso === todayIso, hasSortie: sortieDates.has(iso) });
            }
            while (cells.length > 35 && cells.slice(-7).every((c) => !c.inMonth)) cells.splice(-7, 7);

            const isCurrentMonth = calMonth.getMonth() === now.getMonth() && calMonth.getFullYear() === now.getFullYear();

            return (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <button style={{ ...S.btn, padding: "3px 8px", fontSize: 12 }} onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>‹</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 12.5 }}>{MOIS[calMonth.getMonth()]} {calMonth.getFullYear()}</strong>
                    {!isCurrentMonth && (
                      <button style={{ ...S.btn, padding: "2px 7px", fontSize: 10.5 }} onClick={() => setCalMonth(new Date(now.getFullYear(), now.getMonth(), 1))}>Aujourd'hui</button>
                    )}
                  </div>
                  <button style={{ ...S.btn, padding: "3px 8px", fontSize: 12 }} onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>›</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {jours.map((j) => (
                    <div key={j} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, color: COLORS.gris, textTransform: "uppercase" }}>{j}</div>
                  ))}
                  {cells.map((c) => (
                    <div key={c.iso}
                      onClick={() => { if (c.hasSortie && c.inMonth) setSelectedDate(c.iso); }}
                      style={{
                        borderRadius: 5,
                        padding: "4px 2px",
                        textAlign: "center",
                        minHeight: 26,
                        border: c.isToday ? `2px solid ${COLORS.bleu}` : "1px solid #e5e7eb",
                        background: !c.inMonth ? "#f6f7f9" : c.hasSortie ? "#d1f5e0" : c.isWeekend ? "#e5e7eb" : "#fff",
                        opacity: c.inMonth ? 1 : 0.45,
                        cursor: c.hasSortie && c.inMonth ? "pointer" : "default",
                      }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: c.hasSortie && c.inMonth ? COLORS.vertFonce : COLORS.noir }}>{c.day}</div>
                      {c.hasSortie && c.inMonth && <div style={{ fontSize: 7, marginTop: 1, color: COLORS.vertFonce, fontWeight: 700 }}>Sortie</div>}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 10.5, color: COLORS.gris }}>
                  <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#d1f5e0", borderRadius: 2, marginRight: 5 }}></span>Demande de sortie</span>
                  <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#e5e7eb", borderRadius: 2, marginRight: 5 }}></span>Fin de semaine</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Détail des sorties pour une date du calendrier */}
      {selectedDate && (() => {
        const sortiesDuJour = requests.filter(r =>
          r.type === "activite" &&
          r.formData?.typeActivite?.includes("Sortie") &&
          Array.isArray(r.formData?.datesPrevues) &&
          r.formData.datesPrevues.some(d => d.date === selectedDate)
        );
        const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setSelectedDate(null)}>
            <div style={{ ...S.card, maxWidth: 560, width: "90%", maxHeight: "80vh", overflowY: "auto", marginBottom: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ ...S.sectionTitle, margin: 0, border: "none", padding: 0, textTransform: "capitalize" }}>Sorties du {dateLabel}</h3>
                <button style={{ ...S.btn, padding: "4px 10px" }} onClick={() => setSelectedDate(null)}>✕</button>
              </div>
              {sortiesDuJour.length === 0 ? (
                <p style={{ color: COLORS.gris, fontSize: 14 }}>Aucune sortie prévue à cette date.</p>
              ) : (
                sortiesDuJour.map((r) => {
                  const fd = r.formData || {};
                  const dInfo = fd.datesPrevues.find(d => d.date === selectedDate);
                  return (
                    <div key={r.id} style={{ padding: "12px 14px", marginBottom: 10, background: "#f6f7f9", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.bleu, marginBottom: 6 }}>{fd.nomActivite || fd["Nom de l'activité"] || r.title}</div>
                      <div style={{ fontSize: 13, marginBottom: 3 }}><strong>Date et heure :</strong> {dInfo?.date}{dInfo?.heureDebut && dInfo?.heureFin ? ` de ${dInfo.heureDebut} à ${dInfo.heureFin}` : ""}</div>
                      <div style={{ fontSize: 13, marginBottom: 3 }}><strong>Matières concernées :</strong> {(fd.matieresConcernees || []).join(", ") || "—"}</div>
                      <div style={{ fontSize: 13, marginBottom: 3 }}><strong>Niveaux concernés :</strong> {(fd.niveauxConcernes || []).join(", ") || "—"}</div>
                      <div style={{ fontSize: 13, marginBottom: 3 }}><strong>Dans le cadre d'une passion :</strong> {fd.passion || "Non"}</div>
                      <div style={{ fontSize: 13 }}><strong>Groupes concernés :</strong> {fd.groupes || fd["Groupes"] || "—"}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* Role actions — toujours visible si au moins 1 rôle exécutant */}
      {(user.roles.some(r => ["A","B","C1","C2","C3","D"].includes(r))) && (
        <div style={{ ...S.card, marginBottom: 24 }}>
          <h3 style={{ ...S.sectionTitle, marginBottom: 16 }}>Actions requises</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { role: "A",  label: "Approbateur",  count: pendingA.length,  color: "#0284c7", queue: "queue_A" },
              { role: "B",  label: "Vérificateur", count: pendingB.length,  color: "#7c3aed", queue: "queue_B" },
              { role: "C1", label: "Secrétaire",   count: pendingC1.length, color: "#ea580c", queue: "queue_C1" },
              { role: "C2", label: "Magasinier",   count: pendingC2.length, color: "#0891b2", queue: "queue_C2" },
              { role: "C3", label: "Concierge",    count: pendingC3.length, color: COLORS.vert, queue: "queue_C3" },
            ].filter(item => user.roles.includes(item.role)).map(item => (
              <button key={item.role}
                style={{ ...S.btn, borderColor: item.color, color: item.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px" }}
                onClick={() => setView(item.queue)}>
                {item.label}
                <span style={{
                  background: item.count > 0 ? "#ef4444" : "#e5e7eb",
                  color: item.count > 0 ? "#fff" : "#9ca3af",
                  borderRadius: 12, padding: "2px 8px", fontSize: 12, fontWeight: 900, minWidth: 24, textAlign: "center"
                }}>{item.count}</span>
              </button>
            ))}
            {user.roles.includes("D") && (
              <button style={{ ...S.btn, borderColor: COLORS.bleu, color: COLORS.bleu, fontWeight: 700 }} onClick={() => setView("admin")}>
                Administration des rôles
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section "Demandes du système" pour le vérificateur (B) ou admin (D) */}
      {(user.roles.includes("B") || user.roles.includes("D")) && (
        <div style={{ ...S.card, marginBottom: 20, background: "linear-gradient(135deg, #f0f8f4 0%, #e8f5ee 100%)", border: "1px solid #c3e6d4" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ ...S.sectionTitle, margin: "0 0 4px", color: COLORS.vertFonce }}>Demandes du système</h3>
              <p style={{ margin: 0, fontSize: 13, color: COLORS.gris }}>
                Consultez l'historique complet de toutes les demandes du système.
              </p>
            </div>
            <button style={{ ...S.btnPrimary, padding: "8px 18px", fontSize: 13, whiteSpace: "nowrap" }}
              onClick={() => setView("history")}>
              Voir l'historique complet
            </button>
          </div>
        </div>
      )}

      {/* My requests list */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ ...S.sectionTitle, margin: 0 }}>Mes demandes récentes</h3>
          <button style={{ ...S.btn, fontSize: 13, padding: "6px 14px" }} onClick={() => setView("history")}>
            Mon historique
          </button>
        </div>
        {myRequests.length === 0 ? (
          <p style={{ color: COLORS.gris, fontSize: 14 }}>Aucune demande pour l'instant. Créez votre première demande ci-dessus.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {["#", "Type", "Titre", "Date", "Statut", "Actions"].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myRequests.map((r, i) => {
                const st = STATUSES[r.status] || { label: r.status, color: "#6b7280" };
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={S.td}>{r.id}</td>
                    <td style={S.td}><span style={{ fontSize: 12 }}>{REQUEST_TYPES[r.type]}</span></td>
                    <td style={S.td}><strong>{r.title}</strong></td>
                    <td style={S.td}>{r.date}</td>
                    <td style={S.td}><span style={S.badge(st.color)}>{st.label}</span></td>
                    <td style={S.td}>
                      <button style={{ ...S.btn, padding: "4px 12px", fontSize: 12 }} onClick={() => { setSelectedRequest(r); setView("detail"); }}>
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Request Detail / Progression ─────────────────────────────────────────────
function RequestDetail({ request, user, onAction, onBack, onEdit, onCancel, onUpdateItems }) {
  const [comment, setComment] = useState("");
  const [adminComment, setAdminComment] = useState("");
  // Étapes selon le type de demande
  const isRequisition = request.type === "requisition";
  const steps = isRequisition
    ? [
        { key: "soumise",  label: "Soumise",    icon: "📝" },
        { key: "acceptee", label: "Reçue",       icon: "📬" },
        { key: "validee",  label: "Vérifiée",    icon: "✅" },
        { key: "traitee",  label: "Complétée",   icon: "🔧" },
      ]
    : request.type === "achat"
    ? [
        { key: "soumise",   label: "Soumise",     icon: "📝" },
        { key: "acceptee",  label: "Approuvée",   icon: "👍" },
        { key: "validee",   label: "Vérifiée",    icon: "✅" },
        { key: "commandee", label: "En commande", icon: "📦" },
        { key: "traitee",   label: "Complétée",   icon: "🏁" },
      ]
    : [
        { key: "soumise",  label: "Soumise",    icon: "📝" },
        { key: "acceptee", label: "Approuvée",  icon: "👍" },
        { key: "validee",  label: "Vérifiée",   icon: "✅" },
        { key: "traitee",  label: "Complétée",  icon: "🏁" },
      ];
  const currentIdx = steps.findIndex((s) => s.key === request.status);

  const canActRole = (role) => user.roles.includes(role);
  const isAdmin = user.roles.includes("D");
  const isAuthor = request.authorId === user.id;

  // Déterminer le rôle exécutant selon le type de demande
  const execRole = request.type === "requisition" ? "C3"
                 : request.type === "achat"       ? "C1"
                 : "C1"; // activite → secrétaire

  const isExecForType = canActRole(execRole) || isAdmin;
  const isMagasinier = canActRole("C2") || isAdmin;

  // Approbation : seulement pour achat et activite
  const canApprove = request.status === "soumise" && ["achat","activite"].includes(request.type)
                     && (canActRole("A") || isAdmin);
  // Vérification : achat+activite après approbation, réquisition dès soumise(=acceptee)
  const canVerify = request.status === "acceptee" && (canActRole("B") || isAdmin);
  // Secrétaire (C1) traite achat/activite quand validée
  const canSecretary = request.status === "validee"
                       && ["achat","activite"].includes(request.type)
                       && (canActRole("C1") || isAdmin);
  // Magasinier (C2) peut aussi compléter une demande d'achat validée ou en commande
  const canMagasinier = (
    (["validee","commandee"].includes(request.status) && request.type === "achat") ||
    (request.status === "validee_C2" && request.type === "requisition")
  ) && (canActRole("C2") || isAdmin);
  // Secrétaire peut marquer "en commande" une demande d'achat validée
  const canMarkCommande = request.status === "validee"
                          && request.type === "achat"
                          && (canActRole("C1") || isAdmin);
  // Concierge (C3) traite les réquisitions validées
  const canConcierge = ["validee_C3"].includes(request.status)
                       && request.type === "requisition"
                       && (canActRole("C3") || isAdmin);

  // Droits de modification
  const canAuthorEdit = isAuthor && request.status === "soumise" && ["achat","activite"].includes(request.type);
  const authorBlockedByApproval = isAuthor && request.status === "acceptee" && ["achat","activite"].includes(request.type);
  const canApproverEdit = (canActRole("A") || isAdmin) && ["soumise","acceptee"].includes(request.status);
  const approverBlockedByVerif = (canActRole("A") && !isAdmin) && ["validee","commandee","traitee"].includes(request.status);
  // Le magasinier (C2) ne peut PAS modifier — seulement consulter et commenter
  const canEdit = (canActRole("A") || canActRole("B") || canActRole("C1") || canActRole("C3") || isAdmin)
                  && !["traitee","refusee","annulee"].includes(request.status);
  const canCancel = isAuthor && ["soumise","acceptee"].includes(request.status);

  const approverName = request.history ? [...request.history].reverse().find(h => h.status === "acceptee")?.by : null;
  const verifierName = request.history ? [...request.history].reverse().find(h => h.status === "validee")?.by : null;
  const isTerminated = ["traitee","refusee","annulee"].includes(request.status);

  const btnVert = { background: "#008c4a", color: "#fff", border: "1px solid #006c39", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };
  const btnJaune = { background: "#ca8a04", color: "#fff", border: "1px solid #a16207", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };
  const btnRouge = { background: "#b42318", color: "#fff", border: "1px solid #b42318", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };
  const btnOrange = { background: "#ea580c", color: "#fff", border: "1px solid #c2410c", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };
  const btnVert2 = { background: "#23b090", color: "#fff", border: "1px solid #1a8a70", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };

  return (
    <div style={S.content}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }} className="no-print">
        <button style={{ ...S.btn }} onClick={onBack}>← Retour</button>
        <button style={{ background: "#04043C", color: "#fff", border: "1px solid #04043C", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={() => printZone()}>Imprimer</button>
      </div>
      <div id="print-zone" style={S.card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>{request.title}</h2>
            <div style={{ color: COLORS.gris, fontSize: 13 }}>
              {REQUEST_TYPES[request.type]}{request.requestNumber ? <span style={{ fontFamily: "monospace", marginLeft: 4 }}>· {request.requestNumber}</span> : ""} · Soumis le {request.date} par {request.authorName}
            </div>
          </div>
          <span style={S.badge(STATUSES[request.status]?.color || COLORS.gris)}>{STATUSES[request.status]?.label}</span>
        </div>

        {/* Progression */}
        <h3 style={S.sectionTitle}>Progression de la demande</h3>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28, overflowX: "auto" }}>
          {steps.map((step, idx) => {
            const done = idx <= currentIdx && !["refusee","annulee"].includes(request.status);
            const current = idx === currentIdx && !["refusee","annulee"].includes(request.status);
            return (
              <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 90 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    background: done ? COLORS.vert : "#e5e7eb",
                    border: current ? `3px solid ${COLORS.vertFonce}` : "3px solid transparent",
                    boxSizing: "border-box",
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 6, fontWeight: current ? 700 : 400, color: done ? COLORS.vertFonce : COLORS.gris, textAlign: "center" }}>
                    {step.label}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ height: 3, width: 40, background: idx < currentIdx && !["refusee","annulee"].includes(request.status) ? COLORS.vert : "#e5e7eb", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenu de la demande */}
        {request.formData && (
          <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
            <h3 style={S.sectionTitle}>Détails de la demande {request.requestNumber ? <span style={{ fontSize: 14, fontWeight: 400, fontFamily: "monospace", color: COLORS.gris }}>({request.requestNumber})</span> : ""}</h3>
            {request.type === "achat" && (
              <div>
                <div style={S.grid2}>
                  {[
                    ["Demandeur / Demandeuse", request.formData.demandePar],
                    ["Courriel", request.formData.courriel ? request.formData.courriel + "@csslaval.gouv.qc.ca" : ""],
                    ["Date de la demande", request.formData.dateDemande],
                    ["Date souhaitée pour le traitement", request.formData.dateSouhaitee],
                    ["Matière", request.formData.matiere + (request.formData.autreMatiere ? " — " + request.formData.autreMatiere : "") + (request.formData.matiereArts ? " (" + request.formData.matiereArts + ")" : "")],
                    ["Niveau", request.formData.niveau + (request.formData.autreNiveau ? " — " + request.formData.autreNiveau : "")],
                    ["Direction responsable", request.formData.directionResponsable],
                    ["Fournisseur principal", request.formData.fournisseurPrincipal],
                  ].map(([label, val]) => val ? (
                    <div key={label} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                      <div style={{ fontSize: 14, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>{String(val)}</div>
                    </div>
                  ) : null)}
                </div>
                {request.formData.natureActivite && (
                  <div style={{ marginTop: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Nature de la demande</div>
                    <div style={{ fontSize: 14, padding: "6px 8px", background: "#f9fafb", borderRadius: 4, marginTop: 4 }}>{request.formData.natureActivite}</div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 22px", marginBottom: 12 }}>
                  {[
                    ["Achat par moi-même", request.formData.achatPersonnel],
                    ["Conférencier / Conférencière", request.formData.conferencier],
                    ["Activité parascolaire", request.formData.parascolaire],
                    ["Budget passion", request.formData.budgetPassion],
                  ].map(([label, val]) => val ? (
                    <div key={label} style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                      <div style={{ fontSize: 14 }}>{String(val)}</div>
                    </div>
                  ) : null)}
                </div>
                {request.formData._rows && request.formData._rows.length > 0 && (() => {
                  const canManageItems = (canActRole("C1") || canActRole("C2") || isAdmin)
                    && ["validee","commandee","traitee"].includes(request.status);
                  const rows = request.formData._rows;
                  function toggleItem(idx, field) {
                    if (!canManageItems) return;
                    const updated = rows.map((r, i) => i === idx ? { ...r, [field]: !r[field] } : r);
                    if (onUpdateItems) onUpdateItems(request.id, updated);
                  }
                  return (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 15, color: COLORS.vertFonce, borderBottom: `1px solid ${COLORS.vertFonce}`, paddingBottom: 4 }}>Articles commandés</h4>
                        {canManageItems && (
                          <div style={{ fontSize: 12, color: COLORS.gris, display: "flex", gap: 14 }}>
                            <span>📦 Commandés : <strong>{rows.filter(r=>r.commande).length}/{rows.length}</strong></span>
                            <span>📬 Reçus : <strong>{rows.filter(r=>r.recu).length}/{rows.length}</strong></span>
                          </div>
                        )}
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ ...S.table, fontSize: 12 }}>
                          <thead>
                            <tr>
                              {["#","Qté","Nom du produit","Description","N° produit","Lien Web","Prix unit.","Sous-total",
                                ...(canManageItems ? ["✅ Commandé","📬 Reçu"] : [])
                              ].map((h) => (
                                <th key={h} style={{ ...S.th, padding: "6px 8px", fontSize: 11,
                                  textAlign: h.startsWith("✅")||h.startsWith("📬") ? "center" : undefined,
                                  width: h.startsWith("✅")||h.startsWith("📬") ? 70 : undefined,
                                  minWidth: h.startsWith("✅")||h.startsWith("📬") ? 70 : undefined,
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, idx) => (
                              <tr key={row.id||idx} style={{ background: row.recu ? "#f0fdf4" : row.commande ? "#eff6ff" : idx % 2 === 0 ? "#fff" : "#f5f7f5" }}>
                                <td style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                                <td style={S.td}>{row.qty}</td>
                                <td style={S.td}><strong>{row.nom}</strong></td>
                                <td style={S.td}>{row.description}</td>
                                <td style={S.td}>{row.numero}</td>
                                <td style={S.td}>{row.lien ? <a href={row.lien} target="_blank" rel="noreferrer" style={{ color: COLORS.vert, fontSize: 11 }}>Lien</a> : ""}</td>
                                <td style={{ ...S.td, textAlign: "right" }}>{row.prixUnitaire ? row.prixUnitaire + " $" : ""}</td>
                                <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{row.soustotal ? row.soustotal + " $" : ""}</td>
                                {canManageItems && (
                                  <>
                                    <td style={{ ...S.td, textAlign: "center" }}>
                                      <input type="checkbox" checked={!!row.commande}
                                        onChange={() => toggleItem(idx, "commande")}
                                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0284c7" }}
                                        title="Cocher une fois commandé" />
                                    </td>
                                    <td style={{ ...S.td, textAlign: "center" }}>
                                      <input type="checkbox" checked={!!row.recu}
                                        onChange={() => { if (!row.commande) { alert("Cochez d'abord que l'item a été commandé."); return; } toggleItem(idx, "recu"); }}
                                        style={{ width: 16, height: 16, cursor: row.commande ? "pointer" : "not-allowed", accentColor: "#059669", opacity: row.commande ? 1 : 0.35 }}
                                        title={row.commande ? "Cocher une fois reçu à l'école" : "À commander d'abord"} />
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: "#e8f5ee" }}>
                              <td colSpan={7} style={{ ...S.td, textAlign: "right", fontWeight: 700, fontSize: 13 }}>Total de la commande</td>
                              <td style={{ ...S.td, fontWeight: 700, fontSize: 13, textAlign: "right", whiteSpace: "nowrap" }}>{request.formData.total}</td>
                              {canManageItems && (
                                <td style={{ ...S.td, textAlign: "center" }}>
                                  <input type="checkbox"
                                    title="Tout cocher — Commandé"
                                    checked={rows.length > 0 && rows.every(r => r.commande)}
                                    onChange={e => {
                                      const val = e.target.checked;
                                      if (onUpdateItems) onUpdateItems(request.id, rows.map(r => ({ ...r, commande: val, recu: val ? r.recu : false })));
                                    }}
                                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0284c7" }} />
                                </td>
                              )}
                              {canManageItems && (
                                <td style={{ ...S.td, textAlign: "center" }}>
                                  <input type="checkbox"
                                    title="Tout cocher — Reçu"
                                    checked={rows.length > 0 && rows.every(r => r.recu)}
                                    onChange={e => {
                                      const val = e.target.checked;
                                      if (onUpdateItems) onUpdateItems(request.id, rows.map(r => ({ ...r, commande: val ? true : r.commande, recu: val })));
                                    }}
                                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#059669" }} />
                                </td>
                              )}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      {canManageItems && rows.every(r => r.recu) && rows.length > 0 && (
                        <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, color: "#166534", fontSize: 13, fontWeight: 600 }}>
                          ✅ Tous les articles ont été reçus à l'école. Vous pouvez marquer la demande comme complétée.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            {request.type === "activite" && (() => {
              const fd = request.formData;
              const Champ = ({ label, val, fullWidth }) => val && String(val).trim() ? (
                <div style={{ marginBottom: 8, gridColumn: fullWidth ? "1 / -1" : undefined }}>
                  <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                  <div style={{ fontSize: 14, padding: "2px 0", borderBottom: "1px solid #f0f0f0" }}>{String(val)}</div>
                </div>
              ) : null;
              return (
                <div>
                  <div style={S.grid2}>
                    <Champ label="Nom de l'activité" val={fd.nomActivite || fd["Nom de l'activité"]} />
                    <Champ label="Type d'activité" val={fd.typeActivite || fd["Type"]} />
                    <Champ label="Niveaux concernés" val={fd.niveauxConcernes?.join(", ") || fd["Niveaux"]} />
                    <Champ label="Groupes" val={fd.groupes || fd["Groupes"]} />
                    <Champ label="Matières concernées" val={fd.matieresConcernees?.join(", ")} />
                    <Champ label="Activité obligatoire" val={fd.obligatoire} />
                    <Champ label="Description" val={fd.description || fd["Description"]} fullWidth />
                    {fd.autresClientele && <Champ label="Autres clientèles" val={fd.autresClientele} fullWidth />}
                  </div>

                  {fd.responsables && fd.responsables.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Responsables additionnels</div>
                      {fd.responsables.map((r, i) => <div key={i} style={{ fontSize: 14 }}>{r.nom}</div>)}
                    </div>
                  )}

                  {fd.datesPrevues && fd.datesPrevues.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Date(s) prévue(s)</div>
                      {fd.datesPrevues.map((d, i) => (
                        <div key={i} style={{ fontSize: 14, marginBottom: 2 }}>{d.date} — {d.heureDebut} à {d.heureFin}</div>
                      ))}
                    </div>
                  )}

                  <div style={{ ...S.grid2, marginTop: 12 }}>
                    <Champ label="Heure de départ" val={fd.heureDepart} />
                    <Champ label="Heure de retour" val={fd.heureRetour} />
                    <Champ label="Nom de l'établissement" val={fd.nomEtablissement} />
                    <Champ label="Adresse" val={fd.adresseComplete} />
                    <Champ label="Personne contact" val={fd.personneContact} />
                    <Champ label="Téléphone" val={fd.telephone ? fd.telephone + (fd.poste ? " p. " + fd.poste : "") : ""} />
                    <Champ label="Type de transport" val={fd.typeTransport} />
                    <Champ label="Coût transport" val={fd.coutTransport ? fd.coutTransport + " $" : ""} />
                    <Champ label="Coût / élève (taxes incl.)" val={fd.coutEleve ? fd.coutEleve + " $ × " + fd.nbEleves + " élèves" : ""} />
                    <Champ label="Coût / adulte (taxes incl.)" val={fd.coutAdulte ? fd.coutAdulte + " $ × " + fd.nbAdultes + " adultes" : ""} />
                    <Champ label="Libération par période" val={fd.coutLiberation && fd.nbPeriodes > 0 ? fd.coutLiberation + " $ × " + fd.nbPeriodes + " période(s)" : ""} />
                    <Champ label="Autre montant" val={fd.autreMontant ? fd.autreMontant + " $" : ""} />
                  </div>
                </div>
              );
            })()}
            {request.type === "requisition" && (
              <div>
                <div style={S.grid2}>
                  {["titre","typeService","typeServiceFinal","priorite","description","localConcerne","dateRealisation"].map(k => {
                    const v = request.formData[k];
                    if (!v || String(v).trim() === "") return null;
                    const labels = { titre:"Titre", typeService:"Type de service", typeServiceFinal:"Service", priorite:"Priorité", description:"Description", localConcerne:"Local concerné", dateRealisation:"Date de réalisation souhaitée" };
                    return (
                      <div key={k} style={{ marginBottom: 8, gridColumn: k === "description" ? "1 / -1" : undefined }}>
                        <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{labels[k] || k}</div>
                        <div style={{ fontSize: 14, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>{String(v)}</div>
                      </div>
                    );
                  })}
                </div>
                {request.formData.drawing && request.formData.drawing.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: COLORS.vertFonce }}>Schéma / Plan joint à la demande</h4>
                    <div style={{ border: "2px solid #d1d5db", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                      <svg width="100%" viewBox="0 0 760 440" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                        {request.formData.drawing.map((s, i) => {
                          if (s.type === "rect") return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill="none" stroke={s.color || "#1a1a2e"} strokeWidth={2} />;
                          if (s.type === "ellipse") return <ellipse key={i} cx={s.x + s.w/2} cy={s.y + s.h/2} rx={Math.abs(s.w/2)} ry={Math.abs(s.h/2)} fill="none" stroke={s.color || "#1a1a2e"} strokeWidth={2} />;
                          if (s.type === "arrow") return <line key={i} x1={s.x} y1={s.y} x2={s.x2} y2={s.y2} stroke={s.color || "#1a1a2e"} strokeWidth={2} markerEnd="url(#ah)" />;
                          if (s.type === "text") return <text key={i} x={s.x} y={s.y} fill={s.color || "#1a1a2e"} fontSize={s.fontSize || 16} fontWeight={s.bold ? "bold" : "normal"} fontStyle={s.italic ? "italic" : "normal"} textDecoration={s.underline ? "underline" : "none"}>{s.text}</text>;
                          return null;
                        })}
                        <defs><marker id="ah" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#1a1a2e" /></marker></defs>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
        {/* Historique — après les Détails */}
        {request.history && request.history.length > 0 && (
          <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
            <h3 style={S.sectionTitle}>Historique</h3>
            <div style={{ marginBottom: 8 }}>
              {request.history.map((h, i) => (
                <div key={i} style={{ padding: "8px 12px", borderLeft: `3px solid ${STATUSES[h.status]?.color || COLORS.gris}`, marginBottom: 8, background: "#f9fafb", borderRadius: "0 4px 4px 0" }}>
                  <strong style={{ fontSize: 13 }}>{STATUSES[h.status]?.label}</strong>
                  <span style={{ fontSize: 12, color: COLORS.gris, marginLeft: 8 }}>par {h.by} · {h.date}</span>
                  {h.comment && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#333" }}>{h.comment}</p>}
                  {h.adminComment && user.roles.some(r => ["A","B","C1","C2","C3","D"].includes(r)) && (
                    <div style={{ marginTop: 6, padding: "6px 10px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 4, fontSize: 12, color: "#1e40af" }}>
                      <strong>Note administrative :</strong> {h.adminComment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panneau d'actions */}
        {!isTerminated && (
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 20, marginTop: 4 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Actions</h3>

            {/* Commentaires : standard (tous) + administratif (rôles) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
              <div>
                <label style={S.label}>Commentaire (optionnel)</label>
                <textarea style={S.textarea} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire..." rows={3} />
              </div>
              {(canApprove || canVerify || canSecretary || canMagasinier || canConcierge || isAdmin) && (
                <div>
                  <label style={{ ...S.label, color: COLORS.bleu }}>Commentaire administratif (optionnel)</label>
                  <textarea style={{ ...S.textarea, borderColor: "#93c5fd", background: "#eff6ff" }} value={adminComment} onChange={(e) => setAdminComment(e.target.value)} placeholder="Note interne visible uniquement par les rôles administratifs..." rows={3} />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

              {/* ── Approbateur (A) — achat et activité ── */}
              {canApprove && (
                <>
                  <button style={btnVert} onClick={() => onAction(request.id, "acceptee", comment, user, adminComment)}>Accepter</button>
                  <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                </>
              )}

              {/* ── Vérificateur (B) ── */}
              {canVerify && !canApprove && (
                <>
                  {request.type === "requisition" ? (
                    <>
                      <button style={btnVert} onClick={() => onAction(request.id, "validee_C3", comment, user, adminComment)}>Attribuer au Concierge</button>
                      <button style={{ ...btnVert, background: "#0891b2", borderColor: "#0891b2" }} onClick={() => onAction(request.id, "validee_C2", comment, user, adminComment)}>Attribuer au Magasinier</button>
                      <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                    </>
                  ) : (
                    <>
                      <button style={btnVert} onClick={() => onAction(request.id, "validee", comment, user, adminComment)}>Vérifier</button>
                      <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                    </>
                  )}
                </>
              )}

              {/* ── Secrétaire (C1) — achat et activité ── */}
              {canSecretary && (
                <>
                  {canMarkCommande && request.type === "achat" && (
                    <button style={btnOrange} onClick={() => onAction(request.id, "commandee", comment, user, adminComment)}>
                      Marquer items en commande
                    </button>
                  )}
                  {request.type === "achat" && request.formData?._rows && (() => {
                    const rows = request.formData._rows;
                    const tousRecus = rows.length > 0 && rows.every(r => r.recu);
                    const certainsRecus = rows.some(r => r.recu) && !tousRecus;
                    return (
                      <>
                        {tousRecus && (
                          <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment)}>
                            Confirmer réception complète et compléter
                          </button>
                        )}
                        {certainsRecus && (
                          <button style={btnOrange} onClick={() => {
                            if (window.confirm("Confirmer la réception partielle ?\\n\\nLa demande restera dans la file d'attente.")) {
                              if (onUpdateItems) onUpdateItems(request.id, rows);
                            }
                          }}>
                            Confirmer réception partielle
                          </button>
                        )}
                        {!tousRecus && !certainsRecus && (
                          <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment)}>
                            Marquer comme complétée
                          </button>
                        )}
                      </>
                    );
                  })()}
                  {request.type === "activite" && (
                    <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment)}>
                      Marquer comme complétée
                    </button>
                  )}
                  <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                </>
              )}

              {/* ── Magasinier (C2) — achat validée ou en commande ── */}
              {canMagasinier && !canSecretary && (() => {
                const rows = request.formData?._rows || [];
                const tousRecus = rows.length > 0 && rows.every(r => r.recu);
                const certainsRecus = rows.some(r => r.recu) && !tousRecus;
                return (
                  <>
                    {tousRecus ? (
                      <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment)}>
                        Confirmer réception complète et compléter
                      </button>
                    ) : certainsRecus ? (
                      <button style={btnOrange} onClick={() => {
                        if (window.confirm("Confirmer la réception partielle ?\\n\\nLa demande restera dans la file d'attente.")) {
                          if (onUpdateItems) onUpdateItems(request.id, rows);
                        }
                      }}>
                        Confirmer réception partielle
                      </button>
                    ) : (
                      <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment)}>
                        Confirmer réception et compléter
                      </button>
                    )}
                    <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                  </>
                );
              })()}

              {/* ── Concierge (C3) — réquisition interne ── */}
              {canConcierge && (
                <>
                  <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment)}>
                    Marquer comme complétée
                  </button>
                  <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                </>
              )}

              {/* ── Séparateur ── */}
              {(canApproverEdit || canEdit) && (canApprove || canVerify || canSecretary || canMagasinier || canConcierge) && (
                <span style={{ width: 1, height: 32, background: "#e5e7eb", display: "inline-block", margin: "0 4px" }} />
              )}

              {/* ── Modifier la demande (un seul bouton, logique unifiée) ── */}
              {(canApproverEdit || (canEdit && !canApproverEdit)) && (
                <button style={btnJaune} onClick={() => onEdit(request, null, "")}>
                  Modifier la demande
                </button>
              )}

              {/* ── Modifier par l'auteur (seulement si soumise) ── */}
              {canAuthorEdit && !canApproverEdit && !canEdit && (
                <button style={btnVert2} onClick={() => onEdit(request, null, "auteur")}>
                  Modifier ma demande
                </button>
              )}

              {/* ── Auteur bloqué car demande approuvée — message de contact ── */}
              {authorBlockedByApproval && !canEdit && (
                <div style={{ padding: "10px 14px", background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: 6, fontSize: 13, color: "#7a5800", maxWidth: 420 }}>
                  ⚠ Votre demande a été approuvée. Pour la modifier, veuillez contacter
                  {approverName ? <strong> {approverName}</strong> : " l'approbateur"} qui a validé votre demande.
                </div>
              )}

              {/* ── Approbateur bloqué car demande vérifiée — message de contact ── */}
              {approverBlockedByVerif && (
                <div style={{ padding: "10px 14px", background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: 6, fontSize: 13, color: "#7a5800", maxWidth: 420 }}>
                  ⚠ Cette demande a été vérifiée. Pour la modifier, veuillez contacter
                  {verifierName ? <strong> {verifierName}</strong> : " le vérificateur"} qui a traité cette demande.
                </div>
              )}

              {/* ── Annulation par l'auteur ── */}
              {canCancel && (
                <button style={btnRouge} onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir annuler cette demande ? L'approbateur sera avisé.")) {
                    onCancel(request.id, user);
                  }
                }}>
                  Annuler la demande
                </button>
              )}

            </div>
          </div>
        )}

    </div>
  );
}


// ─── Queue Views (A/B/C) ──────────────────────────────────────────────────────
function QueueView({ role, label, requests, allRequests, user, onAction, onBack, setSelectedRequest, setView, onSetPrevView }) {
  const filtered = requests; // demandes en attente (pré-filtrées)
  const actionMap = { A: "acceptee", B: "validee", C1: "traitee", C2: "traitee", C3: "traitee" };
  const roleLabels = { A: "Approuver", B: "Vérifier", C1: "Traiter", C2: "Traiter", C3: "Traiter" };
  const roleDisplay = label || (role === "A" ? "Approbateur" : role === "B" ? "Vérificateur" : role === "C1" ? "Secrétaire" : role === "C2" ? "Magasinier" : role === "C3" ? "Concierge" : role);

  // Demandes traitées : celles où l'utilisateur a agi (dans l'historique)
  const traitees = allRequests ? allRequests.filter(r =>
    r.history && r.history.some(h => h.by === user.name) &&
    !filtered.some(f => f.id === r.id) // pas dans la file d'attente
  ) : [];

  const [showTraitees, setShowTraitees] = useState(false);

  return (
    <div style={S.content}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button style={S.btn} onClick={onBack}>← Retour</button>
        {(role === "A" || role === "B") && (
          <button onClick={() => {
            var CATS = { achat: "Demande d'achat de matériel", activite: "Demande d'activité et de sortie", requisition: "Demande de réquisition interne" };
            var STATUTS = { soumise:"Soumise", acceptee:"Approuvée", validee:"Vérifiée", validee_C2:"Attribuée — Magasinier", validee_C3:"Attribuée — Concierge", commandee:"En commande", traitee:"Traitée", refusee:"Refusée", annulee:"Annulée" };
            var headers = ["Numéro", "Catégorie", "Titre", "Demandeur", "Statut", "Prix total", "Mon action", "Date action"];
            var allRows = filtered.concat(traitees);
            var rows = allRows.map(function(r) {
              var monAction = r.history ? [...r.history].reverse().find(function(h) { return h.by === user.name; }) : null;
              return [
                r.requestNumber || r.id,
                CATS[r.type] || r.type, r.title, r.authorName,
                STATUTS[r.status] || r.status,
                (r.formData && r.formData.total) ? r.formData.total : (r.type === "requisition" ? "N/A" : "—"),
                monAction ? (STATUTS[monAction.status] || monAction.status) : "En attente",
                monAction ? monAction.date : "",
              ];
            });
            var esc = function(v) { var s = String(v == null ? "" : v); return (s.includes(";") || s.includes('"') || s.includes("\n")) ? '"' + s.replace(/"/g, '""') + '"' : s; };
            var csv = ["sep=;", headers.join(";")].concat(rows.map(function(r) { return r.map(esc).join(";"); })).join("\n");
            var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a"); a.href = url;
            a.download = "DLC_" + roleDisplay + "_" + new Date().toISOString().slice(0,10) + ".csv";
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
          }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            Exporter vers Excel ({filtered.length + traitees.length})
          </button>
        )}
      </div>
      <div style={S.card}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
          File d'attente — {roleDisplay}
        </h2>
        <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 20 }}>
          {filtered.length} demande(s) en attente
        </p>
        {filtered.length === 0 ? (
          <p style={{ color: COLORS.gris }}>Aucune demande en attente.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {["#", "Type", "Titre", "Demandeur", "Date", "Actions"].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={S.td}>{r.id}</td>
                  <td style={S.td}><span style={{ fontSize: 12 }}>{REQUEST_TYPES[r.type]}</span></td>
                  <td style={S.td}>
                    <strong>{r.title}</strong>
                    {r.type === "requisition" && r.formData?.drawing?.length > 0 && (
                      <span title="Schéma joint à la demande" style={{ marginLeft: 6, fontSize: 12, background: "#e0f2fe", color: "#0369a1", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>📐 Schéma</span>
                    )}
                  </td>
                  <td style={S.td}>{r.authorName}</td>
                  <td style={S.td}>{r.date}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ ...S.btn, padding: "4px 10px", fontSize: 12 }} onClick={() => {
                        setSelectedRequest(r);
                        if (onSetPrevView) onSetPrevView();
                        setTimeout(() => setView("detail"), 0);
                      }}>
                        Voir
                      </button>
                      <button style={{ ...S.btnPrimary, padding: "4px 10px", fontSize: 12 }} onClick={() => onAction(r.id, actionMap[role], "", user)}>
                        {roleLabels[role]}
                      </button>
                      <button style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 12 }} onClick={() => onAction(r.id, "refusee", "", user)}>
                        Refuser
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {/* ── Demandes traitées ── */}
      {traitees.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setShowTraitees(v => !v)}
            style={{ ...S.btn, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            {showTraitees ? "▼" : "▶"} Demandes traitées
            <span style={{ background: "#e5e7eb", color: "#6b7280", borderRadius: 12, padding: "2px 8px", fontSize: 12, fontWeight: 900 }}>{traitees.length}</span>
          </button>
          {showTraitees && (
            <table style={S.table}>
              <thead>
                <tr>{["Nº","Type","Titre","Demandeur","Statut","Date action",""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {traitees.map((r, i) => {
                  const monAction = [...(r.history||[])].reverse().find(h => h.by === user.name);
                  const st = STATUSES[r.status] || { label: r.status, color: "#6b7280" };
                  return (
                    <tr key={r.id} style={{ background: i%2===0?"#fff":"#fafafa" }}>
                      <td style={{ ...S.td, fontFamily:"monospace", fontSize:12 }}>{r.requestNumber||r.id}</td>
                      <td style={S.td}><span style={{fontSize:12}}>{REQUEST_TYPES[r.type]}</span></td>
                      <td style={S.td}><strong>{r.title}</strong></td>
                      <td style={S.td}>{r.authorName}</td>
                      <td style={S.td}><span style={S.badge(st.color)}>{st.label}</span></td>
                      <td style={S.td}>{monAction ? monAction.date : ""}</td>
                      <td style={S.td}>
                        <button style={{ ...S.btn, padding:"4px 10px", fontSize:12 }} onClick={() => {
                          setSelectedRequest(r);
                          if (onSetPrevView) onSetPrevView();
                          setTimeout(() => setView("detail"), 0);
                        }}>Voir</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      </div>
    </div>
  );
}

// ─── Admin View (role D) ──────────────────────────────────────────────────────
function AdminView({ onBack, allUsers, onUpdateRoles, serviceTypes, onUpdateServiceTypes, activeForms, onUpdateActiveForms }) {
  const [activeTab, setActiveTab] = useState("droits");
  const [users, setUsers] = useState(allUsers.map((u) => ({ ...u })));
  const [newServiceType, setNewServiceType] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  function toggleRole(userId, role) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, roles: u.roles.includes(role) ? u.roles.filter((r) => r !== role) : [...u.roles, role] }
          : u
      )
    );
  }

  function save() {
    onUpdateRoles(users);
    setSavedMsg("✓ Modifications enregistrées");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  const TABS = [
    { id: "droits",      label: "Gestion des droits",          icon: "👥" },
    { id: "achat",       label: "Formulaire — Achat matériel", icon: "🛒" },
    { id: "activite",    label: "Formulaire — Activités/Sorties", icon: "🎒" },
    { id: "requisition", label: "Formulaire — Réquisition interne", icon: "🔧" },
  ];

  const tabBtn = (id) => ({
    padding: "10px 18px", fontSize: 13, borderRadius: "8px 8px 0 0", cursor: "pointer",
    fontWeight: activeTab === id ? 700 : 500,
    background: activeTab === id ? "#fff" : "#f0f2f5",
    color: activeTab === id ? COLORS.bleu : COLORS.gris,
    border: "1px solid #d9dee5",
    borderBottom: activeTab === id ? "1px solid #fff" : "1px solid #d9dee5",
    marginRight: 4, marginBottom: -1, position: "relative", zIndex: activeTab === id ? 2 : 1,
    transition: "all .12s",
  });

  const sectionTitle = (txt, sub) => (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: COLORS.bleu }}>{txt}</h3>
      {sub && <p style={{ margin: 0, color: COLORS.gris, fontSize: 13 }}>{sub}</p>}
    </div>
  );

  return (
    <div style={S.content}>
      <button style={{ ...S.btn, marginBottom: 16 }} onClick={onBack}>← Retour</button>

      {/* En-tête */}
      <div style={{ background: COLORS.bleu, borderRadius: "12px 12px 0 0", padding: "20px 28px", marginBottom: 0 }}>
        <h2 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 700 }}>⚙️ Administration</h2>
        <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
          Paramètres du système DLC — École de la Croisée / CSS Laval
        </p>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", flexWrap: "wrap", padding: "0 12px", background: "#f0f2f5", borderLeft: "1px solid #d9dee5", borderRight: "1px solid #d9dee5" }}>
        {TABS.map(t => (
          <button key={t.id} style={tabBtn(t.id)} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div style={{ background: "#fff", border: "1px solid #d9dee5", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "28px 32px" }}>

        {/* ── Onglet : Gestion des droits ── */}
        {activeTab === "droits" && (
          <div>
            {sectionTitle("Gestion des droits des utilisateurs", "Attribuez les rôles à chaque membre du personnel. Un utilisateur peut avoir plusieurs rôles simultanément.")}

            {/* Légende des rôles — 3 colonnes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { role: "A",  label: "Approbateur",    desc: "Approuve les demandes d'achat et d'activité",   color: "#0284c7" },
                { role: "B",  label: "Vérificateur",   desc: "Vérifie toutes les demandes approuvées",        color: "#7c3aed" },
                { role: "C1", label: "Secrétaire",     desc: "Traite les achats et activités vérifiés",       color: "#ea580c" },
                { role: "C2", label: "Magasinier",     desc: "Reçoit et complète les commandes d'achat",      color: "#0891b2" },
                { role: "C3", label: "Concierge",      desc: "Traite les réquisitions internes vérifiées",    color: "#059669" },
                { role: "D",  label: "Administrateur", desc: "Accès complet au système",                      color: "#dc2626" },
              ].map(r => (
                <div key={r.role} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${r.color}33`, background: r.color + "08", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontWeight: 900, fontSize: 18, color: r.color, minWidth: 28, marginTop: 1 }}>{r.role}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: r.color }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: COLORS.gris, marginTop: 2 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Ajouter un utilisateur ── */}
            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>➕ Ajouter un utilisateur</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end", marginBottom: 28, padding: "16px 18px", background: "#f6f7f9", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div>
                <label style={S.label}>Nom complet <span style={{ color: COLORS.rouge }}>*</span></label>
                <input id="new-user-name" style={S.input} placeholder="Ex : Julie Tremblay" onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
              </div>
              <div>
                <label style={S.label}>Identifiant courriel <span style={{ color: COLORS.rouge }}>*</span></label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #bfc7d1", borderRadius: 6, overflow: "hidden" }}>
                  <input id="new-user-email" style={{ ...S.input, border: "none", flex: 1 }} placeholder="prenom.nom" onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
                  <span style={{ padding: "0 8px", background: "#f3f4f6", fontSize: 11, color: COLORS.gris, whiteSpace: "nowrap", borderLeft: "1px solid #bfc7d1", lineHeight: "38px" }}>@csslaval.gouv.qc.ca</span>
                </div>
              </div>
              <div>
                <label style={S.label}>Mot de passe temporaire <span style={{ color: COLORS.rouge }}>*</span></label>
                <input id="new-user-password" style={S.input} placeholder="Ex : Bienvenue2026!" type="text" onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
              </div>
              <button type="button" style={{ ...S.btnPrimary, height: 40, whiteSpace: "nowrap" }} onClick={() => {
                const name  = document.getElementById("new-user-name").value.trim();
                const email = document.getElementById("new-user-email").value.trim();
                const pwd   = document.getElementById("new-user-password").value.trim();
                if (!name || !email || !pwd) { alert("Veuillez remplir les 3 champs pour ajouter un utilisateur."); return; }
                if (users.find(u => u.email === email)) { alert("Un utilisateur avec cet identifiant existe déjà."); return; }
                const newUser = { id: Date.now(), name, email, password: pwd, roles: [] };
                setUsers(prev => [...prev, newUser]);
                document.getElementById("new-user-name").value = "";
                document.getElementById("new-user-email").value = "";
                document.getElementById("new-user-password").value = "";
                setSavedMsg("✓ Utilisateur ajouté — cliquez sur Enregistrer pour confirmer");
                setTimeout(() => setSavedMsg(""), 5000);
              }}>+ Ajouter</button>
            </div>

            {/* ── Tableau des utilisateurs ── */}
            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>
              Utilisateurs du système ({users.length})
            </h4>
            <div style={{ overflowX: "auto", marginBottom: 18 }}>
              <table style={{ ...S.table, minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={S.th}>Nom</th>
                    <th style={S.th}>Courriel</th>
                    {[
                      { role: "A",  label: "Approbateur",    color: "#0284c7" },
                      { role: "B",  label: "Vérificateur",   color: "#7c3aed" },
                      { role: "C1", label: "Secrétaire",     color: "#ea580c" },
                      { role: "C2", label: "Magasinier",     color: "#0891b2" },
                      { role: "C3", label: "Concierge",      color: "#059669" },
                      { role: "D",  label: "Administrateur", color: "#dc2626" },
                    ].map(r => (
                      <th key={r.role} style={{ ...S.th, textAlign: "center", color: r.color, minWidth: 80 }}>
                        <div style={{ fontSize: 10, fontWeight: 900 }}>{r.role}</div>
                        <div style={{ fontSize: 10, fontWeight: 600 }}>{r.label}</div>
                      </th>
                    ))}
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const isAdminUser = u.roles.includes("D");
                    return (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={S.td}>
                          <strong>{u.name}</strong>
                          {isAdminUser && <span style={{ marginLeft: 6, fontSize: 10, background: "#dc262618", color: "#dc2626", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>ADMIN</span>}
                        </td>
                        <td style={{ ...S.td, fontSize: 12, color: COLORS.gris }}>{u.email}@csslaval.gouv.qc.ca</td>
                        {["A", "B", "C1", "C2", "C3", "D"].map((role) => (
                          <td key={role} style={{ ...S.td, textAlign: "center" }}>
                            <input type="checkbox" checked={u.roles.includes(role)} onChange={() => toggleRole(u.id, role)}
                              style={{ width: 16, height: 16, cursor: "pointer" }} />
                          </td>
                        ))}
                        <td style={{ ...S.td, textAlign: "center" }}>
                          <button type="button"
                            title="Retirer cet utilisateur"
                            style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 5, color: COLORS.rouge, cursor: "pointer", fontSize: 13, padding: "3px 8px", fontWeight: 700 }}
                            onClick={() => {
                              if (u.roles.includes("D") && users.filter(x => x.roles.includes("D")).length === 1) {
                                alert("Impossible de retirer le dernier administrateur du système.");
                                return;
                              }
                              if (window.confirm(`Retirer ${u.name} du système ?

Cette action est immédiate. Cliquez sur « Enregistrer » pour confirmer.`)) {
                                setUsers(prev => prev.filter(x => x.id !== u.id));
                                setSavedMsg("✓ Utilisateur retiré — cliquez sur Enregistrer pour confirmer");
                                setTimeout(() => setSavedMsg(""), 5000);
                              }
                            }}>
                            🗑 Retirer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button style={S.btnPrimary} onClick={save}>Enregistrer les modifications</button>
              {savedMsg && <span style={{ color: savedMsg.includes("retiré") ? COLORS.rouge : COLORS.vert, fontSize: 13, fontWeight: 600 }}>{savedMsg}</span>}
            </div>
            <p style={{ fontSize: 12, color: COLORS.gris, marginTop: 8 }}>
              ℹ️ Les ajouts et retraits sont temporaires jusqu'à ce que vous cliquiez sur « Enregistrer les modifications ».
            </p>
          </div>
        )}

        {/* ── Onglet : Formulaires actifs / inactifs ── */}
        {activeTab === "formulaires" && (
          <div>
            {sectionTitle("Activation des formulaires de demandes", "L'administrateur peut activer ou désactiver chaque type de formulaire. Un formulaire désactivé ne peut plus être soumis par les utilisateurs.")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 8 }}>
              {[
                { key: "achat",      label: "Demande d'achat de matériel",          color: "#0284c7", icon: "🛒" },
                { key: "activite",   label: "Demande d'activité et de sortie",       color: "#7c3aed", icon: "🎒" },
                { key: "requisition",label: "Demande de réquisition interne",        color: "#059669", icon: "🔧" },
              ].map(f => {
                const isActive = activeForms ? activeForms[f.key] !== false : true;
                return (
                  <div key={f.key} style={{ padding: "20px 24px", borderRadius: 10, border: `2px solid ${isActive ? f.color : "#e5e7eb"}`, background: isActive ? f.color + "08" : "#f9fafb", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: isActive ? f.color : "#9ca3af", marginBottom: 6 }}>{f.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        <div style={{ position: "relative", width: 44, height: 24 }}
                          onClick={() => { if (onUpdateActiveForms) onUpdateActiveForms(function(prev) { var next = Object.assign({}, prev); next[f.key] = !isActive; return next; }); }}>
                          <div style={{ width: 44, height: 24, borderRadius: 12, background: isActive ? f.color : "#d1d5db", transition: "background 0.2s", cursor: "pointer" }} />
                          <div style={{ position: "absolute", top: 3, left: isActive ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                        </div>
                        <span style={{ color: isActive ? f.color : "#9ca3af" }}>{isActive ? "Actif" : "Inactif"}</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Onglet : Formulaire Achat ── */}
        {activeTab === "achat" && (
          <div>
            {sectionTitle("Modification du formulaire « Demande d'achat de matériel »", "Paramétrez les options disponibles dans ce formulaire.")}

            <div style={{ padding: "16px 20px", background: "#f6f7f9", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <label style={{ ...S.label, margin: 0, minWidth: 280, fontWeight: 600 }}>Coût d'une libération par période ($)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" step="0.01" min="0" style={{ ...S.input, width: 120 }} defaultValue={COUT_LIBERATION_DEFAULT} id="cout-liberation-input" />
                  <button type="button" style={S.btnPrimary} onClick={() => {
                    const val = document.getElementById("cout-liberation-input").value;
                    if (val && !isNaN(parseFloat(val))) { COUT_LIBERATION_DEFAULT = val; alert("Coût de libération mis à jour : " + val + " $"); }
                  }}>Mettre à jour</button>
                </div>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: COLORS.gris }}>
                Ce montant est utilisé dans le calcul des coûts de la demande d'achat de matériel (libération d'un enseignant pour aller acheter).
              </p>
            </div>

            <div style={{ padding: "16px 20px", background: "#fff8e1", borderRadius: 8, border: "1px solid #ffe082", fontSize: 13, color: "#7a5800" }}>
              ℹ️ D'autres paramètres de personnalisation du formulaire (listes de matières, niveaux, fournisseurs, etc.) seront disponibles dans une prochaine version.
            </div>
          </div>
        )}

        {/* ── Onglet : Formulaire Activités ── */}
        {activeTab === "activite" && (
          <div>
            {sectionTitle("Modification du formulaire « Demande d'activité et de sortie »", "Paramétrez les options disponibles dans ce formulaire.")}
            <div style={{ padding: "16px 20px", background: "#fff8e1", borderRadius: 8, border: "1px solid #ffe082", fontSize: 13, color: "#7a5800" }}>
              ℹ️ Les paramètres de personnalisation du formulaire d'activités (types d'activités, niveaux, transport, etc.) seront disponibles dans une prochaine version.
            </div>
          </div>
        )}

        {/* ── Onglet : Formulaire Réquisition ── */}
        {activeTab === "requisition" && (
          <div>
            {sectionTitle("Modification du formulaire « Demande de réquisition interne »", "Gérez les types de service disponibles dans ce formulaire.")}

            <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>Types de service disponibles</h4>
            <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 14 }}>
              Ces types apparaissent dans le menu déroulant du formulaire. "Autres (précisez)" est toujours conservé en dernier.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {serviceTypes.map((st, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.fond, border: "1px solid #d9dee5", borderRadius: 20, padding: "5px 14px 5px 16px", fontSize: 13 }}>
                  <span>{st}</span>
                  {st !== "Autres (précisez)" && (
                    <button type="button"
                      style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.rouge, fontWeight: 700, fontSize: 15, padding: "0 2px", lineHeight: 1 }}
                      onClick={() => onUpdateServiceTypes(serviceTypes.filter((_, j) => j !== i))}
                      title="Retirer ce type">✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input
                style={{ ...S.input, maxWidth: 320 }}
                placeholder="Nouveau type de service…"
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              />
              <button type="button" style={S.btnPrimary} onClick={() => {
                const t = newServiceType.trim();
                if (t && !serviceTypes.includes(t)) {
                  onUpdateServiceTypes([...serviceTypes.filter(s => s !== "Autres (précisez)"), t, "Autres (précisez)"]);
                  setNewServiceType("");
                }
              }}>+ Ajouter</button>
            </div>
            <p style={{ fontSize: 12, color: COLORS.gris }}>
              ℹ️ "Autres (précisez)" est protégé et ne peut pas être retiré.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Champ de formulaire réutilisable ────────────────────────────────────────
function F({ label, required: req, children }) {
  return (
    <div style={S.field}>
      <label style={S.label}>
        {label}{req && <span style={{ color: COLORS.rouge }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Form: Achat de matériel ──────────────────────────────────────────────────
function FormAchat({ user, onSubmit, onBack, allUsers, initialData, editMode, onApprove }) {
  const today = new Date().toISOString().slice(0, 10);
  const fd = initialData || {};

  const TAX = 1.14975; // TPS + TVQ

  const [dateSouhaitee, setDateSouhaitee] = useState(fd.dateSouhaitee || "");
  const [matiere,       setMatiere]       = useState(fd.matiere || "");
  const [matiereArts,   setMatiereArts]   = useState(fd.matiereArts || "");
  const [autreArt,      setAutreArt]      = useState(fd.autreArt || "");
  const [autreMatiere,  setAutreMatiere]  = useState(fd.autreMatiere || "");
  const [niveau,        setNiveau]        = useState(fd.niveau || "");
  const [autreNiveau,   setAutreNiveau]   = useState(fd.autreNiveau || "");
  const [direction,     setDirection]     = useState(fd.directionResponsable || "");
  const [fournisseur,   setFournisseur]   = useState(fd.fournisseurPrincipal || "");
  const [nature,        setNature]        = useState(fd.natureActivite || "");
  const [achatPersonnel,setAchatPersonnel]= useState(fd.achatPersonnel || "");
  const [conferencier,  setConferencier]  = useState(fd.conferencier || "");
  const [parascolaire,  setParascolaire]  = useState(fd.parascolaire || "");
  const [budgetPassion, setBudgetPassion] = useState(fd.budgetPassion || "");

  const initRows = (fd._rows && fd._rows.length > 0)
    ? fd._rows.map(r => ({ ...r }))
    : [{ id: 1, qty: "", nom: "", description: "", numero: "", lien: "", prixUnitaire: "", soustotal: "", sansTaxe: false }];
  const [rows, setRows] = useState(initRows);

  const [erreur, setErreur]   = useState("");
  const [succes, setSucces]   = useState(false);

  const total = rows.reduce((s, r) => s + (parseFloat(r.soustotal) || 0), 0);

  const approb = allUsers.filter(u => u.roles.includes("A") && !u.roles.includes("D"));

  function majSoustotal(idx, newQty, newPrix, newSansTaxe) {
    const q = parseFloat(newQty) || 0;
    const p = parseFloat(newPrix) || 0;
    return (q * p * (newSansTaxe ? 1 : TAX)).toFixed(2);
  }

  function changerRow(idx, champ, val) {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [champ]: val };
      if (champ === "qty" || champ === "prixUnitaire" || champ === "sansTaxe") {
        updated.soustotal = majSoustotal(
          idx,
          champ === "qty" ? val : r.qty,
          champ === "prixUnitaire" ? val : r.prixUnitaire,
          champ === "sansTaxe" ? val : r.sansTaxe
        );
      }
      return updated;
    }));
  }

  function ajouterLigne() {
    setRows(prev => [...prev, { id: Date.now(), qty: "", nom: "", description: "", numero: "", lien: "", prixUnitaire: "", soustotal: "", sansTaxe: false }]);
  }

  function supprimerLigne(idx) {
    setRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }

  function soumettre() {
    // Validation
    if (!dateSouhaitee) { setErreur("Veuillez indiquer la date souhaitée pour le traitement."); return; }
    if (dateSouhaitee < today) { setErreur("La date souhaitée pour le traitement doit être aujourd'hui ou dans le futur."); return; }
    if (!matiere)        { setErreur("Veuillez sélectionner une matière."); return; }
    if (!niveau)         { setErreur("Veuillez sélectionner un niveau."); return; }
    if (!direction)      { setErreur("Veuillez sélectionner la direction responsable."); return; }
    if (!nature.trim())  { setErreur("Veuillez indiquer le titre de la demande."); return; }
    if (!achatPersonnel) { setErreur("Veuillez répondre : achat par moi-même (Oui/Non)."); return; }
    if (!conferencier)   { setErreur("Veuillez répondre : lien avec un conférencier (Oui/Non)."); return; }
    if (!parascolaire)   { setErreur("Veuillez répondre : activité parascolaire (Oui/Non)."); return; }
    if (!budgetPassion)  { setErreur("Veuillez répondre : budget passion (Oui/Non)."); return; }

    // Au moins un article valide
    var articleValide = false;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var n = r.nom && r.nom.trim() !== "";
      var q = r.qty && parseFloat(r.qty) > 0;
      var p = r.prixUnitaire && parseFloat(r.prixUnitaire) > 0;
      if (n || q || p) {
        if (!n || !q || !p) {
          setErreur("Article " + (i + 1) + " incomplet : quantité, nom et prix sont requis.");
          return;
        }
        articleValide = true;
      }
    }
    if (!articleValide) {
      setErreur("Ajoutez au moins un article avec quantité, nom et prix unitaire.");
      return;
    }

    setErreur("");

    var formData = {
      demandePar: user.name,
      courriel: user.email,
      dateDemande: fd.dateDemande || today,
      dateSouhaitee, matiere, matiereArts, autreArt, autreMatiere,
      niveau, autreNiveau,
      directionResponsable: direction,
      fournisseurPrincipal: fournisseur,
      natureActivite: nature,
      achatPersonnel, conferencier, parascolaire, budgetPassion,
      total: total.toFixed(2) + " $",
      _rows: rows,
      _totalNum: total,
    };

    if (editMode) {
      onSubmit(formData);
    } else {
      onSubmit({
        type: "achat",
        title: (nature || "Demande d'achat").slice(0, 60),
        formData: formData,
      });
      setSucces(true);
    }
  }

  // ── Page de succès ──────────────────────────────────────────────────────────
  if (succes) {
    return (
      <div style={S.content}>
        <div style={{ ...S.card, textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: "0 0 8px" }}>Demande soumise avec succès!</h2>
          <p style={{ color: COLORS.gris, marginBottom: 24 }}>
            Votre demande a été transmise à l'approbateur et est en attente d'approbation.
          </p>
          <button style={S.btnPrimary} onClick={onBack}>Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────────────────────
  return (
    <div style={S.content}>
      <button style={{ ...S.btn, marginBottom: 20 }} onClick={onBack}>← Retour</button>

      {/* Zone imprimable */}
      <div id="print-zone" style={S.card}>
        <div style={{ background: editMode ? "#23b090" : COLORS.bleu, margin: "-28px -32px 24px", padding: "20px 32px" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>
            {editMode ? "Modifier la demande d'achat" : "Demande d'achat de matériel"}
          </h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            {editMode ? "Modifiez les champs souhaités, puis cliquez sur Enregistrer" : "Complétez tous les champs obligatoires (*)"}
          </p>
        </div>

        <h3 style={S.sectionTitle}>Informations générales</h3>

        {/* ── Ligne 1 : Demandeur / Courriel / Date de la demande ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 18px", marginBottom: 14 }}>
          <F label="Demandeur / Demandeuse">
            <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={user.name} readOnly />
          </F>
          <F label="Courriel du demandeur / demandeuse">
            <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={user.email + "@csslaval.gouv.qc.ca"} readOnly />
          </F>
          <F label="Date de la demande">
            <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={fd.dateDemande || today} readOnly />
          </F>
        </div>

        {/* ── Ligne 2 : Titre de la demande / Date souhaitée ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px", marginBottom: 14 }}>
          <F label="Titre de la demande" required>
            <input style={S.input} placeholder="Ex : Matériel pour le projet de sciences" value={nature} onChange={e => setNature(e.target.value)} />
          </F>
          <F label="Date souhaitée pour le traitement de la demande" required>
            <input type="date" style={{ ...S.input, borderColor: dateSouhaitee && dateSouhaitee < today ? COLORS.rouge : undefined }} min={today} value={dateSouhaitee} onChange={e => setDateSouhaitee(e.target.value)} />
            {dateSouhaitee && dateSouhaitee < today && (
              <div style={{ color: COLORS.rouge, fontSize: 12, marginTop: 4 }}>⚠ La date doit être aujourd'hui ou dans le futur.</div>
            )}
          </F>
        </div>

        <div style={S.grid2}>
          <F label="Matière" required>
            <select style={S.select} value={matiere} onChange={e => setMatiere(e.target.value)}>
              <option value="">Sélectionnez</option>
              {["Accueil","Adaptation scolaire","Anglais","Arts","Culture et citoyenneté québécoise (CCQ)","Éducation physique","Français","Mathématiques","Science","Univers social / Histoire","Non applicable","Autre"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {matiere === "Arts" && (
              <div style={{ marginTop: 8 }}>
                <select style={S.select} value={matiereArts} onChange={e => setMatiereArts(e.target.value)}>
                  <option value="">Catégorie arts</option>
                  {["Plastique","Danse","Musique","Dramatique","Autre"].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {matiereArts === "Autre" && (
                  <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez l'art" value={autreArt} onChange={e => setAutreArt(e.target.value)} />
                )}
              </div>
            )}
            {matiere === "Autre" && (
              <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez la matière" value={autreMatiere} onChange={e => setAutreMatiere(e.target.value)} />
            )}
          </F>
          <F label="Niveau" required>
            <select style={S.select} value={niveau} onChange={e => setNiveau(e.target.value)}>
              <option value="">Sélectionnez</option>
              {["Accueil","Année transitoire (AT)","EMS","Pré-DÉP","S1","S2","S3","S4","S5","Soutien à l'apprentissage (SA)","Soutien à l'autonomie et la socialisation (SAS)","Autre","Non applicable"].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {niveau === "Autre" && (
              <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez le niveau" value={autreNiveau} onChange={e => setAutreNiveau(e.target.value)} />
            )}
          </F>
          <F label="Direction responsable" required>
            <select style={S.select} value={direction} onChange={e => setDirection(e.target.value)}>
              <option value="">Sélectionnez</option>
              {approb.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </F>
          <F label="Fournisseur principal">
            <input style={S.input} value={fournisseur} onChange={e => setFournisseur(e.target.value)} />
          </F>
        </div>



        {/* Questions Oui/Non */}
        <div style={{ ...S.grid2, marginTop: 16, gap: "12px 22px" }}>
          {[
            { label: "Demande que j'irai acheter par moi-même", val: achatPersonnel, set: setAchatPersonnel,
              warning: "À noter que vous devez attendre la confirmation avant de procéder à l'achat du matériel. Si vous achetez le tout avant, il se peut qu'il soit impossible de procéder à votre remboursement." },
            { label: "Demande en lien avec un conférencier ou une conférencière", val: conferencier, set: setConferencier,
              warning: "Dans un minimum de trois semaines avant la conférence, il est important que le conférencier ou la conférencière remplisse le formulaire « Déclaration relative aux antécédents judiciaires ». Pour plus d'informations, merci de communiquer avec la secrétaire de l'école." },
            { label: "Demande en lien avec une activité parascolaire", val: parascolaire, set: setParascolaire },
            { label: "Demande en lien avec le budget passion", val: budgetPassion, set: setBudgetPassion },
          ].map(({ label, val, set, warning }) => (
            <div key={label} style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <label style={{ ...S.label, margin: "0 0 8px", flex: 1 }}>{label} <span style={{ color: COLORS.rouge }}>*</span></label>
              <div style={{ display: "flex", gap: 20 }}>
                {["Oui", "Non"].map(v => (
                  <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                    <input type="radio" name={label} value={v} checked={val === v} onChange={() => set(v)} />
                    {v}
                  </label>
                ))}
              </div>
              {val === "Oui" && warning && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, color: "#7a5800", fontSize: 13, lineHeight: 1.5 }}>
                  ⚠️ {warning}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tableau articles */}
        <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>Détails de la demande</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["#","Qté","Nom du produit","Description","N° produit","Lien Web","Prix unitaire","Sans taxes","Sous-total",""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f5faf7" }}>
                  <td style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                  <td style={S.td}>
                    <input type="number" min="0" step="1" style={{ ...S.input, padding: "4px 6px", fontSize: 12, width: 60 }} value={row.qty} onChange={e => changerRow(idx, "qty", e.target.value)} />
                  </td>
                  <td style={S.td}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, minWidth: 100 }} value={row.nom} onChange={e => changerRow(idx, "nom", e.target.value)} />
                  </td>
                  <td style={S.td}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, minWidth: 110 }} value={row.description} onChange={e => changerRow(idx, "description", e.target.value)} />
                  </td>
                  <td style={S.td}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, width: 80 }} value={row.numero} onChange={e => changerRow(idx, "numero", e.target.value)} />
                  </td>
                  <td style={S.td}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, minWidth: 90 }} placeholder="https://..." value={row.lien} onChange={e => changerRow(idx, "lien", e.target.value)} />
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <input type="number" min="0" step="0.01" style={{ ...S.input, padding: "4px 6px", fontSize: 12, width: 80 }} value={row.prixUnitaire} onChange={e => changerRow(idx, "prixUnitaire", e.target.value)} />
                      <span style={{ fontSize: 12, color: COLORS.gris }}>$</span>
                    </div>
                  </td>
                  <td style={{ ...S.td, textAlign: "center" }}>
                    <input type="checkbox" checked={!!row.sansTaxe} onChange={e => changerRow(idx, "sansTaxe", e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, width: 80, background: "#f0f8f4" }} value={row.soustotal} readOnly />
                      <span style={{ fontSize: 12, color: COLORS.gris }}>$</span>
                    </div>
                  </td>
                  <td style={S.td}>
                    <button type="button" style={{ ...S.btnDanger, padding: "4px 8px", fontSize: 12 }} onClick={() => supprimerLigne(idx)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8} style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>Total de la commande</td>
                <td style={{ ...S.td, fontWeight: 700 }}>{total.toFixed(2)} $</td>
                <td style={S.td} />
              </tr>
            </tfoot>
          </table>
        </div>
        <button type="button" style={{ ...S.btn, marginTop: 10 }} onClick={ajouterLigne}>+ Ajouter une ligne</button>
      </div>
      {/* ── Fin zone imprimable ── */}

      {/* Erreur + boutons HORS du print-zone */}
      {erreur && <div style={{ ...S.error, marginTop: 12 }}>{erreur}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button
          type="button"
          style={{ ...S.btnPrimary, background: editMode ? "#23b090" : COLORS.vert }}
          onClick={soumettre}
        >
          {editMode ? "Enregistrer les modifications" : "Envoyer la demande"}
        </button>
        {!editMode && (
          <button type="button"
            style={{ background: "#04043C", color: "#fff", border: "1px solid #04043C", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }}
            onClick={() => printZone()}>
            Imprimer
          </button>
        )}
        {!editMode && (
          <button type="button"
            style={{ background: "#23b090", color: "#fff", border: "1px solid #1a8a70", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }}
            onClick={() => {
              setDateSouhaitee(""); setMatiere(""); setMatiereArts(""); setAutreArt(""); setAutreMatiere("");
              setNiveau(""); setAutreNiveau(""); setDirection(""); setFournisseur(""); setNature("");
              setAchatPersonnel(""); setConferencier(""); setParascolaire(""); setBudgetPassion("");
              setRows([{ id: Date.now(), qty: "", nom: "", description: "", numero: "", lien: "", prixUnitaire: "", soustotal: "", sansTaxe: false }]);
              setErreur("");
            }}>
            Réinitialiser
          </button>
        )}
        {editMode && onApprove && (
          <button type="button"
            style={{ background: "#008c4a", color: "#fff", border: "1px solid #006c39", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }}
            onClick={() => {
              if (window.confirm("Enregistrer les modifications ET approuver cette demande ?\n\nLe statut passera à « Approuvée ». Confirmer ?")) {
                soumettre();
              }
            }}>
            Enregistrer et approuver
          </button>
        )}
        <button type="button"
          style={{ background: COLORS.rouge, color: "#fff", border: `1px solid ${COLORS.rouge}`, borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }}
          onClick={onBack}>
          {editMode ? "Annuler les modifications" : "Annuler"}
        </button>
      </div>
    </div>
  );
}

// ─── Form: Activités et Sorties ───────────────────────────────────────────────
function FormActivite({ user, onSubmit, onBack, allUsers, initialData, editMode }) {
  const today = new Date().toISOString().slice(0, 10);
  const fd = initialData || {};
  const [form, setForm] = useState({
    responsables: fd.responsables ? fd.responsables.filter(r => r.nom !== user.name) : [],
    nomActivite: fd["Nom de l'activité"] || fd.nomActivite || "",
    typeActivite: fd["Type"] || fd.typeActivite || "",
    dateDemande: fd.dateDemande || today,
    datesPrevues: fd.datesPrevues || [{ date: "", heureDebut: "09:15", heureFin: "15:40" }],
    description: fd["Description"] || fd.description || "",
    niveauxConcernes: fd.niveauxConcernes || (fd["Niveaux"] ? fd["Niveaux"].split(", ") : []),
    matieresConcernees: fd.matieresConcernees || [],
    autreNiveau: fd.autreNiveau || "",
    autreMatiere: fd.autreMatiere || "",
    groupes: fd["Groupes"] || fd.groupes || "",
    passion: fd.passion || "",
    passionTypes: fd.passionTypes || [],
    passionAutres: fd.passionAutres || "",
    obligatoire: fd.obligatoire || "",
    autresClientele: fd.autresClientele || "",
    directionResponsable: fd.directionResponsable || "",
    coutEleve: fd.coutEleve || "", nbEleves: fd.nbEleves || "",
    coutAdulte: fd.coutAdulte || "", nbAdultes: fd.nbAdultes || "",
    coutLiberation: fd.coutLiberation || COUT_LIBERATION_DEFAULT, nbPeriodes: fd.nbPeriodes || "",
    coutTransport: fd.coutTransport || "", autreMontant: fd.autreMontant || "",
    typeTransport: fd.typeTransport || "", autreTransport: fd.autreTransport || "",
    nomEtablissement: fd.nomEtablissement || "", adresseComplete: fd.adresseComplete || "",
    personneContact: fd.personneContact || "", telephone: fd.telephone || "", poste: fd.poste || "",
    heureDepart: fd.heureDepart || "", heureRetour: fd.heureRetour || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rechercheResp, setRechercheResp] = useState("");

  function toggleCheck(field, val) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(val) ? prev[field].filter((x) => x !== val) : [...prev[field], val],
    }));
  }

  function calcTotal() {
    const st1 = parseFloat(form.coutEleve || 0) * parseFloat(form.nbEleves || 0);
    const st2 = parseFloat(form.coutAdulte || 0) * parseFloat(form.nbAdultes || 0);
    const st3 = parseFloat(form.coutLiberation || 0) * parseFloat(form.nbPeriodes || 0);
    const transport = parseFloat(form.coutTransport || 0);
    const autre = parseFloat(form.autreMontant || 0);
    return (st1 + st2 + st3 + transport + autre).toFixed(2);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nomActivite || !form.typeActivite || form.niveauxConcernes.length === 0) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const datesPassees = form.datesPrevues.filter(d => d.date && d.date < today);
    if (datesPassees.length > 0) {
      setError("Une ou plusieurs dates prévues sont dans le passé. Veuillez choisir des dates aujourd'hui ou dans le futur.");
      return;
    }
    if (form.typeActivite === "Sortie" && (!form.typeTransport || !form.nomEtablissement || !form.adresseComplete || !form.personneContact || !form.telephone || !form.heureDepart || !form.heureRetour)) {
      setError("Pour une sortie, veuillez remplir tous les champs obligatoires de la section Transport (type de transport, nom de l'établissement, adresse complète, personne à contacter, téléphone, heure de départ et heure de retour).");
      return;
    }
    setError("");
    const formDataOut = {
      "Nom de l'activité": form.nomActivite,
      "Type": form.typeActivite,
      "Responsable(s)": form.responsables.map(r => r.nom).join(", "),
      "Description": form.description,
      "Niveaux": form.niveauxConcernes.join(", "),
      "Groupes": form.groupes,
      "Total estimé": calcTotal() + " $",
      // Données complètes pour réédition future
      dateDemande: form.dateDemande || today,
      responsables: form.responsables,
      nomActivite: form.nomActivite,
      typeActivite: form.typeActivite,
      datesPrevues: form.datesPrevues,
      description: form.description,
      niveauxConcernes: form.niveauxConcernes,
      matieresConcernees: form.matieresConcernees,
      autreNiveau: form.autreNiveau,
      autreMatiere: form.autreMatiere,
      groupes: form.groupes,
      passion: form.passion,
      passionTypes: form.passionTypes,
      passionAutres: form.passionAutres,
      obligatoire: form.obligatoire,
      autresClientele: form.autresClientele,
      directionResponsable: form.directionResponsable,
      coutEleve: form.coutEleve, nbEleves: form.nbEleves,
      coutAdulte: form.coutAdulte, nbAdultes: form.nbAdultes,
      coutLiberation: form.coutLiberation, nbPeriodes: form.nbPeriodes,
      coutTransport: form.coutTransport, autreMontant: form.autreMontant,
      typeTransport: form.typeTransport, autreTransport: form.autreTransport,
      nomEtablissement: form.nomEtablissement, adresseComplete: form.adresseComplete,
      personneContact: form.personneContact, telephone: form.telephone, poste: form.poste,
      heureDepart: form.heureDepart, heureRetour: form.heureRetour,
    };
    if (editMode) {
      onSubmit(formDataOut);
    } else {
      onSubmit({ type: "activite", title: form.nomActivite || "Demande d'activité", formData: formDataOut });
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div style={S.content}>
        <div style={{ ...S.card, textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: "0 0 8px" }}>Demande soumise avec succès!</h2>
          <p style={{ color: COLORS.gris, marginBottom: 24 }}>Votre demande d'activité ou de sortie a été transmise.</p>
          <button style={S.btnPrimary} onClick={onBack}>Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  const niveaux = ["S1","S2","S3","S4","S5","SA","Tremplin","SAS","AT","Accueil","Pré-DEP","Étude-action (EMS)","Toute l'école"];
  const matieres = ["Accueil","Anglais","Arts","CCQ","Éducation physique","Français","Mathématiques","Science","Univers social / Histoire","Non applicable","Autre"];
  const typesTransport = ["Location d'un autobus scolaire ou de ville", "Transport en commun", "À pied", "Non applicable", "Autre"];

  const inputDollar = (val, onChange) => (
    <div style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: 4, overflow: "hidden", background: "#fff" }}>
      <input type="number" step="0.01" min="0" style={{ ...S.input, border: "none", flex: 1, borderRadius: 0 }} value={val} onChange={onChange} />
      <span style={{ padding: "0 8px", background: "#f5f5f5", borderLeft: "1px solid #ccc", fontSize: 12, lineHeight: "36px" }}>$</span>
    </div>
  );

  return (
    <div style={S.content}>
      <button className="no-print" style={{ ...S.btn, marginBottom: 20 }} onClick={onBack}>← Retour</button>
      <div id="print-zone" style={S.card}>
        <div style={{ background: editMode ? "#23b090" : COLORS.bleu, margin: "-28px -32px 24px", padding: "20px 32px" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>{editMode ? "Modifier la demande d'activité / sortie" : "Demande d'activités et de sorties"}</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{editMode ? "Modifiez les champs souhaités, puis cliquez sur Enregistrer" : "Complétez tous les champs obligatoires (*)"}</p>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") e.preventDefault(); }}>

          {/* ── Demandeur + Responsables fusionnés ── */}
          <h3 style={S.sectionTitle}>Informations du demandeur / demandeuse</h3>

          {/* Ligne 1 : Demandeur principal (auto) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 18px", marginBottom: 12 }}>
            <F label="Demandeur / Demandeuse">
              <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={user.name} readOnly />
            </F>
            <F label="Courriel">
              <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={user.email + "@csslaval.gouv.qc.ca"} readOnly />
            </F>
            <F label="Date de la demande">
              <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={form.dateDemande} readOnly />
            </F>
          </div>

          {/* Responsables additionnels — recherche dans le bottin */}
          <label style={{ ...S.label, marginBottom: 6 }}>Responsable(s) additionnel(s)</label>
          {form.responsables.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {form.responsables.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "6px 10px", background: "#f0f8f4", borderRadius: 6, border: "1px solid #c3e6d4" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.nom}</span>
                  <span style={{ fontSize: 12, color: COLORS.gris, flex: 1 }}>{r.courriel ? r.courriel + "@csslaval.gouv.qc.ca" : ""}</span>
                  <button type="button"
                    style={{ ...S.btnDanger, padding: "3px 8px", fontSize: 13 }}
                    onClick={() => setForm({ ...form, responsables: form.responsables.filter((_, j) => j !== i) })}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recherche dans le bottin */}
          {(() => {
            const dejaDans = new Set([user.id, ...form.responsables.map(r => r.userId).filter(Boolean)]);
            const suggestions = rechercheResp.trim().length >= 1
              ? allUsers.filter(u => !dejaDans.has(u.id) && u.name.toLowerCase().includes(rechercheResp.toLowerCase()))
              : [];
            return (
              <div style={{ position: "relative", marginBottom: 20, maxWidth: 420 }}>
                <input
                  style={S.input}
                  placeholder="Tapez un nom pour rechercher..."
                  value={rechercheResp}
                  onChange={e => setRechercheResp(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
                />
                {suggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #d9dee5", borderRadius: "0 0 6px 6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                    {suggestions.map(u => (
                      <div key={u.id}
                        style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0f8f4"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        onMouseDown={e => {
                          e.preventDefault();
                          setForm({ ...form, responsables: [...form.responsables, { userId: u.id, nom: u.name, courriel: u.email }] });
                          setRechercheResp("");
                        }}>
                        <strong>{u.name}</strong>
                        <span style={{ color: COLORS.gris, marginLeft: 8, fontSize: 12 }}>{u.email}@csslaval.gouv.qc.ca</span>
                      </div>
                    ))}
                  </div>
                )}
                {rechercheResp.trim().length >= 1 && suggestions.length === 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, padding: "8px 12px", background: "#fff", border: "1px solid #d9dee5", borderRadius: "0 0 6px 6px", fontSize: 13, color: COLORS.gris }}>
                    Aucun résultat dans le bottin.
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Détails ── */}
          <h3 style={S.sectionTitle}>Détails de la demande</h3>
          <div style={S.grid2}>
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Nom de l'activité ou de la sortie<span style={{ color: COLORS.rouge }}> *</span></label>
                <input style={S.input} value={form.nomActivite} onChange={(e) => setForm({ ...form, nomActivite: e.target.value })} required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Nature de la demande<span style={{ color: COLORS.rouge }}> *</span></label>
                <div style={{ display: "flex", gap: 16 }}>
                  {["Activité", "Sortie"].map((t) => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input type="radio" name="typeActivite" value={t} checked={form.typeActivite === t} onChange={(e) => setForm({ ...form, typeActivite: e.target.value })} />
                      {t}
                    </label>
                  ))}
                </div>
                {form.typeActivite === "Sortie" && (
                  <div style={{ marginTop: 8, padding: "10px 14px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, color: "#7a5800", fontSize: 13 }}>
                    ⚠️ Merci de valider que la sortie n'a pas lieu dans la zone grisée du calendrier scolaire.
                  </div>
                )}
              </div>
              <div>
                <label style={S.label}>Date(s) prévue(s)<span style={{ color: COLORS.rouge }}> *</span></label>
                {form.datesPrevues.map((d, i) => {
                  // Vérifier si la date est dans moins de 3 semaines
                  const tropPres = d.date && (() => {
                    const dateDem = new Date(form.dateDemande || today);
                    const dateAct = new Date(d.date);
                    const diffJours = Math.round((dateAct - dateDem) / (1000 * 60 * 60 * 24));
                    return diffJours >= 0 && diffJours < 21;
                  })();
                  return (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <input type="date" style={{ ...S.input, flex: "1 1 130px", minWidth: 120, borderColor: (d.date && d.date < today) ? COLORS.rouge : tropPres ? "#f59e0b" : undefined }} min={today} value={d.date} onChange={(e) => {
                          const next = [...form.datesPrevues]; next[i] = { ...d, date: e.target.value };
                          setForm({ ...form, datesPrevues: next });
                        }} />
                        <input type="time" style={{ ...S.input, flex: "0 0 100px" }} value={d.heureDebut} onChange={(e) => {
                          const next = [...form.datesPrevues]; next[i] = { ...d, heureDebut: e.target.value };
                          setForm({ ...form, datesPrevues: next });
                        }} />
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>à</span>
                        <input type="time" style={{ ...S.input, flex: "0 0 100px" }} value={d.heureFin} onChange={(e) => {
                          const next = [...form.datesPrevues]; next[i] = { ...d, heureFin: e.target.value };
                          setForm({ ...form, datesPrevues: next });
                        }} />
                        <button type="button" style={{ ...S.btnDanger, padding: "4px 8px", fontSize: 14, flexShrink: 0 }} onClick={() => {
                          if (form.datesPrevues.length > 1) setForm({ ...form, datesPrevues: form.datesPrevues.filter((_, j) => j !== i) });
                        }}>✕</button>
                      </div>
                      {d.date && d.date < today && (
                        <div style={{ marginTop: 5, padding: "7px 12px", background: "#fee2e2", border: `1px solid ${COLORS.rouge}`, borderRadius: 6, color: COLORS.rouge, fontSize: 12 }}>
                          ⚠ La date doit être aujourd'hui ou dans le futur.
                        </div>
                      )}
                      {tropPres && !(d.date && d.date < today) && (
                        <div style={{ marginTop: 5, padding: "7px 12px", background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: 6, color: "#7a5800", fontSize: 12 }}>
                          ⚠️ La date de l'activité ou de la sortie est très près. Il se peut que la demande soit refusée. Merci de communiquer avec la direction.
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" style={{ ...S.btnSmall, marginTop: 4, fontSize: 16 }} onClick={() => setForm({ ...form, datesPrevues: [...form.datesPrevues, { date: "", heureDebut: "09:15", heureFin: "15:40" }] })}>+</button>
              </div>
            </div>
            <div>
              <label style={S.label}>Description et objectifs<span style={{ color: COLORS.rouge }}> *</span></label>
              <textarea style={{ ...S.textarea, minHeight: 200 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
          </div>

          {/* ── Clientèle ── */}
          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>Clientèle concernée</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Niveau(x) concerné(s)<span style={{ color: COLORS.rouge }}> *</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
              {[...niveaux, "Autre"].map((n) => (
                <label key={n} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox" checked={form.niveauxConcernes.includes(n)} onChange={() => toggleCheck("niveauxConcernes", n)} />
                  {n}
                </label>
              ))}
            </div>
            {form.niveauxConcernes.includes("Autre") && (
              <input style={{ ...S.input, marginTop: 8, maxWidth: 420 }} placeholder="Précisez le niveau" value={form.autreNiveau} onChange={(e) => setForm({ ...form, autreNiveau: e.target.value })} />
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Matière(s) concernée(s)<span style={{ color: COLORS.rouge }}> *</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
              {matieres.map((m) => (
                <label key={m} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox" checked={form.matieresConcernees.includes(m)} onChange={() => toggleCheck("matieresConcernees", m)} />
                  {m}
                </label>
              ))}
            </div>
            {form.matieresConcernees.includes("Autre") && (
              <input style={{ ...S.input, marginTop: 8, maxWidth: 420 }} placeholder="Précisez la matière" value={form.autreMatiere} onChange={(e) => setForm({ ...form, autreMatiere: e.target.value })} />
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 22px", alignItems: "start", marginBottom: 16 }}>
            <div>
              <label style={S.label}>Direction responsable<span style={{ color: COLORS.rouge }}> *</span></label>
              <select style={S.select} value={form.directionResponsable} onChange={e => setForm({ ...form, directionResponsable: e.target.value })}>
                <option value="">Sélectionnez</option>
                {allUsers.filter(u => u.roles.includes("A") && !u.roles.includes("D")).map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Liste des groupes concernés<span style={{ color: COLORS.rouge }}> *</span></label>
              <input style={S.input} placeholder="Ex: 101, 102, 203..." value={form.groupes} onChange={(e) => setForm({ ...form, groupes: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Activité dans le cadre d'une passion ?<span style={{ color: COLORS.rouge }}> *</span></label>
              <div style={{ display: "flex", gap: 16 }}>
                {["Oui", "Non"].map((v) => (
                  <label key={v} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <input type="radio" name="passion" value={v} checked={form.passion === v} onChange={(e) => setForm({ ...form, passion: e.target.value })} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>Activité obligatoire ?<span style={{ color: COLORS.rouge }}> *</span></label>
              <div style={{ display: "flex", gap: 16 }}>
                {["Oui", "Non"].map((v) => (
                  <label key={v} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <input type="radio" name="obligatoire" value={v} checked={form.obligatoire === v} onChange={(e) => setForm({ ...form, obligatoire: e.target.value })} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {form.passion === "Oui" && (
            <div style={{ padding: "12px 16px", background: "#f0f8f4", borderRadius: 6, marginBottom: 12 }}>
              <label style={S.label}>Quelle est la passion concernée ?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                {["Action", "Création", "Découverte", "Langue", "Autres"].map((p) => (
                  <label key={p} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 14 }}>
                    <input type="checkbox" checked={form.passionTypes.includes(p)} onChange={() => toggleCheck("passionTypes", p)} />
                    {p}
                  </label>
                ))}
              </div>
              {form.passionTypes.includes("Autres") && (
                <input style={{ ...S.input, marginTop: 8, maxWidth: 420 }} placeholder="Précisez la passion" value={form.passionAutres} onChange={(e) => setForm({ ...form, passionAutres: e.target.value })} />
              )}
            </div>
          )}

          {/* ── Transport (sortie seulement) ── */}
          {form.typeActivite === "Sortie" && (
            <>
              <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>Transport (sortie seulement)</h3>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Type de transport<span style={{ color: COLORS.rouge }}> *</span></label>
                  <select style={S.select} value={form.typeTransport} onChange={(e) => setForm({ ...form, typeTransport: e.target.value })} required>
                    <option value="">Sélectionnez</option>
                    {typesTransport.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {form.typeTransport === "Location d'un autobus scolaire ou de ville" && (
                    <div style={{ marginTop: 8, padding: "10px 14px", background: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: 6, color: "#075985", fontSize: 13 }}>
                      ℹ️ Le coût de la location d'un autobus doit être ajouté au coût de l'activité. Si la sortie se fait dans le cadre d'une passion, ces coûts doivent être inclus dans votre budget. Veuillez contacter l'agente de bureau responsable du dossier pour plus de détails.
                    </div>
                  )}
                  {form.typeTransport === "Autre" && (
                    <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez le type de transport" value={form.autreTransport} onChange={(e) => setForm({ ...form, autreTransport: e.target.value })} />
                  )}
                </div>
                <div>
                  <label style={S.label}>Nom de l'établissement<span style={{ color: COLORS.rouge }}> *</span></label>
                  <input style={S.input} value={form.nomEtablissement} onChange={(e) => setForm({ ...form, nomEtablissement: e.target.value })} required />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>Adresse complète<span style={{ color: COLORS.rouge }}> *</span></label>
                  <input style={S.input} value={form.adresseComplete} onChange={(e) => setForm({ ...form, adresseComplete: e.target.value })} required />
                </div>
                <div>
                  <label style={S.label}>Personne à contacter<span style={{ color: COLORS.rouge }}> *</span></label>
                  <input style={S.input} value={form.personneContact} onChange={(e) => setForm({ ...form, personneContact: e.target.value })} required />
                </div>
                <div>
                  <label style={S.label}>Téléphone / Poste<span style={{ color: COLORS.rouge }}> *</span></label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...S.input, flex: 2 }} placeholder="(514) 555-0000" value={form.telephone} onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      let fmt = digits;
                      if (digits.length >= 7) fmt = "(" + digits.slice(0,3) + ") " + digits.slice(3,6) + "-" + digits.slice(6);
                      else if (digits.length >= 4) fmt = "(" + digits.slice(0,3) + ") " + digits.slice(3);
                      else if (digits.length >= 1) fmt = "(" + digits;
                      setForm({ ...form, telephone: fmt });
                    }} required />
                    <input style={{ ...S.input, flex: 1 }} placeholder="Poste" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={S.label}>Heure de départ de l'école<span style={{ color: COLORS.rouge }}> *</span></label>
                  <input type="time" style={S.input} value={form.heureDepart} onChange={(e) => setForm({ ...form, heureDepart: e.target.value })} required />
                </div>
                <div>
                  <label style={S.label}>Heure de retour de l'école<span style={{ color: COLORS.rouge }}> *</span></label>
                  <input type="time" style={S.input} value={form.heureRetour} onChange={(e) => setForm({ ...form, heureRetour: e.target.value })} required />
                </div>
              </div>
            </>
          )}

          {/* ── Coûts ── */}
          <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>Coûts</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ ...S.table, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={S.th}>Coût</th>
                  <th style={S.th}>Nombre</th>
                  <th style={S.th}>Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "par élève", cout: "coutEleve", nb: "nbEleves", nbLabel: "d'élèves", taxes: true },
                  { label: "par adulte", cout: "coutAdulte", nb: "nbAdultes", nbLabel: "d'adultes", taxes: true },
                  { label: "d'une libération par période", cout: "coutLiberation", nb: "nbPeriodes", nbLabel: "de périodes à se faire remplacer" },
                ].map((row, i) => (
                  <tr key={row.cout} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={S.td}>
                      <label style={{ fontWeight: 600, fontSize: 12, display: "block", marginBottom: 4 }}>
                        Coût {row.label}<span style={{ color: COLORS.rouge }}>*</span>
                        {row.taxes && <span style={{ fontWeight: 400, fontSize: 11, color: COLORS.gris, marginLeft: 6 }}>(taxes incluses)</span>}
                      </label>
                      {inputDollar(form[row.cout], (e) => setForm({ ...form, [row.cout]: e.target.value }))}
                    </td>
                    <td style={S.td}>
                      <label style={{ fontWeight: 600, fontSize: 12, display: "block", marginBottom: 4 }}>Nombre total {row.nbLabel}<span style={{ color: COLORS.rouge }}>*</span></label>
                      <input type="number" min="0" style={S.input} value={form[row.nb]} onChange={(e) => setForm({ ...form, [row.nb]: e.target.value })} />
                    </td>
                    <td style={S.td}>
                      <label style={{ fontWeight: 600, fontSize: 12, display: "block", marginBottom: 4 }}>Sous-total</label>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: 4, overflow: "hidden", background: "#fff" }}>
                        <input style={{ ...S.input, border: "none", flex: 1, borderRadius: 0, background: "#f9fafb" }} value={(parseFloat(form[row.cout] || 0) * parseFloat(form[row.nb] || 0)).toFixed(2)} readOnly />
                        <span style={{ padding: "0 8px", background: "#f5f5f5", borderLeft: "1px solid #ccc", fontSize: 12, lineHeight: "36px" }}>$</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {form.typeActivite === "Sortie" && (
                  <tr style={{ background: "#fafafa" }}>
                    <td colSpan={2} style={{ ...S.td, textAlign: "right", fontWeight: 600, fontSize: 13 }}>Transport</td>
                    <td style={S.td}>{inputDollar(form.coutTransport, (e) => setForm({ ...form, coutTransport: e.target.value }))}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2} style={{ ...S.td, textAlign: "right", fontWeight: 600, fontSize: 13 }}>Autres coûts</td>
                  <td style={S.td}>{inputDollar(form.autreMontant, (e) => setForm({ ...form, autreMontant: e.target.value }))}</td>
                </tr>
                <tr style={{ background: "#e8f5ee" }}>
                  <td colSpan={2} style={{ ...S.td, textAlign: "right", fontWeight: 700, fontSize: 14 }}>TOTAL</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", border: `2px solid ${COLORS.vert}`, borderRadius: 4, overflow: "hidden", background: "#fff" }}>
                      <span style={{ flex: 1, padding: "4px 8px", fontWeight: 700, fontSize: 14 }}>{calcTotal()}</span>
                      <span style={{ padding: "0 8px", background: "#e8f5ee", color: COLORS.vertFonce, borderLeft: `1px solid ${COLORS.vert}`, fontWeight: 700, lineHeight: "36px" }}>$</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {error && <div style={S.error}>{error}</div>}
          <div className="no-print" style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            <button type="submit" style={{ ...S.btnPrimary, background: editMode ? COLORS.vert : COLORS.vert }}>{editMode ? "Enregistrer les modifications" : "Envoyer la demande"}</button>
            {!editMode && <button type="button" style={{ background: "#04043C", color: "#fff", border: "1px solid #04043C", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={() => printZone()}>Imprimer</button>}
            {!editMode && <button type="button" style={{ background: "#23b090", color: "#fff", border: "1px solid #1a8a70", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={() => {
              setForm({ responsables: [{ nom: user.name, courriel: user.email }], nomActivite: "", typeActivite: "", datesPrevues: [{ date: "", heureDebut: "09:15", heureFin: "15:40" }], description: "", niveauxConcernes: [], matieresConcernees: [], autreMatiere: "", autreNiveau: "", groupes: "", passion: "", passionTypes: [], passionAutres: "", obligatoire: "", autresClientele: "", coutEleve: "", nbEleves: "", coutAdulte: "", nbAdultes: "", coutLiberation: COUT_LIBERATION_DEFAULT, nbPeriodes: "", coutTransport: "", autreMontant: "", typeTransport: "", autreTransport: "", nomEtablissement: "", adresseComplete: "", personneContact: "", telephone: "", poste: "", heureDepart: "", heureRetour: "" });
              setError("");
            }}>Réinitialiser</button>}
            <button type="button" style={S.btn} onClick={onBack}>{editMode ? "Annuler les modifications" : "Annuler"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─── Zone de dessin pour la réquisition interne ──────────────────────────────
function DrawingZone({ onChange }) {
  const [tool,      setTool]     = useState("select");
  const [color,     setColor]    = useState("#1a1a2e");
  const [fontSize,  setFontSize] = useState(16);
  const [bold,      setBold]     = useState(false);
  const [italic,    setItalic]   = useState(false);
  const [underline, setUnderline]= useState(false);
  const [shapes,    setShapes]   = useState([]);
  const [drawing,   setDrawing]  = useState(null);
  const [clipboard, setClipboard]= useState(null);
  const [selected,  setSelected] = useState(null);
  const [drag,      setDrag]     = useState(null);
  const [resize,    setResize]   = useState(null);
  const [textEdit,  setTextEdit] = useState(null);
  const [textVal,   setTextVal]  = useState("");
  const [inputEl,   setInputEl]  = useState(null);

  // Focus sur l'input texte quand il s'ouvre
  useEffect(() => {
    if (textEdit && inputEl) setTimeout(() => { try { inputEl.focus(); } catch(e){} }, 30);
  }, [textEdit, inputEl]);

  // Copier / Coller / Suppr clavier
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement ? document.activeElement.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey||e.metaKey) && e.key==="c" && selected) {
        const s = shapes.find(x=>x.id===selected);
        if (s) setClipboard(s);
      }
      if ((e.ctrlKey||e.metaKey) && e.key==="v" && clipboard) {
        const id=Date.now(), off=18;
        let s={...clipboard,id};
        if (s.type==="rect"||s.type==="text") s={...s,x:s.x+off,y:s.y+off};
        if (s.type==="ellipse") s={...s,cx:s.cx+off,cy:s.cy+off};
        if (s.type==="arrow")   s={...s,x0:s.x0+off,y0:s.y0+off,x1:s.x1+off,y1:s.y1+off};
        setShapes(prev=>[...prev,s]);
        setSelected(id);
      }
      if ((e.key==="Delete"||e.key==="Backspace") && selected) {
        setShapes(prev=>prev.filter(x=>x.id!==selected));
        setSelected(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  }, [selected, clipboard, shapes]);

  const TOOLS = [
    {id:"select",  icon:"↖", label:"Déplacer / Redim."},
    {id:"rect",    icon:"□", label:"Rectangle"},
    {id:"ellipse", icon:"○", label:"Cercle / Ovale"},
    {id:"arrow",   icon:"→", label:"Flèche"},
    {id:"text",    icon:"T", label:"Texte"},
  ];

  function getSvgPos(e) {
    const el = document.getElementById("draw-svg");
    if (!el) return {x:0,y:0};
    const r  = el.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {x:Math.round(cx-r.left), y:Math.round(cy-r.top)};
  }

  // ── Clic SVG ─────────────────────────────────────────────────────────────
  function onSvgDown(e) {
    const pos = getSvgPos(e);

    // Mode texte : placer un texte même sur une forme existante
    if (tool === "text") {
      setTextEdit({x:pos.x, y:pos.y});
      setTextVal("");
      setSelected(null);
      e.preventDefault();
      return;
    }

    // Mode sélection ou poignée : géré par onShapeDown / onHandleDown
    if (e.target.closest("[data-shape]") || e.target.closest("[data-handle]")) return;

    setSelected(null);
    setResize(null);
    if (tool === "select") return;

    setDrawing({x0:pos.x, y0:pos.y, x1:pos.x, y1:pos.y});
    e.preventDefault();
  }

  function onSvgMove(e) {
    const pos = getSvgPos(e);
    if (drawing) { setDrawing(d=>({...d,x1:pos.x,y1:pos.y})); return; }
    if (drag) {
      setShapes(prev=>prev.map(s=>{
        if (s.id!==drag.id) return s;
        if (s.type==="rect"||s.type==="text") return {...s,x:pos.x-drag.ox,y:pos.y-drag.oy};
        if (s.type==="ellipse") return {...s,cx:pos.x-drag.ox,cy:pos.y-drag.oy};
        if (s.type==="arrow") { const dx=(pos.x-drag.ox)-s.x0,dy=(pos.y-drag.oy)-s.y0; return {...s,x0:s.x0+dx,y0:s.y0+dy,x1:s.x1+dx,y1:s.y1+dy}; }
        return s;
      }));
      return;
    }
    if (resize) {
      setShapes(prev=>prev.map(s=>{
        if (s.id!==resize.id) return s;
        const dx=pos.x-resize.ox, dy=pos.y-resize.oy;
        if (s.type==="rect") {
          const h=resize.handle;
          let {x,y,w,h:ht}=s;
          if (h.includes("e")) w=Math.max(8,resize.snap.w+dx);
          if (h.includes("s")) ht=Math.max(8,resize.snap.h+dy);
          if (h.includes("w")) {x=Math.min(resize.snap.x+resize.snap.w-8,resize.snap.x+dx);w=Math.max(8,resize.snap.w-dx);}
          if (h.includes("n")) {y=Math.min(resize.snap.y+resize.snap.h-8,resize.snap.y+dy);ht=Math.max(8,resize.snap.h-dy);}
          return {...s,x,y,w,h:ht};
        }
        if (s.type==="ellipse") {
          let {rx,ry}=s;
          const h=resize.handle;
          if (h==="e"||h==="w") rx=Math.max(4,resize.snap.rx+Math.abs(dx));
          if (h==="n"||h==="s") ry=Math.max(4,resize.snap.ry+Math.abs(dy));
          if (h==="ne"||h==="nw"||h==="se"||h==="sw") {rx=Math.max(4,resize.snap.rx+Math.abs(dx));ry=Math.max(4,resize.snap.ry+Math.abs(dy));}
          return {...s,rx,ry};
        }
        if (s.type==="arrow") {
          if (resize.handle==="start") return {...s,x0:pos.x,y0:pos.y};
          if (resize.handle==="end")   return {...s,x1:pos.x,y1:pos.y};
        }
        return s;
      }));
    }
  }

  function onSvgUp() {
    if (drag)   { setDrag(null);   return; }
    if (resize) { setResize(null); return; }
    if (!drawing) return;
    const {x0,y0,x1,y1}=drawing;
    if (Math.abs(x1-x0)<5&&Math.abs(y1-y0)<5) { setDrawing(null); return; }
    const id=Date.now();
    let s={id,color};
    if (tool==="rect")    s={...s,type:"rect",   x:Math.min(x0,x1),y:Math.min(y0,y1),w:Math.abs(x1-x0),h:Math.abs(y1-y0)};
    if (tool==="ellipse") s={...s,type:"ellipse",cx:Math.round((x0+x1)/2),cy:Math.round((y0+y1)/2),rx:Math.max(4,Math.round(Math.abs(x1-x0)/2)),ry:Math.max(4,Math.round(Math.abs(y1-y0)/2))};
    if (tool==="arrow")   s={...s,type:"arrow",  x0,y0,x1,y1};
    setShapes(prev=>[...prev,s]);
    setSelected(id);
    setDrawing(null);
  }

  function onShapeDown(e, s) {
    e.stopPropagation();
    if (tool==="text") {
      // En mode texte, cliquer sur une forme place le texte à cet endroit
      const pos = getSvgPos(e);
      setTextEdit({x:pos.x, y:pos.y});
      setTextVal("");
      setSelected(null);
      e.preventDefault();
      return;
    }
    if (tool!=="select") return;
    setSelected(s.id);
    const pos=getSvgPos(e);
    const ax=s.type==="ellipse"?s.cx:s.x0!==undefined?s.x0:s.x;
    const ay=s.type==="ellipse"?s.cy:s.y0!==undefined?s.y0:s.y;
    setDrag({id:s.id,ox:pos.x-ax,oy:pos.y-ay});
    e.preventDefault();
  }

  function onHandleDown(e, s, handle) {
    e.stopPropagation(); e.preventDefault();
    const pos=getSvgPos(e);
    const snap=s.type==="rect"?{x:s.x,y:s.y,w:s.w,h:s.h}:s.type==="ellipse"?{rx:s.rx,ry:s.ry}:{};
    setResize({id:s.id,handle,ox:pos.x,oy:pos.y,snap});
    setDrag(null);
  }

  function onShapeDblClick(e, s) {
    e.stopPropagation();
    if (s.type==="text") { setTextEdit({id:s.id,x:s.x,y:s.y}); setTextVal(s.text); }
  }

  function commitText() {
    const t=(textVal||"").trim();
    if (t) {
      if (textEdit&&textEdit.id) {
        setShapes(prev=>prev.map(s=>s.id===textEdit.id?{...s,text:t}:s));
      } else if (textEdit) {
        const id=Date.now();
        setShapes(prev=>[...prev,{id,type:"text",x:textEdit.x,y:textEdit.y,text:t,color,fs:fontSize,bold,italic,underline}]);
        setSelected(id);
      }
    }
    setTextEdit(null); setTextVal(""); setInputEl(null);
  }

  // ── Changer la couleur d'une forme sélectionnée ───────────────────────────
  function applyColorToSelected(newColor) {
    setColor(newColor);
    if (selected) setShapes(prev=>prev.map(s=>s.id===selected?{...s,color:newColor}:s));
  }

  // ── Changer le style texte d'une forme sélectionnée ──────────────────────
  function applyTextStyle(prop, value) {
    if (selected) {
      const s = shapes.find(x=>x.id===selected);
      if (s && s.type==="text") setShapes(prev=>prev.map(sh=>sh.id===selected?{...sh,[prop]:value}:sh));
    }
    if (prop==="bold")      setBold(value);
    if (prop==="italic")    setItalic(value);
    if (prop==="underline") setUnderline(value);
    if (prop==="fs")        setFontSize(value);
  }

  function deleteSelected() { setShapes(prev=>prev.filter(s=>s.id!==selected)); setSelected(null); }

  function duplicateSelected() {
    const s=shapes.find(x=>x.id===selected);
    if (!s) return;
    setClipboard(s);
    const id=Date.now(),off=18;
    let ns={...s,id};
    if (s.type==="rect"||s.type==="text") ns={...ns,x:s.x+off,y:s.y+off};
    if (s.type==="ellipse") ns={...ns,cx:s.cx+off,cy:s.cy+off};
    if (s.type==="arrow")   ns={...ns,x0:s.x0+off,y0:s.y0+off,x1:s.x1+off,y1:s.y1+off};
    setShapes(prev=>[...prev,ns]);
    setSelected(id);
  }

  function preview() {
    if (!drawing) return null;
    const {x0,y0,x1,y1}=drawing;
    const p={fill:color+"15",stroke:color,strokeWidth:1.5,strokeDasharray:"5 3"};
    if (tool==="rect")    return <rect x={Math.min(x0,x1)} y={Math.min(y0,y1)} width={Math.abs(x1-x0)} height={Math.abs(y1-y0)} {...p}/>;
    if (tool==="ellipse") return <ellipse cx={Math.round((x0+x1)/2)} cy={Math.round((y0+y1)/2)} rx={Math.max(4,Math.round(Math.abs(x1-x0)/2))} ry={Math.max(4,Math.round(Math.abs(y1-y0)/2))} {...p}/>;
    if (tool==="arrow")   return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={2} strokeDasharray="5 3" markerEnd="url(#pah)"/>;
    return null;
  }

  function renderHandles(s) {
    const hs={style:{pointerEvents:"all",cursor:"pointer"},fill:"#0284c7","data-handle":true};
    const H=7;
    if (s.type==="rect") {
      const pts=[["n",s.x+s.w/2,s.y],["ne",s.x+s.w,s.y],["e",s.x+s.w,s.y+s.h/2],["se",s.x+s.w,s.y+s.h],["s",s.x+s.w/2,s.y+s.h],["sw",s.x,s.y+s.h],["w",s.x,s.y+s.h/2],["nw",s.x,s.y]];
      return pts.map(([h,hx,hy])=><rect key={h} {...hs} x={hx-H/2} y={hy-H/2} width={H} height={H} rx={1} style={{...hs.style,cursor:h==="n"||h==="s"?"ns-resize":h==="e"||h==="w"?"ew-resize":"nwse-resize"}} onMouseDown={e=>onHandleDown(e,s,h)}/>);
    }
    if (s.type==="ellipse") {
      const pts=[["n",s.cx,s.cy-s.ry],["e",s.cx+s.rx,s.cy],["s",s.cx,s.cy+s.ry],["w",s.cx-s.rx,s.cy],["ne",s.cx+s.rx,s.cy-s.ry],["se",s.cx+s.rx,s.cy+s.ry],["sw",s.cx-s.rx,s.cy+s.ry],["nw",s.cx-s.rx,s.cy-s.ry]];
      return pts.map(([h,hx,hy])=><rect key={h} {...hs} x={hx-H/2} y={hy-H/2} width={H} height={H} rx={1} style={{...hs.style,cursor:"nwse-resize"}} onMouseDown={e=>onHandleDown(e,s,h)}/>);
    }
    if (s.type==="arrow") return [
      <circle key="s" {...hs} cx={s.x0} cy={s.y0} r={5} style={{...hs.style,cursor:"crosshair"}} onMouseDown={e=>onHandleDown(e,s,"start")}/>,
      <circle key="e" {...hs} cx={s.x1} cy={s.y1} r={5} style={{...hs.style,cursor:"crosshair"}} onMouseDown={e=>onHandleDown(e,s,"end")}/>,
    ];
    return null;
  }

  const sel = shapes.find(s=>s.id===selected);
  const isSelText = sel && sel.type==="text";

  // Synchro des contrôles de style quand on sélectionne une forme
  useEffect(() => {
    if (sel) {
      setColor(sel.color||"#1a1a2e");
      if (sel.type==="text") {
        setFontSize(sel.fs||16);
        setBold(!!sel.bold);
        setItalic(!!sel.italic);
        setUnderline(!!sel.underline);
      }
    }
  }, [selected]);

  const btnTool = id => ({
    padding:"5px 10px",fontSize:11,borderRadius:5,cursor:"pointer",fontWeight:tool===id?700:500,
    background:tool===id?"#04043C":"#f3f4f6",color:tool===id?"#fff":"#374151",
    border:tool===id?"1.5px solid #04043C":"1.5px solid #d1d5db",
  });

  const btnStyle = (active) => ({
    padding:"4px 8px",fontSize:12,borderRadius:4,cursor:"pointer",fontWeight:700,
    background:active?"#04043C":"#f3f4f6",color:active?"#fff":"#374151",
    border:active?"1.5px solid #04043C":"1.5px solid #d1d5db",
  });

  return (
    <div>
      {/* Barre d'outils — outils de dessin */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6,alignItems:"center",padding:"7px 10px",background:"#f8f9fa",border:"1px solid #e5e7eb",borderRadius:"8px 8px 0 0"}}>
        <span style={{fontSize:11,color:"#6b7280",marginRight:2,fontWeight:600}}>Outil :</span>
        {TOOLS.map(t=>(
          <button key={t.id} type="button" style={btnTool(t.id)}
            onClick={()=>{setTool(t.id);if(t.id!=="select")setSelected(null);setTextEdit(null);}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Barre d'outils — apparence */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6,alignItems:"center",padding:"6px 10px",background:"#f0f4f8",border:"1px solid #e5e7eb",borderTop:"none"}}>
        <span style={{fontSize:11,color:"#6b7280",marginRight:2,fontWeight:600}}>Couleur :</span>
        <input type="color" value={color} onChange={e=>applyColorToSelected(e.target.value)}
          style={{width:28,height:24,border:"1px solid #d1d5db",borderRadius:3,padding:1,cursor:"pointer"}}/>

        {/* Taille texte (toujours visible) */}
        <span style={{fontSize:11,color:"#6b7280",marginLeft:6,fontWeight:600}}>Texte :</span>
        <select value={fontSize} onChange={e=>applyTextStyle("fs",Number(e.target.value))}
          style={{fontSize:11,border:"1px solid #d1d5db",borderRadius:4,padding:"2px 4px",cursor:"pointer"}}>
          {[10,12,14,16,18,22,28].map(sz=><option key={sz} value={sz}>{sz}px</option>)}
        </select>
        <button type="button" style={btnStyle(bold)}    onClick={()=>applyTextStyle("bold",    !bold)}>    <b>G</b></button>
        <button type="button" style={btnStyle(italic)}  onClick={()=>applyTextStyle("italic",  !italic)}>  <i>I</i></button>
        <button type="button" style={{...btnStyle(underline),textDecoration:"underline"}} onClick={()=>applyTextStyle("underline",!underline)}>S</button>

        {/* Actions sur la sélection */}
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {selected && <>
            <button type="button" onClick={duplicateSelected}
              style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#e0f2fe",color:"#0369a1",border:"1px solid #7dd3fc",cursor:"pointer"}}>⧉ Copier</button>
            {clipboard && <button type="button" onClick={()=>{
              const id=Date.now(),off=18,s=clipboard;
              let ns={...s,id};
              if(s.type==="rect"||s.type==="text")ns={...ns,x:s.x+off,y:s.y+off};
              if(s.type==="ellipse")ns={...ns,cx:s.cx+off,cy:s.cy+off};
              if(s.type==="arrow")ns={...ns,x0:s.x0+off,y0:s.y0+off,x1:s.x1+off,y1:s.y1+off};
              setShapes(prev=>[...prev,ns]);setSelected(id);
            }} style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#dcfce7",color:"#166534",border:"1px solid #86efac",cursor:"pointer"}}>⧉ Coller</button>}
            {isSelText && <button type="button" onClick={()=>{setTextEdit({id:sel.id,x:sel.x,y:sel.y});setTextVal(sel.text);}}
              style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#f3f4f6",color:"#374151",border:"1px solid #d1d5db",cursor:"pointer"}}>✎ Modifier</button>}
            <button type="button" onClick={deleteSelected}
              style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#fee2e2",color:"#b42318",border:"1px solid #fca5a5",cursor:"pointer",fontWeight:700}}>🗑 Supprimer</button>
          </>}
          {shapes.length>0 && <button type="button" onClick={()=>{if(window.confirm("Effacer tout ?"))setShapes([]);}}
            style={{padding:"3px 8px",fontSize:11,borderRadius:4,background:"#f3f4f6",color:"#6b7280",border:"1px solid #d1d5db",cursor:"pointer"}}>Tout effacer</button>}
        </div>
      </div>

      {/* Aide contextuelle */}
      <div style={{fontSize:11,color:"#9ca3af",marginBottom:4,minHeight:14,paddingLeft:2}}>
        {tool==="select"&&!selected&&"Cliquez pour sélectionner · Glissez pour déplacer · Tirez les poignées pour redimensionner"}
        {tool==="select"&&selected&&"Glissez pour déplacer · Tirez les poignées bleues pour redimensionner · Suppr pour effacer"}
        {(tool==="rect"||tool==="ellipse"||tool==="arrow")&&"Cliquez et glissez pour dessiner la forme"}
        {tool==="text"&&!textEdit&&"Cliquez n'importe où — même sur une forme — pour placer un texte"}
        {tool==="text"&&textEdit&&"Tapez votre texte · Entrée pour valider · Échap pour annuler"}
      </div>

      {/* Canvas SVG */}
      <div style={{position:"relative"}}>
        <svg id="draw-svg" width="100%" height="440"
          style={{display:"block",border:"2px solid #d1d5db",borderRadius:"0 0 8px 8px",background:"#fff",
            cursor:drag||resize?"grabbing":tool==="text"?"text":tool==="select"?"default":"crosshair",
            userSelect:"none",touchAction:"none"}}
          onMouseDown={onSvgDown} onMouseMove={onSvgMove} onMouseUp={onSvgUp}
          onMouseLeave={()=>{if(drag)setDrag(null);if(resize)setResize(null);if(drawing)setDrawing(null);}}>

          <defs>
            <pattern id="g20" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0L0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.6"/>
            </pattern>
            <pattern id="g100" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#g20)"/>
              <path d="M100 0L0 0 0 100" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
            <marker id="ah" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0,9 3.5,0 7" fill={color}/>
            </marker>
            <marker id="pah" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0,9 3.5,0 7" fill={color} opacity="0.5"/>
            </marker>
          </defs>

          <rect width="100%" height="100%" fill="url(#g100)"/>

          {/* ── Passe 1 : formes géométriques (arrière-plan) ── */}
          {shapes.filter(s=>s.type!=="text").map(s=>{
            const isSel=s.id===selected;
            const sc=isSel?"#0284c7":s.color;
            const sw=isSel?2.5:1.8;
            const dd=isSel?"6 3":"none";
            const cur=tool==="text"?"text":tool==="select"?(drag?.id===s.id||resize?.id===s.id?"grabbing":"grab"):"default";
            const sp={"data-shape":s.id,onMouseDown:e=>onShapeDown(e,s),onDoubleClick:e=>onShapeDblClick(e,s),style:{cursor:cur}};

            if (s.type==="rect") return (
              <g key={s.id}>
                <rect {...sp} x={s.x} y={s.y} width={s.w} height={s.h}
                  fill={s.color+"20"} stroke={sc} strokeWidth={sw} strokeDasharray={dd} rx={2}/>
                {isSel&&renderHandles(s)}
              </g>
            );
            if (s.type==="ellipse") return (
              <g key={s.id}>
                <ellipse {...sp} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
                  fill={s.color+"20"} stroke={sc} strokeWidth={sw} strokeDasharray={dd}/>
                {isSel&&renderHandles(s)}
              </g>
            );
            if (s.type==="arrow") return (
              <g key={s.id}>
                <line x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1}
                  stroke="transparent" strokeWidth={14}
                  {...{"data-shape":s.id,onMouseDown:e=>onShapeDown(e,s),style:{cursor:tool==="text"?"text":tool==="select"?"grab":"default"}}}/>
                <line x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1}
                  stroke={sc} strokeWidth={isSel?3:2} strokeDasharray={dd} markerEnd="url(#ah)" style={{pointerEvents:"none"}}/>
                {isSel&&renderHandles(s)}
              </g>
            );
            return null;
          })}

          {/* ── Passe 2 : textes (avant-plan, toujours par-dessus) ── */}
          {shapes.filter(s=>s.type==="text").map(s=>{
            const isSel=s.id===selected;
            const cur=tool==="text"?"text":tool==="select"?(drag?.id===s.id?"grabbing":"grab"):"default";
            const sp={"data-shape":s.id,onMouseDown:e=>onShapeDown(e,s),onDoubleClick:e=>onShapeDblClick(e,s),style:{cursor:cur}};
            return (
              <g key={s.id}>
                {isSel&&<rect x={s.x-4} y={s.y-(s.fs||16)-4}
                  width={Math.max(50,(s.text||"").length*(s.fs||16)*0.56+8)} height={(s.fs||16)+14}
                  fill="#e0f2fe44" stroke="#0284c7" strokeWidth={1.5} strokeDasharray="4 2" rx={3} style={{pointerEvents:"none"}}/>}
                <text {...sp} x={s.x} y={s.y} fill={isSel?"#0284c7":s.color}
                  fontSize={s.fs||16} fontFamily="Arial,sans-serif"
                  fontWeight={s.bold?"bold":"500"} fontStyle={s.italic?"italic":"normal"}
                  textDecoration={s.underline?"underline":"none"}>
                  {s.text}
                </text>
              </g>
            );
          })}

          {preview()}
          <text x="8" y="434" fontSize="11" fill="#c0c4cc" style={{pointerEvents:"none"}}>
            {shapes.length} objet{shapes.length!==1?"s":""}
          </text>
        </svg>

        {/* Overlay saisie texte */}
        {textEdit && (
          <div style={{
            position:"absolute",
            left:Math.min(textEdit.x||40, 400),
            top:Math.max((textEdit.y||40)-fontSize-4, 0),
            zIndex:20,background:"rgba(255,255,255,0.97)",
            border:"2px solid #0284c7",borderRadius:6,padding:"6px 8px",
            boxShadow:"0 4px 16px rgba(0,0,0,0.18)",minWidth:160,
          }} onMouseDown={e=>e.stopPropagation()}>
            <div style={{fontSize:11,color:"#0369a1",marginBottom:4,fontWeight:600}}>
              {textEdit.id?"Modifier le texte":"Nouveau texte"}
            </div>
            <input
              ref={el=>{if(el&&!inputEl){setInputEl(el);el.focus();}}}
              value={textVal}
              onChange={e=>setTextVal(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"){e.preventDefault();commitText();}
                if(e.key==="Escape"){setTextEdit(null);setTextVal("");setInputEl(null);}
                e.stopPropagation();
              }}
              placeholder="Tapez votre texte…"
              style={{
                fontSize:fontSize,fontFamily:"Arial,sans-serif",color:color,
                fontWeight:bold?"bold":"normal",fontStyle:italic?"italic":"normal",
                textDecoration:underline?"underline":"none",
                border:"none",outline:"none",background:"transparent",width:200,display:"block",
              }}
            />
            <div style={{display:"flex",gap:6,marginTop:6,justifyContent:"flex-end"}}>
              <button type="button" onMouseDown={e=>{e.stopPropagation();setTextEdit(null);setTextVal("");setInputEl(null);}}
                style={{fontSize:11,padding:"2px 8px",borderRadius:4,border:"1px solid #d1d5db",background:"#f3f4f6",cursor:"pointer"}}>Annuler</button>
              <button type="button" onMouseDown={e=>{e.stopPropagation();commitText();}}
                style={{fontSize:11,padding:"2px 8px",borderRadius:4,border:"none",background:"#0284c7",color:"#fff",cursor:"pointer",fontWeight:700}}>✓ Placer</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


// ─── Form: Demande de réquisition interne ─────────────────────────────────────
function FormRequisition({ user, onSubmit, onBack, serviceTypes, editMode, initialData }) {
  const today = new Date().toISOString().slice(0, 10);
  const fd = initialData || {};
  const [form, setForm] = useState({
    titre: fd.titre || "", typeService: fd.typeService || "", priorite: fd.priorite || "Normal",
    description: fd.description || "", autreType: fd.autreType || "",
    demandePar: fd.demandePar || user.name, courriel: fd.courriel || user.email,
    dateDemande: fd.dateDemande || today,
    dateRealisation: fd.dateRealisation || "", localConcerne: fd.localConcerne || "",
    drawing: fd.drawing || [],
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.titre.trim()) { setError("Le titre de la demande est obligatoire."); return; }
    if (!form.typeService) { setError("Veuillez sélectionner un type de service."); return; }
    if (form.typeService === "Autres (précisez)" && !form.autreType.trim()) { setError("Veuillez préciser le type de service."); return; }
    if (!form.description.trim()) { setError("La description est obligatoire."); return; }
    if (!form.dateRealisation) { setError("La date de réalisation souhaitée est obligatoire."); return; }
    if (form.dateRealisation < today) { setError("La date de réalisation doit être aujourd'hui ou dans le futur."); return; }
    if (!form.localConcerne.trim()) { setError("Le local concerné est obligatoire."); return; }
    setError("");
    const formDataOut = { ...form, drawing: form.drawing || [], typeServiceFinal: form.typeService === "Autres (précisez)" ? form.autreType : form.typeService };
    if (editMode) {
      onSubmit(formDataOut);
    } else {
      onSubmit({
        type: "requisition",
        title: form.titre.slice(0, 60) || "Demande de réquisition interne",
        formData: formDataOut,
      });
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div style={S.content}>
        <div style={{ ...S.card, textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: "0 0 8px" }}>Demande soumise avec succès!</h2>
          <p style={{ color: COLORS.gris, marginBottom: 24 }}>Votre demande de réquisition interne a été transmise et sera traitée sous peu.</p>
          <button style={S.btnPrimary} onClick={onBack}>Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  const types = serviceTypes && serviceTypes.length > 0 ? serviceTypes : ["Déplacement de mobilier", "Autres (précisez)"];

  return (
    <div style={S.content}>
      <button style={{ ...S.btn, marginBottom: 20 }} onClick={onBack}>← Retour</button>
      <div id="print-zone" style={S.card}>
        <div style={{ background: COLORS.bleu, margin: "-28px -32px 24px", padding: "20px 32px" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>{editMode ? "Modifier la réquisition interne" : "Demande de réquisition interne"}</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{editMode ? "Modifiez les champs souhaités, puis cliquez sur Enregistrer" : "Complétez tous les champs obligatoires (*)"}</p>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") e.preventDefault(); }}>

          {/* ── Ligne 1 : Titre / Type / Priorité ── */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr", gap: "12px 18px", marginBottom: 16 }}>
            <F label="Titre de la demande" required>
              <input style={S.input} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="Ex: Déplacement de bureaux — salle 204" />
            </F>
            <F label="Type de service" required>
              <select style={S.select} value={form.typeService} onChange={(e) => setForm({ ...form, typeService: e.target.value, autreType: "" })}>
                <option value="">Sélectionnez</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {form.typeService === "Autres (précisez)" && (
                <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez le type de service…"
                  value={form.autreType} onChange={(e) => setForm({ ...form, autreType: e.target.value })} />
              )}
            </F>
            <F label="Niveau de priorité" required>
              <select style={S.select} value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })}>
                <option value="Faible">Faible</option>
                <option value="Normal">Normal</option>
                <option value="Élevé">Élevé</option>
              </select>
            </F>
          </div>

          {/* ── Infos demandeur ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 18px", marginBottom: 0 }}>
            <F label="Demandeur / Demandeuse">
              <input style={{ ...S.input, background: "#f3f4f6" }} value={form.demandePar} readOnly />
            </F>
            <F label="Courriel">
              <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={form.courriel + "@csslaval.gouv.qc.ca"} readOnly />
            </F>
            <F label="Date de la demande">
              <input style={{ ...S.input, background: "#f3f4f6" }} value={form.dateDemande} readOnly />
            </F>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px", marginBottom: 16, marginTop: 12 }}>
            <F label="Date de réalisation souhaitée" required>
              <input type="date" style={{ ...S.input, borderColor: form.dateRealisation && form.dateRealisation < today ? COLORS.rouge : undefined }}
                min={today}
                value={form.dateRealisation}
                onChange={(e) => setForm({ ...form, dateRealisation: e.target.value })} />
              {form.dateRealisation && form.dateRealisation < today && (
                <div style={{ color: COLORS.rouge, fontSize: 12, marginTop: 4 }}>⚠ La date doit être aujourd'hui ou dans le futur.</div>
              )}
            </F>
            <F label="Local concerné" required>
              <input style={S.input} value={form.localConcerne}
                onChange={(e) => setForm({ ...form, localConcerne: e.target.value })}
                placeholder="Ex : 1314, amphithéâtre, plateau sportif 4, etc." />
            </F>
          </div>

          {/* ── Description ── */}
          <h3 style={S.sectionTitle}>Description de la demande</h3>
          <F label="Décrivez votre demande en détail" required>
            <textarea style={{ ...S.textarea, minHeight: 100 }} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Expliquez la nature de la demande, le contexte, les ajouts à faire, les retraits à faire, etc." rows={4} />
          </F>

          {/* ── Zone de dessin ── */}
          <h3 style={S.sectionTitle}>Plan ou schéma (optionnel)</h3>
          <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 10 }}>
            Utilisez la zone ci-dessous pour illustrer votre demande : plan de salle, emplacement de mobilier, flèches de déplacement, etc.
          </p>
          <DrawingZone onChange={(shapes) => setForm(prev => ({ ...prev, drawing: shapes }))} />

          {error && <div style={{ ...S.error, marginTop: 16 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button type="submit" style={{ ...S.btnPrimary, background: editMode ? COLORS.vert : COLORS.vert }}>{editMode ? "Enregistrer les modifications" : "Envoyer la demande"}</button>
            {!editMode && <button type="button" style={{ background: "#04043C", color: "#fff", border: "1px solid #04043C", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={() => printZone()}>Imprimer</button>}
            <button type="button" style={{ background: "#23b090", color: "#fff", border: "1px solid #1a8a70", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={() => {
              setForm({ titre: "", typeService: "", priorite: "Normal", description: "", autreType: "", demandePar: user.name, courriel: user.email, dateDemande: today, dateRealisation: "", localConcerne: "" });
              setError("");
            }}>Réinitialiser</button>
            <button type="button" style={{ background: COLORS.rouge, color: "#fff", border: `1px solid ${COLORS.rouge}`, borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={onBack}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─── Formulaire d'édition de demande d'achat ─────────────────────────────────
function FormAchatEdit({ request, user, allUsers, onSave, onBack }) {
  const TAX = 1 + 0.05 + 0.09975;
  const initForm = {
    demandePar: request.formData.demandePar || user.name,
    courriel: request.formData.courriel || user.email,
    dateDemande: request.formData.dateDemande || "",
    dateSouhaitee: request.formData.dateSouhaitee || "",
    matiere: request.formData.matiere || "",
    matiereArts: request.formData.matiereArts || "",
    autreArt: request.formData.autreArt || "",
    autreMatiere: request.formData.autreMatiere || "",
    niveau: request.formData.niveau || "",
    autreNiveau: request.formData.autreNiveau || "",
    directionResponsable: request.formData.directionResponsable || "",
    fournisseurPrincipal: request.formData.fournisseurPrincipal || "",
    natureActivite: request.formData.natureActivite || "",
    achatPersonnel: request.formData.achatPersonnel || "",
    conferencier: request.formData.conferencier || "",
    parascolaire: request.formData.parascolaire || "",
    budgetPassion: request.formData.budgetPassion || "",
  };
  const initRows = request.formData._rows
    ? request.formData._rows.map(r => ({ ...r }))
    : [{ id: 1, qty: "", nom: "", description: "", numero: "", lien: "", prixUnitaire: "", soustotal: "", soustotalEdited: false, sansTaxe: false }];

  const [form, setForm] = useState(initForm);
  const [rows, setRows] = useState(initRows);
  const [error, setError] = useState("");

  function updateRow(idx, field, val) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      if (field === "qty" || field === "prixUnitaire") {
        if (!next[idx].soustotalEdited) {
          const q = parseFloat(next[idx].qty) || 0;
          const p = parseFloat(next[idx].prixUnitaire) || 0;
          next[idx].soustotal = (q * p * TAX).toFixed(2);
        }
      }
      if (field === "soustotal") next[idx].soustotalEdited = true;
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, { id: Date.now(), qty: "", nom: "", description: "", numero: "", lien: "", prixUnitaire: "", soustotal: "", soustotalEdited: false, sansTaxe: false }]);
  }

  const total = rows.reduce((s, r) => s + (parseFloat(r.soustotal) || 0), 0);
  const approb = allUsers.filter((u) => u.roles.includes("A") && !u.roles.includes("D"));

  function handleSave() {
    if (!form.dateSouhaitee || !form.matiere || !form.niveau || !form.directionResponsable || !form.natureActivite) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setError("");
    onSave({ ...form, total: total.toFixed(2) + " $", _rows: rows, _totalNum: total });
  }

  const rowBgEdit = (idx) => idx % 2 === 0 ? "#fff" : "#f5f7f5";

  return (
    <div style={S.content}>
      <button style={{ ...S.btn, marginBottom: 20 }} onClick={onBack}>← Retour sans sauvegarder</button>
      <div style={S.card}>
        <div style={{ background: "#ca8a04", margin: "-28px -32px 24px", padding: "20px 32px" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>Modifier la demande d'achat</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{request.title} · #{request.id}</p>
        </div>

        <h3 style={S.sectionTitle}>Informations générales</h3>
        <div style={S.grid2}>
          <F label="Demandeur / Demandeuse">
            <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={form.demandePar} readOnly />
          </F>
          <F label="Courriel du demandeur" required>
            <input style={{ ...S.input, background: "#f3f4f6", cursor: "not-allowed" }} value={form.courriel + "@csslaval.gouv.qc.ca"} readOnly />
          </F>
          <F label="Date de la demande">
            <input style={{ ...S.input, background: "#f3f4f6" }} value={form.dateDemande} readOnly />
          </F>
          <F label="Date souhaitée pour le traitement" required>
            <input style={S.input} type="date" value={form.dateSouhaitee} onChange={(e) => setForm({ ...form, dateSouhaitee: e.target.value })} />
          </F>
          <F label="Matière" required>
            <select style={S.select} value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })}>
              <option value="">Sélectionnez</option>
              {["Accueil","Adaptation scolaire","Anglais","Arts","Culture et citoyenneté québécoise (CCQ)","Éducation physique","Français","Mathématiques","Science","Univers social / Histoire","Non applicable","Autre"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {form.matiere === "Arts" && (
              <div style={{ marginTop: 6 }}>
                <select style={S.select} value={form.matiereArts} onChange={(e) => setForm({ ...form, matiereArts: e.target.value })}>
                  <option value="">Catégorie arts</option>
                  {["Plastique","Danse","Musique","Dramatique","Autre"].map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                {form.matiereArts === "Autre" && <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez l'art" value={form.autreArt} onChange={(e) => setForm({ ...form, autreArt: e.target.value })} />}
              </div>
            )}
            {form.matiere === "Autre" && <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez la matière" value={form.autreMatiere} onChange={(e) => setForm({ ...form, autreMatiere: e.target.value })} />}
          </F>
          <F label="Niveau" required>
            <select style={S.select} value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })}>
              <option value="">Sélectionnez</option>
              {["Accueil","Année transitoire (AT)","EMS","Pré-DÉP","S1","S2","S3","S4","S5","Soutien à l'apprentissage (SA)","Soutien à l'autonomie et la socialisation (SAS)","Autre","Non applicable"].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {form.niveau === "Autre" && <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez le niveau" value={form.autreNiveau} onChange={(e) => setForm({ ...form, autreNiveau: e.target.value })} />}
          </F>
          <F label="Direction responsable" required>
            <select style={S.select} value={form.directionResponsable} onChange={(e) => setForm({ ...form, directionResponsable: e.target.value })}>
              <option value="">Sélectionnez</option>
              {approb.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </F>
          <F label="Fournisseur principal">
            <input style={S.input} value={form.fournisseurPrincipal} onChange={(e) => setForm({ ...form, fournisseurPrincipal: e.target.value })} />
          </F>
        </div>

        <div style={{ marginTop: 16 }}>
          <F label="Nature de la demande" required>
            <textarea style={S.textarea} value={form.natureActivite} onChange={(e) => setForm({ ...form, natureActivite: e.target.value })} />
          </F>
        </div>

        <div style={{ ...S.grid2, marginTop: 16, gap: "12px 22px" }}>
          {[
            { field: "achatPersonnel", label: "Demande que j'irai acheter par moi-même" },
            { field: "conferencier", label: "Demande en lien avec un conférencier ou une conférencière" },
            { field: "parascolaire", label: "Demande en lien avec une activité parascolaire" },
            { field: "budgetPassion", label: "Demande en lien avec le budget passion" },
          ].map(({ field, label }) => (
            <div key={field} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <label style={{ ...S.label, margin: 0, flex: 1 }}>{label}<span style={{ color: COLORS.rouge }}> *</span></label>
              <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
                {["Oui","Non"].map((opt) => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, cursor: "pointer" }}>
                    <input type="radio" name={field + "_edit"} value={opt} checked={form[field] === opt} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {form.budgetPassion === "Oui" && (
          <div style={{ marginTop: 10, padding: "12px 14px", background: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: 6, color: "#075985", fontSize: 13 }}>
            ℹ️ Il appartient au personnel enseignant de comptabiliser les dépenses de sa passion pour respecter le budget attitré.
          </div>
        )}

        <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>Articles commandés</h3>
        <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 12 }}>Pour retirer un article, mettez la quantité à 0. Vous pouvez ajouter de nouveaux articles.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ ...S.table, fontSize: 12 }}>
            <thead>
              <tr>
                {["#", "Qté", "Nom du produit", "Description sommaire", "N° produit", "Lien Web (optionnel)", "Prix unitaire (sans taxes)", "Sous-total (avec taxes)"].map((h) => (
                  <th key={h} style={{ ...S.th, padding: "6px 6px", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} style={{ background: rowBgEdit(idx) }}>
                  <td style={{ ...S.td, textAlign: "center", fontWeight: 700, background: rowBgEdit(idx) }}>{idx + 1}</td>
                  <td style={{ ...S.td, background: rowBgEdit(idx) }}>
                    <input type="number" min="0" step="1" style={{ ...S.input, padding: "4px 6px", fontSize: 12, background: "#f0f8f4", width: 60 }} value={row.qty} onChange={(e) => updateRow(idx, "qty", e.target.value)} />
                  </td>
                  <td style={{ ...S.td, background: rowBgEdit(idx) }}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, background: "#f0f8f4", minWidth: 100 }} value={row.nom} onChange={(e) => updateRow(idx, "nom", e.target.value)} />
                  </td>
                  <td style={{ ...S.td, background: rowBgEdit(idx) }}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, background: "#f0f8f4", minWidth: 120 }} value={row.description} onChange={(e) => updateRow(idx, "description", e.target.value)} />
                  </td>
                  <td style={{ ...S.td, background: rowBgEdit(idx) }}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, background: "#f0f8f4", width: 80 }} value={row.numero} onChange={(e) => updateRow(idx, "numero", e.target.value)} />
                  </td>
                  <td style={{ ...S.td, background: rowBgEdit(idx) }}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, background: "#f0f8f4", minWidth: 90 }} placeholder="https://..." value={row.lien} onChange={(e) => updateRow(idx, "lien", e.target.value)} />
                  </td>
                  <td style={{ ...S.td, background: rowBgEdit(idx) }}>
                    <div style={{ position: "relative", display: "inline-block", width: 90 }}>
                      <input type="number" min="0" step="0.01" style={{ ...S.input, padding: "4px 22px 4px 6px", fontSize: 12, background: "#f0f8f4", width: "100%", boxSizing: "border-box" }} value={row.prixUnitaire} onChange={(e) => updateRow(idx, "prixUnitaire", e.target.value)} />
                      <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#666", pointerEvents: "none" }}>$</span>
                    </div>
                  </td>
                  <td style={{ ...S.td, background: rowBgEdit(idx) }}>
                    <input style={{ ...S.input, padding: "4px 6px", fontSize: 12, background: "#f0f8f4", width: 90 }} value={row.soustotal} onChange={(e) => updateRow(idx, "soustotal", e.target.value)} placeholder="0.00" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>Total de la commande</td>
                <td style={{ ...S.td, fontWeight: 700 }}>{total.toFixed(2)} $</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button type="button" style={{ ...S.btn, marginTop: 10 }} onClick={addRow}>+ Ajouter une ligne</button>

        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button type="button" style={{ background: "#ca8a04", color: "#fff", border: "1px solid #a16207", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={handleSave}>
            Enregistrer les modifications
          </button>
          <button type="button" style={{ background: COLORS.rouge, color: "#fff", border: `1px solid ${COLORS.rouge}`, borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={onBack}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Formulaire d'édition de demande d'activité/sortie ──────────────────────
function FormActiviteEdit({ request, user, allUsers, onSave, onBack }) {
  const fd = request.formData || {};
  const today = new Date().toISOString().slice(0, 10);

  const initForm = {
    responsables: fd.responsables ? fd.responsables.filter(r => r.nom !== user.name) : [],
    nomActivite: fd["Nom de l'activité"] || fd.nomActivite || "",
    typeActivite: fd["Type"] || fd.typeActivite || "",
    dateDemande: fd.dateDemande || today,
    datesPrevues: fd.datesPrevues || [{ date: "", heureDebut: "09:15", heureFin: "15:40" }],
    description: fd["Description"] || fd.description || "",
    niveauxConcernes: fd.niveauxConcernes || (fd["Niveaux"] ? fd["Niveaux"].split(", ") : []),
    matieresConcernees: fd.matieresConcernees || [],
    autreNiveau: fd.autreNiveau || "",
    autreMatiere: fd.autreMatiere || "",
    groupes: fd["Groupes"] || fd.groupes || "",
    passion: fd.passion || "",
    passionTypes: fd.passionTypes || [],
    passionAutres: fd.passionAutres || "",
    obligatoire: fd.obligatoire || "",
    autresClientele: fd.autresClientele || "",
    coutEleve: fd.coutEleve || "",
    nbEleves: fd.nbEleves || "",
    coutAdulte: fd.coutAdulte || "",
    nbAdultes: fd.nbAdultes || "",
    coutLiberation: fd.coutLiberation || COUT_LIBERATION_DEFAULT,
    nbPeriodes: fd.nbPeriodes || "",
    coutTransport: fd.coutTransport || "",
    autreMontant: fd.autreMontant || "",
    typeTransport: fd.typeTransport || "",
    autreTransport: fd.autreTransport || "",
    nomEtablissement: fd.nomEtablissement || "",
    adresseComplete: fd.adresseComplete || "",
    personneContact: fd.personneContact || "",
    telephone: fd.telephone || "",
    poste: fd.poste || "",
    heureDepart: fd.heureDepart || "",
    heureRetour: fd.heureRetour || "",
  };

  const [form, setForm] = useState(initForm);
  const [error, setError] = useState("");

  function toggleCheck(field, val) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(val) ? prev[field].filter((x) => x !== val) : [...prev[field], val],
    }));
  }

  function calcTotal() {
    const st1 = parseFloat(form.coutEleve || 0) * parseFloat(form.nbEleves || 0);
    const st2 = parseFloat(form.coutAdulte || 0) * parseFloat(form.nbAdultes || 0);
    const st3 = parseFloat(form.coutLiberation || 0) * parseFloat(form.nbPeriodes || 0);
    return (st1 + st2 + st3 + parseFloat(form.coutTransport || 0) + parseFloat(form.autreMontant || 0)).toFixed(2);
  }

  const isSortie = ["Sortie", "Sortie éducative"].includes(form.typeActivite);
  const niveaux = ["Accueil", "Année transitoire (AT)", "EMS", "Pré-DÉP", "S1", "S2", "S3", "S4", "S5", "Soutien à l'apprentissage (SA)", "Soutien à l'autonomie et la socialisation (SAS)", "Autre"];
  const matieres = ["Accueil", "Adaptation scolaire", "Anglais", "Arts", "Culture et citoyenneté québécoise (CCQ)", "Éducation physique", "Français", "Mathématiques", "Science", "Univers social / Histoire", "Non applicable", "Autre"];
  const typesPassion = ["Arts", "Musique", "Sports", "Sciences", "Langues", "Autres"];

  function handleSave() {
    if (!form.nomActivite || !form.typeActivite || form.niveauxConcernes.length === 0) {
      setError("Veuillez remplir les champs obligatoires : nom de l'activité, type et niveaux concernés.");
      return;
    }
    if (isSortie && (!form.typeTransport || !form.nomEtablissement || !form.adresseComplete || !form.personneContact || !form.telephone || !form.heureDepart || !form.heureRetour)) {
      setError("Pour une sortie, veuillez remplir tous les champs obligatoires de la section Transport (type de transport, nom de l'établissement, adresse complète, personne à contacter, téléphone, heure de départ et heure de retour).");
      return;
    }
    setError("");
    onSave({
      ...fd,
      "Nom de l'activité": form.nomActivite,
      "Type": form.typeActivite,
      "Responsable(s)": form.responsables.map((r) => r.nom).join(", "),
      "Description": form.description,
      "Niveaux": form.niveauxConcernes.join(", "),
      "Groupes": form.groupes,
      "Total estimé": calcTotal() + " $",
      dateDemande: form.dateDemande || today,
      responsables: form.responsables,
      nomActivite: form.nomActivite,
      typeActivite: form.typeActivite,
      datesPrevues: form.datesPrevues,
      description: form.description,
      niveauxConcernes: form.niveauxConcernes,
      matieresConcernees: form.matieresConcernees,
      autreNiveau: form.autreNiveau,
      autreMatiere: form.autreMatiere,
      groupes: form.groupes,
      passion: form.passion,
      passionTypes: form.passionTypes,
      passionAutres: form.passionAutres,
      obligatoire: form.obligatoire,
      autresClientele: form.autresClientele,
      coutEleve: form.coutEleve, nbEleves: form.nbEleves,
      coutAdulte: form.coutAdulte, nbAdultes: form.nbAdultes,
      coutLiberation: form.coutLiberation, nbPeriodes: form.nbPeriodes,
      coutTransport: form.coutTransport, autreMontant: form.autreMontant,
      typeTransport: form.typeTransport, autreTransport: form.autreTransport,
      nomEtablissement: form.nomEtablissement, adresseComplete: form.adresseComplete,
      personneContact: form.personneContact, telephone: form.telephone, poste: form.poste,
      heureDepart: form.heureDepart, heureRetour: form.heureRetour,
    });
  }

  const btnSave = { background: "#23b090", color: "#fff", border: "1px solid #1a8a70", borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 };

  return (
    <div style={S.content}>
      <button style={{ ...S.btn, marginBottom: 20 }} onClick={onBack}>← Retour sans sauvegarder</button>
      <div style={S.card}>
        <div style={{ background: "#23b090", margin: "-28px -32px 24px", padding: "20px 32px" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>Modifier la demande d'activité / sortie</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{request.title} · #{request.id}</p>
        </div>

        <h3 style={S.sectionTitle}>Responsable(s)</h3>
        {form.responsables.map((resp, ri) => (
          <div key={ri} style={{ ...S.grid2, marginBottom: 8 }}>
            <F label={ri === 0 ? "Nom du responsable" : "Responsable additionnel"} required={ri === 0}>
              <input style={S.input} value={resp.nom} onChange={(e) => { const n = [...form.responsables]; n[ri] = { ...n[ri], nom: e.target.value }; setForm({ ...form, responsables: n }); }} />
            </F>
            <F label="Courriel">
              <input style={S.input} value={resp.courriel} onChange={(e) => { const n = [...form.responsables]; n[ri] = { ...n[ri], courriel: e.target.value }; setForm({ ...form, responsables: n }); }} />
            </F>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button type="button" style={{ ...S.btn, fontSize: 13 }} onClick={() => setForm({ ...form, responsables: [...form.responsables, { nom: "", courriel: "" }] })}>+ Ajouter responsable</button>
          {form.responsables.length > 1 && <button type="button" style={{ ...S.btnDanger, fontSize: 13 }} onClick={() => setForm({ ...form, responsables: form.responsables.slice(0, -1) })}>- Retirer dernier</button>}
        </div>

        <h3 style={S.sectionTitle}>Détails de l'activité</h3>
        <div style={S.grid2}>
          <F label="Nom de l'activité" required>
            <input style={S.input} value={form.nomActivite} onChange={(e) => setForm({ ...form, nomActivite: e.target.value })} />
          </F>
          <F label="Type d'activité" required>
            <select style={S.select} value={form.typeActivite} onChange={(e) => setForm({ ...form, typeActivite: e.target.value })}>
              <option value="">Sélectionnez</option>
              {["Conférence", "Sortie", "Sortie éducative", "Spectacle", "Atelier", "Compétition sportive", "Activité parascolaire", "Autre"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </F>
        </div>
        <F label="Description de l'activité">
          <textarea style={{ ...S.textarea, minHeight: 80 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </F>

        <h4 style={{ margin: "14px 0 8px", fontSize: 14, color: COLORS.vertFonce }}>Dates prévues</h4>
        {form.datesPrevues.map((d, di) => (
          <div key={di} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
            <F label={di === 0 ? "Date" : ("Date " + (di + 1))}>
              <input type="date" style={S.input} value={d.date} onChange={(e) => { const n = [...form.datesPrevues]; n[di] = { ...n[di], date: e.target.value }; setForm({ ...form, datesPrevues: n }); }} />
            </F>
            <F label="Heure début"><input type="time" style={S.input} value={d.heureDebut} onChange={(e) => { const n = [...form.datesPrevues]; n[di] = { ...n[di], heureDebut: e.target.value }; setForm({ ...form, datesPrevues: n }); }} /></F>
            <F label="Heure fin"><input type="time" style={S.input} value={d.heureFin} onChange={(e) => { const n = [...form.datesPrevues]; n[di] = { ...n[di], heureFin: e.target.value }; setForm({ ...form, datesPrevues: n }); }} /></F>
            {form.datesPrevues.length > 1 && <button type="button" style={{ ...S.btnDanger, padding: "6px 10px", height: 38, alignSelf: "flex-end" }} onClick={() => setForm({ ...form, datesPrevues: form.datesPrevues.filter((_, i) => i !== di) })}>✕</button>}
          </div>
        ))}
        <button type="button" style={{ ...S.btn, fontSize: 13, marginBottom: 16 }} onClick={() => setForm({ ...form, datesPrevues: [...form.datesPrevues, { date: today, heureDebut: "09:15", heureFin: "15:40" }] })}>+ Ajouter une date</button>

        <h3 style={S.sectionTitle}>Clientèle concernée</h3>
        <div style={S.grid2}>
          <F label="Niveaux concernés" required>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {niveaux.map((n) => (<label key={n} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={form.niveauxConcernes.includes(n)} onChange={() => toggleCheck("niveauxConcernes", n)} />{n}</label>))}
            </div>
            {form.niveauxConcernes.includes("Autre") && <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez le niveau" value={form.autreNiveau} onChange={(e) => setForm({ ...form, autreNiveau: e.target.value })} />}
          </F>
          <F label="Matières concernées">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {matieres.map((m) => (<label key={m} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={form.matieresConcernees.includes(m)} onChange={() => toggleCheck("matieresConcernees", m)} />{m}</label>))}
            </div>
            {form.matieresConcernees.includes("Autre") && <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez la matière" value={form.autreMatiere} onChange={(e) => setForm({ ...form, autreMatiere: e.target.value })} />}
          </F>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 22px", marginBottom: 12 }}>
          <F label="Groupes visés">
            <input style={S.input} value={form.groupes} onChange={(e) => setForm({ ...form, groupes: e.target.value })} placeholder="Ex : 301, 302" />
          </F>
          <F label="Passion">
            <select style={S.select} value={form.passion} onChange={(e) => setForm({ ...form, passion: e.target.value, passionTypes: [] })}>
              <option value="">Aucune</option><option value="Oui">Oui</option><option value="Non">Non</option>
            </select>
            {form.passion === "Oui" && (
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {typesPassion.map((tp) => (<label key={tp} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}><input type="checkbox" checked={form.passionTypes.includes(tp)} onChange={() => toggleCheck("passionTypes", tp)} />{tp}</label>))}
                {form.passionTypes.includes("Autres") && <input style={{ ...S.input, marginTop: 4 }} placeholder="Précisez" value={form.passionAutres} onChange={(e) => setForm({ ...form, passionAutres: e.target.value })} />}
              </div>
            )}
          </F>
          <F label="Participation obligatoire">
            <select style={S.select} value={form.obligatoire} onChange={(e) => setForm({ ...form, obligatoire: e.target.value })}>
              <option value="">Sélectionnez</option><option value="Oui">Oui</option><option value="Non">Non</option>
            </select>
          </F>
        </div>
        <F label="Autres clientèles (si applicable)">
          <input style={S.input} value={form.autresClientele} onChange={(e) => setForm({ ...form, autresClientele: e.target.value })} placeholder="Ex : parents, communauté..." />
        </F>

        {isSortie && (
          <>
            <h3 style={S.sectionTitle}>Transport (sortie seulement)</h3>
            <div style={S.grid2}>
              <F label="Type de transport" required>
                <select style={S.select} value={form.typeTransport} onChange={(e) => setForm({ ...form, typeTransport: e.target.value })}>
                  <option value="">Sélectionnez</option>
                  {["Aucun déplacement", "Location d'un autobus scolaire ou de ville", "Transport en commun", "Covoiturage", "Autre"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {form.typeTransport === "Autre" && <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez" value={form.autreTransport} onChange={(e) => setForm({ ...form, autreTransport: e.target.value })} />}
                {form.typeTransport === "Location d'un autobus scolaire ou de ville" && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: 6, color: "#075985", fontSize: 12 }}>ℹ️ Réservation via secrétariat au moins 10 jours ouvrables avant la sortie.</div>
                )}
              </F>
              <F label="Nom de l'établissement visité" required>
                <input style={S.input} value={form.nomEtablissement} onChange={(e) => setForm({ ...form, nomEtablissement: e.target.value })} />
              </F>
            </div>
            <F label="Adresse complète" required><input style={S.input} value={form.adresseComplete} onChange={(e) => setForm({ ...form, adresseComplete: e.target.value })} /></F>
            <div style={S.grid2}>
              <F label="Heure de départ de l'école" required><input type="time" style={S.input} value={form.heureDepart} onChange={(e) => setForm({ ...form, heureDepart: e.target.value })} /></F>
              <F label="Heure de retour à l'école" required><input type="time" style={S.input} value={form.heureRetour} onChange={(e) => setForm({ ...form, heureRetour: e.target.value })} /></F>
              <F label="Personne-contact sur place" required><input style={S.input} value={form.personneContact} onChange={(e) => setForm({ ...form, personneContact: e.target.value })} /></F>
              <F label="Téléphone / Poste" required>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...S.input, flex: 2 }} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                  <input style={{ ...S.input, flex: 1 }} placeholder="Poste" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} />
                </div>
              </F>
            </div>
          </>
        )}

        <h3 style={S.sectionTitle}>Coûts estimés</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ ...S.table, fontSize: 13, minWidth: 500 }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: "40%" }}>Description</th>
                <th style={S.th}>Coût unitaire ($)</th>
                <th style={S.th}>Nombre</th>
                <th style={{ ...S.th, textAlign: "right" }}>Sous-total ($)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Coût par élève", cf: "coutEleve", nf: "nbEleves" },
                { label: "Coût par adulte accompagnateur", cf: "coutAdulte", nf: "nbAdultes" },
                { label: "Coût d'une libération par période", cf: "coutLiberation", nf: "nbPeriodes" },
              ].map(({ label, cf, nf }) => (
                <tr key={cf}>
                  <td style={S.td}>{label}</td>
                  <td style={S.td}><input type="number" min="0" step="0.01" style={{ ...S.input, padding: "3px 6px", fontSize: 12 }} value={form[cf]} onChange={(e) => setForm({ ...form, [cf]: e.target.value })} /></td>
                  <td style={S.td}><input type="number" min="0" step="1" style={{ ...S.input, padding: "3px 6px", fontSize: 12 }} value={form[nf]} onChange={(e) => setForm({ ...form, [nf]: e.target.value })} /></td>
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{(parseFloat(form[cf] || 0) * parseFloat(form[nf] || 0)).toFixed(2)} $</td>
                </tr>
              ))}
              <tr>
                <td style={S.td}>Transport</td>
                <td colSpan={2} style={S.td}><input type="number" min="0" step="0.01" style={{ ...S.input, padding: "3px 6px", fontSize: 12 }} value={form.coutTransport} onChange={(e) => setForm({ ...form, coutTransport: e.target.value })} /></td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{parseFloat(form.coutTransport || 0).toFixed(2)} $</td>
              </tr>
              <tr>
                <td style={S.td}>Autre montant</td>
                <td colSpan={2} style={S.td}><input type="number" min="0" step="0.01" style={{ ...S.input, padding: "3px 6px", fontSize: 12 }} value={form.autreMontant} onChange={(e) => setForm({ ...form, autreMontant: e.target.value })} /></td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{parseFloat(form.autreMontant || 0).toFixed(2)} $</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: "#e8f5ee" }}>
                <td colSpan={3} style={{ ...S.td, textAlign: "right", fontWeight: 700, fontSize: 14 }}>Total estimé</td>
                <td style={{ ...S.td, fontWeight: 700, fontSize: 14, textAlign: "right" }}>{calcTotal()} $</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button type="button" style={btnSave} onClick={handleSave}>Enregistrer les modifications</button>
          <button type="button" style={{ background: COLORS.rouge, color: "#fff", border: "1px solid " + COLORS.rouge, borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={onBack}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

// ─── Helpers: numéro de demande & année scolaire ─────────────────────────────
const TYPE_PREFIX = { achat: "AM", activite: "AS", requisition: "RI" };

function pad3(n) { return String(n).padStart(3, "0"); }

function getSchoolYear(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1-based
  return m >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}



// ─── HistoryView ─────────────────────────────────────────────────────────────
// ─── Export Excel ─────────────────────────────────────────────────────────────
function exportExcel(filtered, filename) {
  var STATUTS = {
    soumise: "Soumise", acceptee: "Approuvée", validee: "Vérifiée",
    commandee: "En commande", traitee: "Traitée / Complétée",
    refusee: "Refusée", annulee: "Annulée",
  };
  var CATS = {
    achat: "Demande d'achat de matériel",
    activite: "Demande d'activité et de sortie",
    requisition: "Demande de réquisition interne",
  };

  var headers = ["Numéro de la demande", "Catégorie", "Titre", "Demandeur", "Approbateur", "Statut", "Prix total"];
  var rows = filtered.map(function(r) {
    // Trouver le nom de l'approbateur dans l'historique
    var approbateur = "";
    if (r.history) {
      var entreeApprobation = r.history.find(function(h) { return h.status === "acceptee"; });
      if (entreeApprobation) approbateur = entreeApprobation.by;
    }
    return [
      r.requestNumber || String(r.id),
      CATS[r.type] || r.type,
      r.title,
      r.authorName,
      approbateur,
      STATUTS[r.status] || r.status,
      getPrixTotal(r),
    ];
  });

  // Générer un fichier HTML-Excel (format XLS) — 100% compatible accents
  function esc(val) {
    return String(val === null || val === undefined ? "" : val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var headerRow = headers.map(function(h) {
    return '<th style="background:#04043C;color:#fff;font-weight:bold;border:1px solid #ccc;padding:6px 10px;">' + esc(h) + '</th>';
  }).join("");

  var dataRows = rows.map(function(row, i) {
    var bg = i % 2 === 0 ? "#ffffff" : "#f5f5f5";
    var cells = row.map(function(cell) {
      return '<td style="border:1px solid #ccc;padding:5px 10px;background:' + bg + ';">' + esc(cell) + '</td>';
    }).join("");
    return "<tr>" + cells + "</tr>";
  }).join("");

  var html = '<?xml version="1.0" encoding="UTF-8"?>'
    + '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
    + '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">'
    + '<head><meta charset="UTF-8"/>'
    + '<xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>'
    + '<x:Name>Demandes DLC</x:Name>'
    + '<x:WorksheetOptions><x:Selected/></x:WorksheetOptions>'
    + '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>'
    + '</head><body>'
    + '<table border="1">'
    + '<thead><tr>' + headerRow + '</tr></thead>'
    + '<tbody>' + dataRows + '</tbody>'
    + '</table></body></html>';

  var blob = new Blob([html], { type: "application/vnd.ms-excel;charset=UTF-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename + ".xls";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function getPrixTotal(r) {
  if (r.type === "requisition") return "N/A";
  if (r.formData && r.formData.total) return r.formData.total;
  if (r.formData && r.formData["Total estimé"]) return r.formData["Total estimé"];
  if (r.formData && r.formData._totalNum) return parseFloat(r.formData._totalNum).toFixed(2) + " $";
  return "—";
}

function HistoryView({ user, requests, setView, setSelectedRequest }) {
  const isAdmin = user.roles.includes("D");

  // Mes demandes (auteur)
  var mesDemandes = isAdmin
    ? requests
    : requests.filter(function(r) { return r.authorId === user.id; });

  // Demandes sur lesquelles j'ai agi (rôles uniquement)
  var hasRoles = user.roles.filter(function(r) { return r !== "D"; }).length > 0 || isAdmin;
  var agis = isAdmin
    ? requests
    : requests.filter(function(r) {
        var actedOn = r.history && r.history.some(function(h) { return h.by === user.name; });
        var inQueue = (user.roles.includes("A") && ["soumise"].includes(r.status) && ["achat","activite"].includes(r.type))
          || (user.roles.includes("B") && r.status === "acceptee")
          || (user.roles.includes("C1") && r.status === "validee" && ["achat","activite"].includes(r.type))
          || (user.roles.includes("C2") && ["validee","commandee"].includes(r.status) && r.type === "achat")
          || (user.roles.includes("C3") && r.status === "validee" && r.type === "requisition");
        return (actedOn || inQueue) && r.authorId !== user.id;
      });

  var [histTab, setHistTab] = useState("mes");
  var allVisible = histTab === "mes" ? mesDemandes : agis;

  // Années scolaires disponibles
  var yearsSet = {};
  allVisible.forEach(function(r) { yearsSet[getSchoolYear(r.date)] = true; });
  var allYears = Object.keys(yearsSet).sort().reverse();

  // Année par défaut = celle avec le plus de demandes
  var yearCounts = {};
  allVisible.forEach(function(r) {
    var y = getSchoolYear(r.date);
    yearCounts[y] = (yearCounts[y] || 0) + 1;
  });
  var bestYear = allYears[0] || getSchoolYear(new Date().toISOString().slice(0, 10));
  if (Object.keys(yearCounts).length > 0) {
    bestYear = Object.keys(yearCounts).sort(function(a, b) { return yearCounts[b] - yearCounts[a]; })[0];
  }

  var [selectedYear, setSelectedYear] = useState(bestYear);
  var [selectedType, setSelectedType] = useState("all");
  var [selectedStatus, setSelectedStatus] = useState("all");
  var [search, setSearch] = useState("");

  // Filtrer
  var t = search.toLowerCase();
  var filtered = allVisible.filter(function(r) {
    var yearOk = selectedYear === "all" || getSchoolYear(r.date) === selectedYear;
    var typeOk = selectedType === "all" || r.type === selectedType;
    var statusOk = selectedStatus === "all" || r.status === selectedStatus;
    var searchOk = !t ||
      (r.requestNumber || "").toLowerCase().includes(t) ||
      r.title.toLowerCase().includes(t) ||
      r.authorName.toLowerCase().includes(t);
    return yearOk && typeOk && statusOk && searchOk;
  }).sort(function(a, b) { return b.date.localeCompare(a.date); });

  // Compteurs sur toutes les demandes visibles (pas juste le filtre)
  var nbEnCours = allVisible.filter(function(r) { return ["soumise","acceptee","validee"].includes(r.status); }).length;
  var nbTraitees = allVisible.filter(function(r) { return r.status === "traitee"; }).length;
  var nbRefusees = allVisible.filter(function(r) { return ["refusee","annulee"].includes(r.status); }).length;

  return (
    <div style={S.content}>
      <button style={{ ...S.btn, marginBottom: 20 }} onClick={() => setView("dashboard")}>← Retour</button>
      <div style={S.card}>

        {/* En-tête */}
        <div style={{ background: COLORS.bleu, margin: "-28px -32px 24px", padding: "20px 32px" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>
            📋 {isAdmin ? "Toutes les demandes du système" : "Historique des demandes"}
          </h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            {isAdmin
              ? "Vue administrateur — toutes les demandes, tous statuts"
              : "Vos demandes et celles sur lesquelles vous avez agi"}
          </p>
        </div>

        {/* Compteurs rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total", value: allVisible.length, color: COLORS.bleu },
            { label: "En cours", value: nbEnCours, color: "#0284c7" },
            { label: "Traitées", value: nbTraitees, color: COLORS.vert },
            { label: "Refusées / Annulées", value: nbRefusees, color: COLORS.rouge },
          ].map(function(s) { return (
            <div key={s.label} style={{ background: COLORS.fond, border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: COLORS.gris, marginTop: 2 }}>{s.label}</div>
            </div>
          ); })}
        </div>

        {/* Filtres */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end", padding: "14px 16px", background: COLORS.fond, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div>
            <label style={S.label}>Année scolaire</label>
            <select style={{ ...S.select, minWidth: 150 }} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">Toutes les années</option>
              {allYears.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
            </select>
          </div>
          <div>
            <label style={S.label}>Catégorie</label>
            <select style={{ ...S.select, minWidth: 200 }} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="all">Toutes</option>
              {Object.entries(REQUEST_TYPES).map(function([k, v]) { return <option key={k} value={k}>{v}</option>; })}
            </select>
          </div>
          <div>
            <label style={S.label}>Statut</label>
            <select style={{ ...S.select, minWidth: 150 }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="all">Tous</option>
              {Object.entries(STATUSES).map(function([k, v]) { return <option key={k} value={k}>{v.label}</option>; })}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={S.label}>Recherche</label>
            <input style={S.input} placeholder="Nº, titre, demandeur…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {(selectedYear !== bestYear || selectedType !== "all" || selectedStatus !== "all" || search !== "") && (
            <button style={{ ...S.btn, fontSize: 12, padding: "6px 12px", alignSelf: "flex-end" }}
              onClick={() => { setSelectedYear(bestYear); setSelectedType("all"); setSelectedStatus("all"); setSearch(""); }}>
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {/* Résultat + bouton export */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, color: COLORS.gris }}>
            {filtered.length} demande{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}
            {selectedYear !== "all" ? " · " + selectedYear : " · toutes années"}
            {selectedType !== "all" ? " · " + REQUEST_TYPES[selectedType] : ""}
            {selectedStatus !== "all" && STATUSES[selectedStatus] ? " · " + STATUSES[selectedStatus].label : ""}
          </div>
          {filtered.length > 0 && (
            <button
              onClick={() => {
                var dateStr = new Date().toISOString().slice(0, 10);
                var typeLabel = selectedType !== "all" ? "_" + selectedType : "_toutes";
                var yearLabel = selectedYear !== "all" ? "_" + selectedYear : "";
                exportExcel(filtered, "DLC_demandes" + typeLabel + yearLabel + "_" + dateStr);
              }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              <span style={{ fontSize: 16 }}>📊</span> Exporter vers Excel ({filtered.length})
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ color: COLORS.gris, fontSize: 14, margin: "0 0 12px" }}>Aucune demande pour cette sélection.</p>
            <button style={S.btn} onClick={() => { setSelectedYear("all"); setSelectedType("all"); setSelectedStatus("all"); setSearch(""); }}>
              Voir toutes les demandes
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Nº demande", "Catégorie", "Titre", "Demandeur", "Date", "Statut", "Approbateur", "Prix total", ""].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  var st = STATUSES[r.status] || { label: r.status, color: COLORS.gris };
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap", color: COLORS.gris }}>{r.requestNumber || String(r.id)}</td>
                      <td style={{ ...S.td, fontSize: 11 }}>{REQUEST_TYPES[r.type] || r.type}</td>
                      <td style={S.td}><strong>{r.title}</strong></td>
                      <td style={{ ...S.td, fontSize: 13 }}>{r.authorName}</td>
                      <td style={{ ...S.td, whiteSpace: "nowrap", fontSize: 13 }}>{r.date}</td>
                      <td style={S.td}><span style={S.badge(st.color)}>{st.label}</span></td>
                      <td style={{ ...S.td, fontSize: 12, color: COLORS.gris }}>
                        {r.history ? (() => { const h = r.history.find(h => h.status === "acceptee"); return h ? h.by : "—"; })() : "—"}
                      </td>
                      <td style={{ ...S.td, fontWeight: 600, whiteSpace: "nowrap", color: r.type === "requisition" ? COLORS.gris : COLORS.bleu }}>
                        {getPrixTotal(r)}
                      </td>
                      <td style={S.td}>
                        <button style={{ ...S.btn, padding: "4px 12px", fontSize: 12 }}
                          onClick={() => { setSelectedRequest(r); setView("detail"); }}>
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


export default function App() {
  // useEffect print style retiré — impression via printZone()
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState(USERS);
  const [view, setView] = useState("dashboard");
  const [prevView, setPrevView] = useState("dashboard");
  const [serviceTypes, setServiceTypes] = useState(["Déplacement de mobilier", "Autres (précisez)"]);
  const [activeForms, setActiveForms] = useState({ achat: true, activite: true, requisition: true });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editContext, setEditContext] = useState(null); // { request, nextStatus, comment }
  const [requests, setRequests] = useState([

    // ══ DEMANDES D'ACHAT (AM) ════════════════════════════════════════════

    // Mario Dumont → Jean Martin — soumise
    { id: 2001, requestNumber: "AM-2026-06-20-001", type: "achat",
      title: "Matériel arts plastiques — S2",
      authorId: 1, authorName: "Mario Dumont", date: "2026-06-20", status: "soumise",
      history: [{ status: "soumise", by: "Mario Dumont", date: "2026-06-20", comment: "" }],
      formData: { demandePar: "Mario Dumont", courriel: "mdupont@csslaval.gouv.qc.ca", dateDemande: "2026-06-20", dateSouhaitee: "2026-09-01",
        matiere: "Arts", matiereArts: "Plastique", autreArt: "", autreMatiere: "", niveau: "S2", autreNiveau: "",
        directionResponsable: "Jean Martin", fournisseurPrincipal: "Dessercom",
        natureActivite: "Réapprovisionnement du matériel d'arts plastiques pour la rentrée 2026-2027.",
        achatPersonnel: "Non", conferencier: "Non", parascolaire: "Non", budgetPassion: "Non",
        total: "348.49 $", _totalNum: 348.49,
        _rows: [
          { id:1, qty:"20", nom:"Pinceaux assortis (set)", description:"Soies naturelles, tailles 2-12", numero:"PIN-ASS", lien:"", prixUnitaire:"3.49", soustotal:"69.80", sansTaxe:false },
          { id:2, qty:"12", nom:"Peinture acrylique 500mL", description:"Couleurs primaires et secondaires", numero:"ACR-500", lien:"", prixUnitaire:"8.99", soustotal:"107.88", sansTaxe:false },
          { id:3, qty:"5",  nom:"Papier aquarelle A2 (bloc 20f)", description:"300g/m²", numero:"PAQ-A2", lien:"", prixUnitaire:"12.99", soustotal:"64.95", sansTaxe:false },
          { id:4, qty:"4",  nom:"Colle blanche 1L", description:"", numero:"CB-1L", lien:"", prixUnitaire:"6.49", soustotal:"25.96", sansTaxe:false },
          { id:5, qty:"10", nom:"Carton entoilé 50×65cm", description:"Grain fin", numero:"CEN-5065", lien:"", prixUnitaire:"7.99", soustotal:"79.90", sansTaxe:false },
        ] } },

    // Jean Martin → Jean Martin — acceptée (auto-approuvée), attend vérificateur
    { id: 2002, requestNumber: "AM-2026-06-10-001", type: "achat",
      title: "Calculatrices TI-30 — Mathématiques S3/S4",
      authorId: 2, authorName: "Jean Martin", date: "2026-06-10", status: "acceptee",
      history: [
        { status: "soumise",  by: "Jean Martin", date: "2026-06-10", comment: "" },
        { status: "acceptee", by: "Jean Martin", date: "2026-06-11", comment: "Approuvé — remplacement avant les examens de fin d'année." },
      ],
      formData: { demandePar: "Jean Martin", courriel: "jmartin@csslaval.gouv.qc.ca", dateDemande: "2026-06-10", dateSouhaitee: "2026-08-25",
        matiere: "Mathématiques", matiereArts: "", autreArt: "", autreMatiere: "", niveau: "S3", autreNiveau: "",
        directionResponsable: "Jean Martin", fournisseurPrincipal: "Bureau en Gros",
        natureActivite: "Remplacement des calculatrices défectueuses — 3 classes de mathématiques S3/S4.",
        achatPersonnel: "Non", conferencier: "Non", parascolaire: "Non", budgetPassion: "Non",
        total: "755.55 $", _totalNum: 755.55,
        _rows: [
          { id:1, qty:"28", nom:"Calculatrice TI-30X IIS", description:"Scientifique approuvée ministère", numero:"TI30XIIS", lien:"", prixUnitaire:"24.99", soustotal:"699.72", sansTaxe:false },
          { id:2, qty:"4",  nom:"Piles AAA (paquet 4)", description:"Longue durée", numero:"PAA-4", lien:"", prixUnitaire:"5.99", soustotal:"23.96", sansTaxe:false },
          { id:3, qty:"1",  nom:"Rangement calculatrices (30 cases)", description:"Cadenas inclus", numero:"RNG-30", lien:"", prixUnitaire:"31.87", soustotal:"31.87", sansTaxe:false },
        ] } },

    // Sophie Bernard → Pierre Lefebvre — vérifiée → secrétaire Luc Tremblay
    { id: 2003, requestNumber: "AM-2026-05-25-001", type: "achat",
      title: "Matériel de sciences — Chimie S5",
      authorId: 3, authorName: "Sophie Bernard", date: "2026-05-25", status: "validee",
      history: [
        { status: "soumise",  by: "Sophie Bernard",  date: "2026-05-25", comment: "" },
        { status: "acceptee", by: "Pierre Lefebvre", date: "2026-05-27", comment: "Approuvé — budget sciences disponible." },
        { status: "validee",  by: "Sophie Bernard",  date: "2026-05-29", comment: "Vérifiée — Lab-Pro confirme disponibilité pour août." },
      ],
      formData: { demandePar: "Sophie Bernard", courriel: "sbernard@csslaval.gouv.qc.ca", dateDemande: "2026-05-25", dateSouhaitee: "2026-08-20",
        matiere: "Science", matiereArts: "", autreArt: "", autreMatiere: "", niveau: "S5", autreNiveau: "",
        directionResponsable: "Pierre Lefebvre", fournisseurPrincipal: "Lab-Pro",
        natureActivite: "Réapprovisionnement des consommables pour les laboratoires de chimie organique — S5.",
        achatPersonnel: "Non", conferencier: "Non", parascolaire: "Non", budgetPassion: "Non",
        total: "612.80 $", _totalNum: 612.80,
        _rows: [
          { id:1, qty:"25", nom:"Lunettes de sécurité anti-buée", description:"Conformes ANSI Z87.1", numero:"LS-01", lien:"", prixUnitaire:"5.99", soustotal:"149.75", sansTaxe:false, commande:false, recu:false },
          { id:2, qty:"4",  nom:"Brûleur Bunsen gaz naturel", description:"Avec robinet d'arrêt", numero:"BB-GN", lien:"", prixUnitaire:"24.99", soustotal:"99.96", sansTaxe:false, commande:false, recu:false },
          { id:3, qty:"20", nom:"Béchers 250mL borosilicate", description:"Gradués, résistants à la chaleur", numero:"BC-250B", lien:"", prixUnitaire:"8.99", soustotal:"179.80", sansTaxe:false, commande:false, recu:false },
          { id:4, qty:"3",  nom:"Kit réactifs chimie organique", description:"Solutions acide/base 500mL", numero:"KRCO-3", lien:"", prixUnitaire:"61.10", soustotal:"183.30", sansTaxe:false, commande:false, recu:false },
        ] } },

    // Mario Dumont → Jean Martin — en commande
    { id: 2004, requestNumber: "AM-2026-05-08-001", type: "achat",
      title: "Romans lecture obligatoire — Français S3",
      authorId: 1, authorName: "Mario Dumont", date: "2026-05-08", status: "commandee",
      history: [
        { status: "soumise",   by: "Mario Dumont",   date: "2026-05-08", comment: "" },
        { status: "acceptee",  by: "Jean Martin",    date: "2026-05-09", comment: "Approuvé." },
        { status: "validee",   by: "Sophie Bernard", date: "2026-05-12", comment: "Vérifiée — Renaud-Bray confirme stock disponible." },
        { status: "commandee", by: "Luc Tremblay",   date: "2026-05-15", comment: "Commandes passées — livraison estimée fin juin." },
      ],
      formData: { demandePar: "Mario Dumont", courriel: "mdupont@csslaval.gouv.qc.ca", dateDemande: "2026-05-08", dateSouhaitee: "2026-06-25",
        matiere: "Français", matiereArts: "", autreArt: "", autreMatiere: "", niveau: "S3", autreNiveau: "",
        directionResponsable: "Jean Martin", fournisseurPrincipal: "Renaud-Bray",
        natureActivite: "Romans pour les lectures obligatoires de fin d'année — 2 groupes de français S3.",
        achatPersonnel: "Non", conferencier: "Non", parascolaire: "Non", budgetPassion: "Non",
        total: "783.68 $", _totalNum: 783.68,
        _rows: [
          { id:1, qty:"32", nom:"Le Survenant — Germaine Guèvremont", description:"Édition scolaire annotée", numero:"GG-LS", lien:"", prixUnitaire:"11.50", soustotal:"368.00", sansTaxe:true, commande:true, recu:false },
          { id:2, qty:"32", nom:"Bonheur d'occasion — Gabrielle Roy", description:"Édition scolaire", numero:"GR-BO", lien:"", prixUnitaire:"12.99", soustotal:"415.68", sansTaxe:true, commande:false, recu:false },
        ] } },

    // Luc Tremblay → Pierre Lefebvre — traitée (cycle complet)
    { id: 2005, requestNumber: "AM-2026-04-01-001", type: "achat",
      title: "Équipement éducation physique — Gymnase",
      authorId: 4, authorName: "Luc Tremblay", date: "2026-04-01", status: "traitee",
      history: [
        { status: "soumise",   by: "Luc Tremblay",    date: "2026-04-01", comment: "" },
        { status: "acceptee",  by: "Pierre Lefebvre", date: "2026-04-03", comment: "Approuvé — budget disponible pour le gymnase." },
        { status: "validee",   by: "Sophie Bernard",  date: "2026-04-05", comment: "Vérifiée — Sport Expert confirme disponibilité." },
        { status: "commandee", by: "Luc Tremblay",    date: "2026-04-08", comment: "Commande passée chez Sport Expert." },
        { status: "traitee",   by: "Paula Gagnon",    date: "2026-04-20", comment: "Tout reçu et vérifié — matériel distribué au gymnase." },
      ],
      formData: { demandePar: "Luc Tremblay", courriel: "ltremblay@csslaval.gouv.qc.ca", dateDemande: "2026-04-01", dateSouhaitee: "2026-04-25",
        matiere: "Éducation physique", matiereArts: "", autreArt: "", autreMatiere: "", niveau: "Non applicable", autreNiveau: "",
        directionResponsable: "Pierre Lefebvre", fournisseurPrincipal: "Sport Expert",
        natureActivite: "Renouvellement du matériel sportif pour les cours d'éducation physique — tous niveaux.",
        achatPersonnel: "Non", conferencier: "Non", parascolaire: "Non", budgetPassion: "Non",
        total: "573.44 $", _totalNum: 573.44,
        _rows: [
          { id:1, qty:"15", nom:"Ballon de basketball taille 7", description:"Intérieur, norme officielle", numero:"BB-T7", lien:"", prixUnitaire:"18.99", soustotal:"284.85", sansTaxe:false, commande:true, recu:true },
          { id:2, qty:"6",  nom:"Filet de badminton double", description:"Poteaux inclus", numero:"FBD-6", lien:"", prixUnitaire:"29.99", soustotal:"179.94", sansTaxe:false, commande:true, recu:true },
          { id:3, qty:"30", nom:"Cônes de signalisation 30cm", description:"Assortis, résistants", numero:"CO-30", lien:"", prixUnitaire:"0.99", soustotal:"29.70", sansTaxe:false, commande:true, recu:true },
          { id:4, qty:"5",  nom:"Sac de rangement en filet (grand)", description:"", numero:"SRF-G", lien:"", prixUnitaire:"15.79", soustotal:"78.95", sansTaxe:false, commande:true, recu:true },
        ] } },

    // Paula Gagnon — annulée par l'auteure avant approbation
    { id: 2006, requestNumber: "AM-2026-06-12-001", type: "achat",
      title: "Matériel de robotique — Technologie S3/S4",
      authorId: 6, authorName: "Paula Gagnon", date: "2026-06-12", status: "annulee",
      history: [
        { status: "soumise", by: "Paula Gagnon", date: "2026-06-12", comment: "" },
        { status: "annulee", by: "Paula Gagnon", date: "2026-06-13", comment: "Annulée — la direction confirme que du matériel disponible en entrepôt peut être réutilisé." },
      ],
      formData: { demandePar: "Paula Gagnon", courriel: "pgagnon@csslaval.gouv.qc.ca", dateDemande: "2026-06-12", dateSouhaitee: "2026-09-05",
        matiere: "Science", matiereArts: "", autreArt: "", autreMatiere: "Technologie / Robotique", niveau: "S3", autreNiveau: "",
        directionResponsable: "Pierre Lefebvre", fournisseurPrincipal: "RobotShop",
        natureActivite: "Achat de kits de robotique pour le nouveau cours de programmation S3/S4 — rentrée 2026-2027.",
        achatPersonnel: "Non", conferencier: "Non", parascolaire: "Non", budgetPassion: "Non",
        total: "1 199.70 $", _totalNum: 1199.70,
        _rows: [
          { id:1, qty:"10", nom:"Raspberry Pi 4 Model B (4GB)", description:"Mini-ordinateur programmable", numero:"RPi4-4G", lien:"", prixUnitaire:"79.99", soustotal:"799.90", sansTaxe:false },
          { id:2, qty:"10", nom:"Câble HDMI 1.5m", description:"", numero:"HDMI-15", lien:"", prixUnitaire:"4.99", soustotal:"49.90", sansTaxe:false },
          { id:3, qty:"10", nom:"Clavier compact USB (FR-CA)", description:"Compact, résistant", numero:"CLAV-FR", lien:"", prixUnitaire:"19.99", soustotal:"199.90", sansTaxe:false },
          { id:4, qty:"10", nom:"Boîtier plastique pour Raspberry Pi 4", description:"", numero:"BOI-RPi4", lien:"", prixUnitaire:"15.00", soustotal:"150.00", sansTaxe:false },
        ] } },

    // ══ DEMANDES D'ACTIVITÉS ET DE SORTIES (AS) ══════════════════════

    // Mario Dumont → Jean Martin — soumise — Sortie Biodôme (datesPrevues: 2026-07-09)
    { id: 2007, requestNumber: "AS-2026-06-20-001", type: "activite",
      title: "Sortie Biodôme de Montréal — Sciences S3",
      authorId: 1, authorName: "Mario Dumont", date: "2026-06-20", status: "soumise",
      history: [{ status: "soumise", by: "Mario Dumont", date: "2026-06-20", comment: "" }],
      formData: { "Nom de l'activité": "Sortie Biodôme — Sciences S3", "Type": "Sortie éducative",
        responsables: [], nomActivite: "Sortie Biodôme de Montréal — Sciences S3", typeActivite: "Sortie éducative",
        dateDemande: "2026-06-20", datesPrevues: [{ date: "2026-07-09", heureDebut: "09:00", heureFin: "15:30" }],
        description: "Visite guidée du Biodôme pour les groupes S3 : zones climatiques, biodiversité, faune laurentienne.", niveauxConcernes: ["S3"], matieresConcernees: ["Science"], groupes: "301, 302, 303",
        directionResponsable: "Jean Martin",
        passion: "Non", passionTypes: [], passionAutres: "", obligatoire: "Non", autresClientele: "",
        coutEleve: "15.00", nbEleves: "72", coutAdulte: "0", nbAdultes: "4",
        coutLiberation: "233.34", nbPeriodes: "0", coutTransport: "260.00", autreMontant: "0",
        typeTransport: "Location d'un autobus scolaire ou de ville", autreTransport: "",
        nomEtablissement: "Biodôme de Montréal", adresseComplete: "4777 Av. Pierre-De Coubertin, Montréal, QC H1V 1B3",
        personneContact: "Service éducatif — Biodôme", telephone: "(514) 868-3000", poste: "", heureDepart: "08:30", heureRetour: "16:30" } },

    // Sophie Bernard → Pierre Lefebvre — acceptée — Sortie Vieux-Montréal, passion Oui (datesPrevues: 2026-07-22)
    { id: 2008, requestNumber: "AS-2026-06-03-001", type: "activite",
      title: "Sortie Vieux-Montréal — Histoire S4",
      authorId: 3, authorName: "Sophie Bernard", date: "2026-06-03", status: "acceptee",
      history: [
        { status: "soumise",  by: "Sophie Bernard",  date: "2026-06-03", comment: "" },
        { status: "acceptee", by: "Pierre Lefebvre", date: "2026-06-05", comment: "Approuvé — excellente activité dans le cadre du programme Passion Histoire." },
      ],
      formData: { "Nom de l'activité": "Sortie Vieux-Montréal — Histoire S4", "Type": "Sortie éducative",
        responsables: [{ userId: 2, nom: "Jean Martin", courriel: "jmartin" }], nomActivite: "Sortie Vieux-Montréal — Histoire S4", typeActivite: "Sortie éducative",
        dateDemande: "2026-06-03", datesPrevues: [{ date: "2026-07-22", heureDebut: "09:00", heureFin: "16:00" }],
        description: "Circuit pédestre guidé dans le Vieux-Montréal : Place d'Armes, Vieux-Port, Château Ramezay.", niveauxConcernes: ["S4"], matieresConcernees: ["Univers social / Histoire"], groupes: "401, 402",
        directionResponsable: "Pierre Lefebvre",
        passion: "Oui", passionTypes: ["Autres"], passionAutres: "Culture et patrimoine québécois", obligatoire: "Non", autresClientele: "",
        coutEleve: "0", nbEleves: "55", coutAdulte: "0", nbAdultes: "3",
        coutLiberation: "233.34", nbPeriodes: "0", coutTransport: "0", autreMontant: "0",
        typeTransport: "Transport en commun", autreTransport: "",
        nomEtablissement: "Vieux-Montréal — Place Jacques-Cartier", adresseComplete: "Place Jacques-Cartier, Montréal, QC H2Y 1B6",
        personneContact: "Office du tourisme de Montréal", telephone: "(514) 873-2015", poste: "", heureDepart: "08:15", heureRetour: "17:00" } },

    // Pierre Lefebvre → Pierre Lefebvre — vérifiée — Sortie Planétarium (datesPrevues: 2026-06-30)
    { id: 2009, requestNumber: "AS-2026-05-15-001", type: "activite",
      title: "Sortie Planétarium — Sciences S1/S2",
      authorId: 8, authorName: "Pierre Lefebvre", date: "2026-05-15", status: "validee",
      history: [
        { status: "soumise",  by: "Pierre Lefebvre", date: "2026-05-15", comment: "" },
        { status: "acceptee", by: "Pierre Lefebvre", date: "2026-05-16", comment: "Approuvé." },
        { status: "validee",  by: "Sophie Bernard",  date: "2026-05-20", comment: "Vérifiée — transport réservé, billets confirmés." },
      ],
      formData: { "Nom de l'activité": "Sortie Planétarium — Sciences S1/S2", "Type": "Sortie éducative",
        responsables: [], nomActivite: "Sortie Planétarium — Sciences S1/S2", typeActivite: "Sortie éducative",
        dateDemande: "2026-05-15", datesPrevues: [{ date: "2026-06-30", heureDebut: "09:00", heureFin: "15:00" }],
        description: "Séance de planétarium (Les Étoiles) + exposition Espace pour les groupes S1/S2.", niveauxConcernes: ["S1","S2"], matieresConcernees: ["Science","Mathématiques"], groupes: "101, 102, 201, 202",
        directionResponsable: "Pierre Lefebvre",
        passion: "Non", passionTypes: [], passionAutres: "", obligatoire: "Non", autresClientele: "",
        coutEleve: "14.50", nbEleves: "84", coutAdulte: "0", nbAdultes: "5",
        coutLiberation: "233.34", nbPeriodes: "0", coutTransport: "290.00", autreMontant: "0",
        typeTransport: "Location d'un autobus scolaire ou de ville", autreTransport: "",
        nomEtablissement: "Planétarium Rio Tinto Alcan", adresseComplete: "4801 Av. Pierre-De Coubertin, Montréal, QC H1V 1B3",
        personneContact: "Service aux groupes scolaires", telephone: "(514) 868-3000", poste: "4", heureDepart: "08:45", heureRetour: "15:45" } },

    // Luc Tremblay → Jean Martin — traitée — Conférence orientation (non-sortie, pas de transport)
    { id: 2010, requestNumber: "AS-2026-04-10-001", type: "activite",
      title: "Conférence orientation scolaire — S5",
      authorId: 4, authorName: "Luc Tremblay", date: "2026-04-10", status: "traitee",
      history: [
        { status: "soumise",  by: "Luc Tremblay",   date: "2026-04-10", comment: "" },
        { status: "acceptee", by: "Jean Martin",    date: "2026-04-11", comment: "Approuvé — très pertinent en période d'orientation." },
        { status: "validee",  by: "Sophie Bernard", date: "2026-04-13", comment: "Vérifiée." },
        { status: "traitee",  by: "Luc Tremblay",   date: "2026-05-14", comment: "Conférence complétée — excellent taux de participation (52/54 élèves)." },
      ],
      formData: { "Nom de l'activité": "Conférence orientation scolaire", "Type": "Conférence",
        responsables: [], nomActivite: "Conférence orientation scolaire — S5", typeActivite: "Conférence",
        dateDemande: "2026-04-10", datesPrevues: [{ date: "2026-05-14", heureDebut: "13:00", heureFin: "15:30" }],
        description: "Me Isabelle Fortier (avocate) et M. Carlos Pereira (ingénieur) présentent leurs parcours aux finissants de S5.", niveauxConcernes: ["S5"], matieresConcernees: ["Non applicable"], groupes: "501, 502",
        directionResponsable: "Jean Martin",
        passion: "Non", passionTypes: [], passionAutres: "", obligatoire: "Non", autresClientele: "",
        coutEleve: "0", nbEleves: "54", coutAdulte: "0", nbAdultes: "0",
        coutLiberation: "233.34", nbPeriodes: "2", coutTransport: "0", autreMontant: "0",
        typeTransport: "Non applicable", autreTransport: "",
        nomEtablissement: "École — Salle multifonctionnelle", adresseComplete: "",
        personneContact: "Me Isabelle Fortier", telephone: "(450) 555-0143", poste: "", heureDepart: "", heureRetour: "" } },

    // ══ DEMANDES DE RÉQUISITION INTERNE (RI) ═════════════════════════

    // Mario Dumont — envoyée au vérificateur (acceptee)
    { id: 2011, requestNumber: "RI-2026-06-20-001", type: "requisition",
      title: "Déplacement de mobilier — Salle 204",
      authorId: 1, authorName: "Mario Dumont", date: "2026-06-20", status: "acceptee",
      history: [{ status: "acceptee", by: "Mario Dumont", date: "2026-06-20", comment: "Demande envoyée au vérificateur (réquisition interne)" }],
      formData: { titre: "Déplacement de mobilier — Salle 204", typeService: "Déplacement de mobilier", priorite: "Normal",
        description: "Déplacer 12 tables et 24 chaises de la salle 204 vers le local 008 avant les travaux de peinture du 25 juin.",
        autreType: "", demandePar: "Mario Dumont", courriel: "mdupont@csslaval.gouv.qc.ca",
        dateDemande: "2026-06-20", dateRealisation: "2026-06-24", localConcerne: "Salle 204 → Local 008", drawing: [] } },

    // Paula Gagnon — attribuée au Magasinier (validee_C2)
    { id: 2012, requestNumber: "RI-2026-06-05-001", type: "requisition",
      title: "Réorganisation entrepôt matériel scolaire — B-001",
      authorId: 6, authorName: "Paula Gagnon", date: "2026-06-05", status: "validee_C2",
      history: [
        { status: "acceptee",   by: "Paula Gagnon",  date: "2026-06-05", comment: "Demande envoyée au vérificateur (réquisition interne)" },
        { status: "validee_C2", by: "Sophie Bernard", date: "2026-06-07", comment: "Attribuée au Magasinier — travaux à planifier dès le 16 juin." },
      ],
      formData: { titre: "Réorganisation entrepôt matériel scolaire — B-001", typeService: "Déplacement de mobilier", priorite: "Normal",
        description: "Réorganisation complète de l'entrepôt B-001 : déplacement étagères, tri du matériel, étiquetage des zones thématiques. Durée estimée : 4 heures.",
        autreType: "", demandePar: "Paula Gagnon", courriel: "pgagnon@csslaval.gouv.qc.ca",
        dateDemande: "2026-06-05", dateRealisation: "2026-06-16", localConcerne: "Entrepôt B-001", drawing: [] } },

    // Luc Tremblay — attribuée au Concierge (validee_C3)
    { id: 2013, requestNumber: "RI-2026-05-28-001", type: "requisition",
      title: "Réparation projecteur — Amphithéâtre",
      authorId: 4, authorName: "Luc Tremblay", date: "2026-05-28", status: "validee_C3",
      history: [
        { status: "acceptee",   by: "Luc Tremblay",  date: "2026-05-28", comment: "Demande envoyée au vérificateur (réquisition interne)" },
        { status: "validee_C3", by: "Sophie Bernard", date: "2026-05-30", comment: "Attribuée au Concierge — Michel Caron disponible dès le 2 juin." },
      ],
      formData: { titre: "Réparation projecteur — Amphithéâtre", typeService: "Autres (précisez)", priorite: "Élevé",
        description: "Projecteur principal hors service (lampe brûlée + ventilation défectueuse). Remplacement requis avant la présentation de fin d'année du 18 juin.",
        autreType: "Réparation équipement audiovisuel",
        demandePar: "Luc Tremblay", courriel: "ltremblay@csslaval.gouv.qc.ca",
        dateDemande: "2026-05-28", dateRealisation: "2026-06-05", localConcerne: "Amphithéâtre — Scène principale", drawing: [] } },

    // Michel Caron — traitée (cycle complet concierge)
    { id: 2014, requestNumber: "RI-2026-04-15-001", type: "requisition",
      title: "Installation étagères — Bibliothèque",
      authorId: 7, authorName: "Michel Caron", date: "2026-04-15", status: "traitee",
      history: [
        { status: "acceptee",   by: "Michel Caron",   date: "2026-04-15", comment: "Demande envoyée au vérificateur (réquisition interne)" },
        { status: "validee_C3", by: "Sophie Bernard",  date: "2026-04-17", comment: "Attribuée au Concierge." },
        { status: "traitee",    by: "Michel Caron",   date: "2026-04-22", comment: "4 étagères installées et fixées. Travaux complétés sans incident." },
      ],
      formData: { titre: "Installation étagères — Bibliothèque", typeService: "Déplacement de mobilier", priorite: "Faible",
        description: "Installation de 4 nouvelles étagères murales dans la section jeunesse de la bibliothèque pour les nouvelles acquisitions.",
        autreType: "", demandePar: "Michel Caron", courriel: "mcaron@csslaval.gouv.qc.ca",
        dateDemande: "2026-04-15", dateRealisation: "2026-04-22", localConcerne: "Bibliothèque — Section jeunesse", drawing: [] } },

    // Jean Martin — réquisition refusée
    { id: 2015, requestNumber: "RI-2026-06-15-001", type: "requisition",
      title: "Remplacement serrure — Local B-012",
      authorId: 2, authorName: "Jean Martin", date: "2026-06-15", status: "refusee",
      history: [
        { status: "acceptee", by: "Jean Martin",    date: "2026-06-15", comment: "Demande envoyée au vérificateur (réquisition interne)" },
        { status: "refusee",  by: "Sophie Bernard", date: "2026-06-17", comment: "Refusée — le remplacement des serrures relève de la division infrastructure du CSS. Veuillez contacter directement la maintenance centrale." },
      ],
      formData: { titre: "Remplacement serrure — Local B-012", typeService: "Autres (précisez)", priorite: "Faible",
        description: "La serrure du local B-012 est défectueuse depuis 3 semaines — clé coincée à l'ouverture. Remplacement requis avant la rentrée.",
        autreType: "Menuiserie / Serrurerie",
        demandePar: "Jean Martin", courriel: "jmartin@csslaval.gouv.qc.ca",
        dateDemande: "2026-06-15", dateRealisation: "2026-07-01", localConcerne: "Local B-012 — Sous-sol", drawing: [] } },
  ])
  const [reqCounters, setReqCounters] = useState({
    "AM_2026-01-08": 1,
    "AS_2026-01-12": 1,
    "AM_2026-01-10": 1,
    "AS_2026-01-06": 1,
  });

  function handleLogin(u) {
    const fresh = allUsers.find((x) => x.id === u.id) || u;
    setUser(fresh);
    setView("dashboard");
  }

  function handleLogout() {
    setUser(null);
    setView("dashboard");
  }

  function handleSubmitRequest({ type, title, formData }) {
    const today = new Date().toISOString().slice(0, 10);
    // Les demandes de réquisition interne vont directement au vérificateur (B)
    const isRequisition = type === "requisition";
    const initialStatus = isRequisition ? "acceptee" : "soumise";
    const historyComment = isRequisition
      ? "Demande envoyée directement au vérificateur (réquisition interne)"
      : "";
    const newReq = {
      id: Date.now(),
      type, title,
      authorId: user.id, authorName: user.name,
      date: today, status: initialStatus,
      history: [{ status: initialStatus, by: user.name, date: today, comment: historyComment }],
      formData,
    };
    setRequests((prev) => [newReq, ...prev]);
  }

  function handleAction(reqId, newStatus, comment, actionUser, adminComment = "") {
    const today = new Date().toISOString().slice(0, 10);

    // Messages de confirmation selon l'action
    const confirmMessages = {
      acceptee:   "Confirmer l'approbation de cette demande ?",
      validee:    "Confirmer la vérification ?\n\nLa demande sera transmise à la secrétaire pour traitement.",
      validee_C2: "Attribuer cette réquisition au Magasinier ?\n\nIl pourra la traiter et la compléter.",
      validee_C3: "Attribuer cette réquisition au Concierge ?\n\nIl pourra la traiter et la compléter.",
      commandee:  "Confirmer que les items ont été commandés ?",
      traitee:    "Confirmer que la demande est complétée / traitée ?\n\nCette action est finale.",
      refusee:    "Confirmer le refus de cette demande ?",
      annulee:    "Confirmer l'annulation de cette demande ?",
    };

    if (confirmMessages[newStatus]) {
      if (!window.confirm(confirmMessages[newStatus])) return;
    }

    const updatedReq = (r) => ({
      ...r,
      status: newStatus,
      history: [...(r.history || []), { status: newStatus, by: actionUser.name, date: today, comment: comment || "", adminComment: adminComment || "" }],
    });

    setRequests((prev) => prev.map((r) => r.id === reqId ? updatedReq(r) : r));

    if (selectedRequest?.id === reqId) {
      setSelectedRequest((prev) => prev ? updatedReq(prev) : prev);
    }

    // Rester sur l'historique si on y est, sinon aller sur le détail
    setView(prev => prev === "history" ? "history" : "detail");
  }

  function handleUpdateItems(reqId, updatedRows) {
    // Met à jour les items (commandé/reçu) sans changer le statut
    const update = (r) => ({
      ...r,
      formData: { ...r.formData, _rows: updatedRows },
    });
    setRequests((prev) => prev.map((r) => r.id === reqId ? update(r) : r));
    if (selectedRequest?.id === reqId) {
      setSelectedRequest((prev) => prev ? update(prev) : prev);
    }
  }

  function handleEdit(request, nextStatus, comment) {
    setEditContext({ request, nextStatus, comment });
    if (request.type === "activite") {
      setView("edit_activite");
    } else if (request.type === "requisition") {
      setView("edit_requisition");
    } else {
      setView("edit_achat");
    }
  }

  function handleSaveEdit(newFormData) {
    const { request, nextStatus, comment } = editContext;
    const today = new Date().toISOString().slice(0, 10);

    // Reconstruire le title depuis le formData mis à jour
    function buildTitle(type, fd, fallback) {
      if (type === "achat") return (fd.natureActivite || fallback || "Demande d'achat").slice(0, 60);
      if (type === "activite") return (fd.nomActivite || fd["Nom de l'activité"] || fallback || "Demande d'activité").slice(0, 60);
      if (type === "requisition") return (fd.titre || fallback || "Demande de réquisition interne").slice(0, 60);
      return fallback;
    }

    const applyUpdate = (r) => {
      const newTitle = buildTitle(request.type, newFormData, r.title);
      const updated = { ...r, title: newTitle, formData: newFormData };
      if (nextStatus && nextStatus !== "auteur") {
        updated.status = nextStatus;
        updated.history = [...(r.history || []), { status: nextStatus, by: user.name, date: today, comment: comment || "Modifiée et " + nextStatus }];
      } else {
        updated.history = [...(r.history || []), { status: r.status, by: user.name, date: today, comment: "Demande modifiée par " + user.name }];
      }
      return updated;
    };

    setRequests((prev) => prev.map((r) => r.id === request.id ? applyUpdate(r) : r));
    setSelectedRequest((prev) => prev && prev.id === request.id ? applyUpdate(prev) : prev);
    setEditContext(null);
    setView("detail");
  }

  function handleSaveEditAndApprove(newFormData) {
    // Enregistre les modifications ET passe le statut à "acceptee"
    const { request } = editContext;
    const today = new Date().toISOString().slice(0, 10);
    function buildTitle(type, fd, fallback) {
      if (type === "achat") return (fd.natureActivite || fallback || "Demande d'achat").slice(0, 60);
      if (type === "activite") return (fd.nomActivite || fd["Nom de l'activité"] || fallback || "Demande d'activité").slice(0, 60);
      if (type === "requisition") return (fd.titre || fallback || "Demande de réquisition interne").slice(0, 60);
      return fallback;
    }
    const applyUpdate = (r) => {
      const newTitle = buildTitle(request.type, newFormData, r.title);
      return {
        ...r,
        title: newTitle,
        formData: newFormData,
        status: "acceptee",
        history: [...(r.history || []), { status: "acceptee", by: user.name, date: today, comment: "Demande modifiée et approuvée par " + user.name }],
      };
    };
    setRequests((prev) => prev.map((r) => r.id === request.id ? applyUpdate(r) : r));
    setSelectedRequest((prev) => prev && prev.id === request.id ? applyUpdate(prev) : prev);
    setEditContext(null);
    setView("detail");
  }

  function handleCancelRequest(reqId, actionUser) {
    const today = new Date().toISOString().slice(0, 10);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: "annulee",
              history: [...(r.history || []), { status: "annulee", by: actionUser.name, date: today, comment: "Demande annulée par l'auteur. L'approbateur a été avisé." }],
            }
          : r
      )
    );
    if (selectedRequest?.id === reqId) {
      setSelectedRequest((prev) => ({
        ...prev,
        status: "annulee",
        history: [...(prev.history || []), { status: "annulee", by: actionUser.name, date: today, comment: "Demande annulée par l'auteur. L'approbateur a été avisé." }],
      }));
    }
    setView("dashboard");
  }

  function handleUpdateRoles(updatedUsers) {
    setAllUsers(updatedUsers);
    if (user) {
      const updated = updatedUsers.find((u) => u.id === user.id);
      if (updated) setUser(updated);
    }
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  function renderView() {
    if (view === "dashboard") {
      return <Dashboard user={user} requests={requests} setView={setView} setSelectedRequest={setSelectedRequest} activeForms={activeForms} setPrevView={setPrevView} />;
    }
    if (view === "form_achat") {
      return <FormAchat user={user} onSubmit={handleSubmitRequest} onBack={() => setView("dashboard")} allUsers={allUsers} />;
    }
    if (view === "form_activite") {
      return <FormActivite user={user} onSubmit={handleSubmitRequest} onBack={() => setView("dashboard")} allUsers={allUsers} />;
    }
    if (view === "form_requisition") {
      return <FormRequisition user={user} onSubmit={handleSubmitRequest} onBack={() => setView("dashboard")} serviceTypes={serviceTypes} />;
    }
    if (view === "detail" && selectedRequest) {
      return <RequestDetail
        request={selectedRequest}
        user={user}
        onAction={handleAction}
        onBack={() => setView(prevView || "dashboard")}
        onEdit={handleEdit}
        onCancel={handleCancelRequest}
        onUpdateItems={handleUpdateItems}
      />;
    }
    if (view === "edit_achat" && editContext) {
      // Approbateur (rôle A ou admin) sur demande soumise → peut approuver en même temps
      const canApproveOnEdit = (user.roles.includes("A") || user.roles.includes("D")) && editContext.request.status === "soumise";
      return <FormAchat
        user={user}
        allUsers={allUsers}
        initialData={editContext.request.formData}
        editMode={true}
        onSubmit={handleSaveEdit}
        onApprove={canApproveOnEdit ? handleSaveEditAndApprove : undefined}
        onBack={() => { setEditContext(null); setView("detail"); }}
      />;
    }
    if (view === "edit_activite" && editContext) {
      return <FormActivite
        user={user}
        allUsers={allUsers}
        initialData={editContext.request.formData}
        editMode={true}
        onSubmit={handleSaveEdit}
        onBack={() => { setEditContext(null); setView("detail"); }}
      />;
    }
    if (view === "edit_requisition" && editContext) {
      return <FormRequisition
        user={user}
        serviceTypes={serviceTypes}
        initialData={editContext.request.formData}
        editMode={true}
        onSubmit={handleSaveEdit}
        onBack={() => { setEditContext(null); setView("detail"); }}
      />;
    }
    if (view === "queue_A") {
      return <QueueView role="A" allRequests={requests} requests={requests.filter(r => r.status === "soumise" && ["achat","activite"].includes(r.type) && (user.roles.includes("D") || !r.formData || r.formData.directionResponsable === user.name))} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_A")} />;
    }
    if (view === "queue_B") {
      return <QueueView role="B" allRequests={requests} requests={requests.filter(r => r.status === "acceptee")} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_B")} />;
    }
    if (view === "queue_C1") {
      return <QueueView role="C1" allRequests={requests} label="Secrétaire" requests={requests.filter(r => r.status === "validee" && ["achat","activite"].includes(r.type))} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_C1")} />;
    }
    if (view === "queue_C2") {
      return <QueueView role="C2" allRequests={requests} label="Magasinier" requests={requests.filter(r => (["validee","commandee"].includes(r.status) && r.type === "achat") || (r.status === "validee_C2" && r.type === "requisition"))} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_C2")} />;
    }
    if (view === "queue_C3") {
      return <QueueView role="C3" allRequests={requests} label="Concierge" requests={requests.filter(r => r.status === "validee_C3" && r.type === "requisition")} user={user} onAction={handleAction} onBack={() => setView("dashboard")} setSelectedRequest={setSelectedRequest} setView={setView} onSetPrevView={() => setPrevView("queue_C3")} />;
    }
    if (view === "history") {
      return <HistoryView user={user} requests={requests} setView={setView} setSelectedRequest={setSelectedRequest} />;
    }
    if (view === "admin" && user.roles.includes("D")) {
      return <AdminView onBack={() => setView("dashboard")} allUsers={allUsers} onUpdateRoles={handleUpdateRoles} serviceTypes={serviceTypes} onUpdateServiceTypes={setServiceTypes} activeForms={activeForms} onUpdateActiveForms={setActiveForms} />;
    }
    return <Dashboard user={user} requests={requests} setView={setView} setSelectedRequest={setSelectedRequest} />;
  }

  return (
    <div style={S.page}>
      <Topbar user={user} onLogout={handleLogout} setView={setView} requests={requests} />
      {/* Nav tabs */}
      <div style={{ background: "#fff", borderBottom: "2px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0 }}>
          {[
            { key: "dashboard", label: "📊 Tableau de bord" },
            { key: "history", label: "📋 Historique" },
            ...(user.roles.includes("A") ? [{ key: "queue_A", label: "👍 Approbateur" }] : []),
            ...(user.roles.includes("B") ? [{ key: "queue_B", label: "✅ Vérificateur" }] : []),
            ...(user.roles.includes("C1") ? [{ key: "queue_C1", label: "📝 Secrétaire" }] : []),
            ...(user.roles.includes("C2") ? [{ key: "queue_C2", label: "📦 Magasinier" }] : []),
            ...(user.roles.includes("C3") ? [{ key: "queue_C3", label: "🔧 Concierge" }] : []),
            ...(user.roles.includes("D") ? [{ key: "admin", label: "⚙️ Admin" }] : []),
          ].map((tab) => {
            const active = view === tab.key || (view.startsWith("form") && tab.key === "dashboard") || (view === "detail" && tab.key === "dashboard") || (view === "edit_achat" && tab.key === "dashboard") || (view === "edit_activite" && tab.key === "dashboard");
            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                style={{
                  padding: "12px 18px", border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 13, fontWeight: active ? 700 : 400,
                  color: active ? COLORS.vertFonce : COLORS.gris,
                  borderBottom: active ? `3px solid ${COLORS.vert}` : "3px solid transparent",
                  marginBottom: -2,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {renderView()}
    </div>
  );
}
