import { useState } from "react";
import { COLORS, REQUEST_TYPES } from "../constants";
import { S } from "../styles";
import { printHTML } from "../utils/print";
import { writeExcelFile } from "../utils/excel";
import { getPrixTotal } from "../utils/format";
import { ROLE_LABELS, getAvailableAdvance, canRoleRefuse, getActionLabel, getStatusMeta, getFinalApprovalStatus } from "../utils/workflow";

function authInfo(auth) {
  if (!auth || !auth.decision) return { label: "En attente", color: COLORS.gris, italic: true };
  return auth.decision === "autorisee"
    ? { label: "✓ Approuvée", color: "#16a34a" }
    : { label: "✗ Rejetée", color: COLORS.rouge };
}

function esc(v) {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDatesPrevues(list) {
  if (!list || list.length === 0) return "";
  return list.map(d => d.date + (d.heureDebut ? ` (${d.heureDebut}–${d.heureFin})` : "")).join("; ");
}

function fmtTransport(fd) {
  if (fd.typeActivite !== "Sortie" && fd.typeActivite !== "Voyage") return "N/A";
  const parts = [];
  if (fd.typeTransport) parts.push(fd.typeTransport === "Autre" ? fd.autreTransport : fd.typeTransport);
  if (fd.nomEtablissement) parts.push(fd.nomEtablissement);
  if (fd.adresseComplete) parts.push(fd.adresseComplete);
  if (fd.personneContact) parts.push(fd.personneContact + (fd.telephone ? ` (${fd.telephone}${fd.poste ? " p." + fd.poste : ""})` : ""));
  if (fd.heureDepart || fd.heureRetour) parts.push(`Départ ${fd.heureDepart || "?"} / Retour ${fd.heureRetour || "?"}`);
  return parts.join(" | ") || "—";
}

function getMontant(r) {
  if (r.type === "achat") return (r.formData && r.formData.total) || "—";
  if (r.type === "activite") return (r.formData && r.formData["Total estimé"]) || "—";
  return "—"; // réquisition interne : pas de montant
}

function fmtAuthLong(auth) {
  const info = authInfo(auth);
  const parts = [info.label];
  if (auth?.date) parts.push(auth.date);
  if (auth?.comment) parts.push(auth.comment);
  return parts.join(" — ");
}

function buildTableHTML(headers, rows, title) {
  return (
    `<h3>${esc(title)}</h3>` +
    `<table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
    (rows.length
      ? rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${headers.length}">Aucune demande.</td></tr>`) +
    `</tbody></table>`
  );
}

export function QueueView({ role, label, requests, allRequests, user, onAction, onBack, setSelectedRequest, setView, onSetPrevView, workflowConfig }) {
  const filtered = requests; // demandes en attente (pré-filtrées)
  const isAdmin = user.roles.includes("D");
  const roleDisplay = label || ROLE_LABELS[role] || role;

  // Demandes traitées : celles où l'utilisateur a agi (dans l'historique)
  const traitees = allRequests ? allRequests.filter(r =>
    r.status !== "brouillon" &&
    r.history && r.history.some(h => h.by === user.name) &&
    !filtered.some(f => f.id === r.id) // pas dans la file d'attente
  ) : [];

  const [showTraitees, setShowTraitees] = useState(false);
  const [showTraiteesActivite, setShowTraiteesActivite] = useState(false);
  const [showTraiteesAchat, setShowTraiteesAchat] = useState(false);
  const [traiteesTab, setTraiteesTab] = useState("achat");

  // Demandes traitées (file générique A/A2/B/C2/C3), séparées par type de demande
  // pour ne jamais mélanger achat / activité / réquisition dans un même tableau.
  const TRAITEES_TABS = [
    ["achat", "Achat de matériel"],
    ["activite", "Activités et sorties"],
    ["requisition", "Réquisition interne"],
  ];
  const traiteesParType = {
    achat: traitees.filter(r => r.type === "achat"),
    activite: traitees.filter(r => r.type === "activite"),
    requisition: traitees.filter(r => r.type === "requisition"),
  };

  // La file de l'agent administratif (C1) mélange achats et activités : on la sépare en 2 catégories.
  const isAgentQueue = role === "C1";
  const activitesPendantes = isAgentQueue ? filtered.filter(r => r.type === "activite") : [];
  const achatsPendants = isAgentQueue ? filtered.filter(r => r.type === "achat") : [];
  const activitesTraitees = isAgentQueue ? traitees.filter(r => r.type === "activite") : [];
  const achatsTraitees = isAgentQueue ? traitees.filter(r => r.type === "achat") : [];
  // Achats : nouvelles demandes (fin de la chaîne d'approbation) vs matériel déjà en commande.
  const achatFinalStatus = getFinalApprovalStatus("achat", workflowConfig);
  const achatsNouvelles = achatsPendants.filter(r => r.status === achatFinalStatus);
  const achatsEnCommande = achatsPendants.filter(r => r.status !== achatFinalStatus);

  function goToRequest(r) {
    setSelectedRequest(r);
    if (onSetPrevView) onSetPrevView();
    setTimeout(() => setView("detail"), 0);
  }

  function actionButtons(r) {
    const advance = getAvailableAdvance(r.type, r.status, [role], workflowConfig, isAdmin);
    // Le refus reste gouverné par la configuration « Qui peut refuser » (onglet Parcours des
    // demandes) même pour un compte administrateur agissant dans un rôle d'exécution (C1/C2/C3).
    const refusable = canRoleRefuse(r.type, role, workflowConfig);
    // Une réquisition en fin de chaîne se termine par un choix d'attribution (Magasinier/Concierge)
    // qui nécessite d'ouvrir la fiche détail plutôt qu'une action rapide depuis la liste.
    const showAdvanceHere = advance && !(r.type === "requisition" && advance.isLast);
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ ...S.btn, padding: "4px 10px", fontSize: 12 }} onClick={() => goToRequest(r)}>Voir</button>
        {showAdvanceHere && (
          <button style={{ ...S.btnPrimary, padding: "4px 10px", fontSize: 12 }} onClick={() => onAction(r.id, advance.stage.id, "", user)}>
            {getActionLabel(advance.stage)}
          </button>
        )}
        {refusable && <button style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 12 }} onClick={() => onAction(r.id, "refusee", "", user)}>Refuser</button>}
      </div>
    );
  }

  function renderCategoryPendingTable(list, { withAuth = false, withStatus = false } = {}) {
    if (list.length === 0) return <p style={{ color: COLORS.gris }}>Aucune demande en attente.</p>;
    const headers = [
      "#", "Titre", "Demandeur", "Date",
      ...(withStatus ? ["Statut"] : []),
      ...(withAuth ? ["Approuvé CPE", "Approuvé CÉ"] : []),
      "Actions",
    ];
    return (
      <div className="s-table-wrap">
      <table style={S.table}>
        <thead><tr>{headers.map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {list.map((r, i) => {
            const cpe = withAuth ? authInfo(r.formData?.cpeAuth) : null;
            const ce = withAuth ? authInfo(r.formData?.ceAuth) : null;
            const st = withStatus ? getStatusMeta(r.type, r.status, workflowConfig) : null;
            return (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={S.td}>{r.id}</td>
                <td style={S.td}><strong>{r.title}</strong></td>
                <td style={S.td}>{r.authorName}</td>
                <td style={S.td}>{r.date}</td>
                {withStatus && <td style={S.td}><span style={S.badge(st.color)}>{st.label}</span></td>}
                {withAuth && <td style={S.td}><span style={{ color: cpe.color, fontStyle: cpe.italic ? "italic" : "normal", fontSize: 13, fontWeight: cpe.italic ? 400 : 700 }}>{cpe.label}</span></td>}
                {withAuth && <td style={S.td}><span style={{ color: ce.color, fontStyle: ce.italic ? "italic" : "normal", fontSize: 13, fontWeight: ce.italic ? 400 : 700 }}>{ce.label}</span></td>}
                <td style={S.td}>{actionButtons(r)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    );
  }

  function renderCategoryTraiteesTable(list, withAuth) {
    const headers = withAuth
      ? ["Nº", "Titre", "Demandeur", "Montant", "Statut", "Approuvé CPE", "Approuvé CÉ", "Date action", ""]
      : ["Nº", "Titre", "Demandeur", "Montant", "Statut", "Date action", ""];
    return (
      <div className="s-table-wrap">
      <table style={S.table}>
        <thead><tr>{headers.map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {list.map((r, i) => {
            const monAction = [...(r.history || [])].reverse().find(h => h.by === user.name);
            const st = getStatusMeta(r.type, r.status, workflowConfig);
            const cpe = withAuth ? authInfo(r.formData?.cpeAuth) : null;
            const ce = withAuth ? authInfo(r.formData?.ceAuth) : null;
            return (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12 }}>{r.requestNumber || r.id}</td>
                <td style={S.td}><strong>{r.title}</strong></td>
                <td style={S.td}>{r.authorName}</td>
                <td style={S.td}>{getMontant(r)}</td>
                <td style={S.td}><span style={S.badge(st.color)}>{st.label}</span></td>
                {withAuth && <td style={S.td}><span style={{ color: cpe.color, fontStyle: cpe.italic ? "italic" : "normal", fontSize: 13, fontWeight: cpe.italic ? 400 : 700 }}>{cpe.label}</span></td>}
                {withAuth && <td style={S.td}><span style={{ color: ce.color, fontStyle: ce.italic ? "italic" : "normal", fontSize: 13, fontWeight: ce.italic ? 400 : 700 }}>{ce.label}</span></td>}
                <td style={S.td}>{monAction ? monAction.date : ""}</td>
                <td style={S.td}><button style={{ ...S.btn, padding: "4px 10px", fontSize: 12 }} onClick={() => goToRequest(r)}>Voir</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    );
  }

  function activiteRow(r) {
    const fd = r.formData || {};
    return [
      r.requestNumber || r.id,
      fd.nomActivite || r.title,
      fd.typeActivite || "",
      r.authorName,
      (fd.responsables || []).map(x => x.nom).join(", "),
      fd.dateDemande || "",
      fmtDatesPrevues(fd.datesPrevues),
      fd.description || "",
      (fd.niveauxConcernes || []).join(", ") + (fd.autreNiveau ? ` (${fd.autreNiveau})` : ""),
      (fd.matieresConcernees || []).join(", ") + (fd.autreMatiere ? ` (${fd.autreMatiere})` : ""),
      fd.groupes || "",
      fd.directionResponsable || "",
      fd.passion === "Oui" ? "Oui — " + (fd.passionTypes || []).join(", ") + (fd.passionAutres ? ` (${fd.passionAutres})` : "") : "Non",
      fd.obligatoire || "",
      fmtTransport(fd),
      `${fd.coutEleve || "0"} $ × ${fd.nbEleves || "0"}`,
      `${fd.coutAdulte || "0"} $ × ${fd.nbAdultes || "0"}`,
      `${fd.coutLiberation || "0"} $ × ${fd.nbPeriodes || "0"}`,
      `${fd.coutTransport || "0"} $`,
      `${fd.autreMontant || "0"} $`,
      getMontant(r),
      getStatusMeta(r.type, r.status, workflowConfig).label,
      fmtAuthLong(fd.cpeAuth),
      fmtAuthLong(fd.ceAuth),
    ];
  }

  function handlePrintActivites() {
    const activiteHeaders = ["Nº", "Titre", "Type", "Demandeur", "Responsable(s)", "Date demande", "Date(s)/heure(s) prévues", "Description", "Niveaux", "Matières", "Groupes", "Direction responsable", "Concentration (passion)", "Obligatoire", "Transport", "Coût élève", "Coût adulte", "Coût libération", "Coût transport", "Autres coûts", "Total", "Statut", "Approuvé CPE", "Approuvé CÉ"];

    const html =
      `<h2>Demandes d'activités et de sorties — ${esc(roleDisplay)}</h2>` +
      `<p>Imprimé le ${esc(new Date().toLocaleDateString("fr-CA"))}</p>` +
      buildTableHTML(activiteHeaders, activitesPendantes.map(activiteRow), `Demandes en attente (${activitesPendantes.length})`) +
      buildTableHTML(activiteHeaders, activitesTraitees.map(activiteRow), `Demandes traitées (${activitesTraitees.length})`);

    printHTML(html, { landscape: true, title: "Demandes d'activités et de sorties — " + roleDisplay });
  }

  function achatRow(r) {
    return [
      r.requestNumber || r.id, r.title, r.authorName, r.date,
      getStatusMeta(r.type, r.status, workflowConfig).label,
      getMontant(r),
    ];
  }

  function handlePrintAchats() {
    const achatHeaders = ["Nº", "Titre", "Demandeur", "Date", "Statut", "Prix total"];

    const html =
      `<h2>Demandes d'achat de matériel — ${esc(roleDisplay)}</h2>` +
      `<p>Imprimé le ${esc(new Date().toLocaleDateString("fr-CA"))}</p>` +
      buildTableHTML(achatHeaders, achatsPendants.map(achatRow), `Demandes en attente (${achatsPendants.length})`) +
      buildTableHTML(achatHeaders, achatsTraitees.map(achatRow), `Demandes traitées (${achatsTraitees.length})`);

    printHTML(html, { landscape: true, title: "Demandes d'achat de matériel — " + roleDisplay });
  }

  function genericRow(r, dateLabel) {
    const monAction = [...(r.history || [])].reverse().find(h => h.by === user.name);
    return [
      r.requestNumber || r.id, REQUEST_TYPES[r.type], r.title, r.authorName,
      dateLabel === "action" ? (monAction ? monAction.date : "") : r.date,
      getMontant(r),
      getStatusMeta(r.type, r.status, workflowConfig).label,
    ];
  }

  function handlePrintGeneric() {
    const headersPending  = ["Nº", "Type", "Titre", "Demandeur", "Date", "Montant", "Statut"];
    const headersTraitees = ["Nº", "Type", "Titre", "Demandeur", "Date action", "Montant", "Statut"];

    const html =
      `<h2>File d'attente — ${esc(roleDisplay)}</h2>` +
      `<p>Imprimé le ${esc(new Date().toLocaleDateString("fr-CA"))}</p>` +
      buildTableHTML(headersPending, filtered.map(r => genericRow(r, "pending")), `Demandes en attente (${filtered.length})`) +
      buildTableHTML(headersTraitees, traitees.map(r => genericRow(r, "action")), `Demandes traitées (${traitees.length})`);

    printHTML(html, { landscape: true, title: "File d'attente — " + roleDisplay });
  }

  return (
    <div style={S.content} className="s-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }} className="s-btn-row">
        <button style={S.btn} onClick={onBack}>← Retour</button>
        <div style={{ display: "flex", gap: 10 }}>
          {(role === "A" || role === "A2" || role === "B") && (
            <button onClick={() => {
              var CATS = { achat: "Demande d'achat de matériel", activite: "Demande d'activité et de sortie", requisition: "Demande de réquisition interne" };
              var headers = ["Numéro", "Catégorie", "Titre", "Demandeur", "Statut", "Prix total", "Mon action", "Date action"];
              var allRows = filtered.concat(traitees);
              var rows = allRows.map(function(r) {
                var monAction = r.history ? [...r.history].reverse().find(function(h) { return h.by === user.name; }) : null;
                return [
                  r.requestNumber || r.id,
                  CATS[r.type] || r.type, r.title, r.authorName,
                  getStatusMeta(r.type, r.status, workflowConfig).label,
                  getPrixTotal(r),
                  monAction ? getStatusMeta(r.type, monAction.status, workflowConfig).label : "En attente",
                  monAction ? monAction.date : "",
                ];
              });
              writeExcelFile(headers, rows, "DLC_" + roleDisplay + "_" + new Date().toISOString().slice(0,10));
            }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              Exporter vers Excel ({filtered.length + traitees.length})
            </button>
          )}
        </div>
      </div>

      {isAgentQueue ? (
        <>
          <div style={S.card} className="s-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} className="s-btn-row">
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>Demandes d'activités et de sorties</h2>
              <button onClick={handlePrintActivites} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: COLORS.bleu, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                🖨️ Imprimer
              </button>
            </div>
            <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 20 }}>{activitesPendantes.length} demande(s) en attente</p>
            {renderCategoryPendingTable(activitesPendantes, { withAuth: true })}
            {activitesTraitees.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <button onClick={() => setShowTraiteesActivite(v => !v)} style={{ ...S.btn, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                  {showTraiteesActivite ? "▼" : "▶"} Demandes traitées
                  <span style={{ background: "#e5e7eb", color: "#6b7280", borderRadius: 12, padding: "2px 8px", fontSize: 12, fontWeight: 900 }}>{activitesTraitees.length}</span>
                </button>
                {showTraiteesActivite && renderCategoryTraiteesTable(activitesTraitees, true)}
              </div>
            )}
          </div>

          <div style={S.card} className="s-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} className="s-btn-row">
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>Demandes d'achat de matériel</h2>
              <button onClick={handlePrintAchats} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: COLORS.bleu, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                🖨️ Imprimer
              </button>
            </div>
            <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 20 }}>{achatsPendants.length} demande(s) en attente</p>

            <h3 style={{ margin: "0 0 4px", fontSize: 15, color: COLORS.vertFonce }}>Nouvelles demandes</h3>
            <p style={{ color: COLORS.gris, fontSize: 12, marginBottom: 10 }}>{achatsNouvelles.length} demande(s)</p>
            {renderCategoryPendingTable(achatsNouvelles, { withStatus: true })}

            <h3 style={{ margin: "24px 0 4px", fontSize: 15, color: COLORS.vertFonce }}>Matériel en commande</h3>
            <p style={{ color: COLORS.gris, fontSize: 12, marginBottom: 10 }}>{achatsEnCommande.length} demande(s)</p>
            {renderCategoryPendingTable(achatsEnCommande, { withStatus: true })}

            {achatsTraitees.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <button onClick={() => setShowTraiteesAchat(v => !v)} style={{ ...S.btn, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                  {showTraiteesAchat ? "▼" : "▶"} Demandes traitées
                  <span style={{ background: "#e5e7eb", color: "#6b7280", borderRadius: 12, padding: "2px 8px", fontSize: 12, fontWeight: 900 }}>{achatsTraitees.length}</span>
                </button>
                {showTraiteesAchat && renderCategoryTraiteesTable(achatsTraitees, false)}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={S.card} className="s-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} className="s-btn-row">
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
              File d'attente — {roleDisplay}
            </h2>
            <button onClick={handlePrintGeneric} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: COLORS.bleu, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              🖨️ Imprimer
            </button>
          </div>
          <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 20 }}>
            {filtered.length} demande(s) en attente
          </p>
          {filtered.length === 0 ? (
            <p style={{ color: COLORS.gris }}>Aucune demande en attente.</p>
          ) : (
            <div className="s-table-wrap">
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
                    <td style={S.td}>{actionButtons(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {/* ── Demandes traitées, séparées par type sous forme de sous-onglets ── */}
          {traitees.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => setShowTraitees(v => !v)}
                style={{ ...S.btn, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                {showTraitees ? "▼" : "▶"} Demandes traitées
                <span style={{ background: "#e5e7eb", color: "#6b7280", borderRadius: 12, padding: "2px 8px", fontSize: 12, fontWeight: 900 }}>{traitees.length}</span>
              </button>
              {showTraitees && (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    {TRAITEES_TABS.map(([key, tlabel]) => {
                      const active = traiteesTab === key;
                      const count = traiteesParType[key].length;
                      return (
                        <button key={key}
                          style={{
                            padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                            fontWeight: active ? 700 : 500,
                            background: active ? COLORS.bleu : "#fff",
                            color: active ? "#fff" : COLORS.noir,
                            border: `1px solid ${active ? COLORS.bleu : "#d9dee5"}`,
                          }}
                          onClick={() => setTraiteesTab(key)}>
                          {tlabel} <span style={{ opacity: 0.75, fontWeight: 500 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                  {traiteesParType[traiteesTab].length === 0 ? (
                    <p style={{ color: COLORS.gris }}>Aucune demande traitée dans cette catégorie.</p>
                  ) : (
                    <div className="s-table-wrap">
                    <table style={S.table}>
                      <thead>
                        <tr>{["Nº","Titre","Demandeur","Montant","Statut","Date action",""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {traiteesParType[traiteesTab].map((r, i) => {
                          const monAction = [...(r.history||[])].reverse().find(h => h.by === user.name);
                          const st = getStatusMeta(r.type, r.status, workflowConfig);
                          return (
                            <tr key={r.id} style={{ background: i%2===0?"#fff":"#fafafa" }}>
                              <td style={{ ...S.td, fontFamily:"monospace", fontSize:12 }}>{r.requestNumber||r.id}</td>
                              <td style={S.td}><strong>{r.title}</strong></td>
                              <td style={S.td}>{r.authorName}</td>
                              <td style={S.td}>{getMontant(r)}</td>
                              <td style={S.td}><span style={S.badge(st.color)}>{st.label}</span></td>
                              <td style={S.td}>{monAction ? monAction.date : ""}</td>
                              <td style={S.td}>
                                <button style={{ ...S.btn, padding:"4px 10px", fontSize:12 }} onClick={() => goToRequest(r)}>Voir</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
