import { useState } from "react";
import { COLORS, STATUSES, REQUEST_TYPES } from "../constants";
import { S } from "../styles";
import { printHTML } from "../utils/print";

const STATUTS_LABEL = { soumise: "Soumise", acceptee: "Approuvée", acceptee2: "Approuvée (Approbateur +)", validee: "Vérifiée", validee_C2: "Attribuée — Magasinier", validee_C3: "Attribuée — Concierge", commandee: "En commande", partiellement_traitee: "Partiellement complétée", traitee: "Traitée", refusee: "Refusée", annulee: "Annulée" };

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
  if (fd.typeActivite !== "Sortie") return "N/A";
  const parts = [];
  if (fd.typeTransport) parts.push(fd.typeTransport === "Autre" ? fd.autreTransport : fd.typeTransport);
  if (fd.nomEtablissement) parts.push(fd.nomEtablissement);
  if (fd.adresseComplete) parts.push(fd.adresseComplete);
  if (fd.personneContact) parts.push(fd.personneContact + (fd.telephone ? ` (${fd.telephone}${fd.poste ? " p." + fd.poste : ""})` : ""));
  if (fd.heureDepart || fd.heureRetour) parts.push(`Départ ${fd.heureDepart || "?"} / Retour ${fd.heureRetour || "?"}`);
  return parts.join(" | ") || "—";
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

export function QueueView({ role, label, requests, allRequests, user, onAction, onBack, setSelectedRequest, setView, onSetPrevView }) {
  const filtered = requests; // demandes en attente (pré-filtrées)
  const actionMap = { A: "acceptee", A2: "acceptee2", B: "validee", C1: "traitee", C2: "traitee", C3: "traitee" };
  const roleLabels = { A: "Approuver", A2: "Approuver", B: "Vérifier", C1: "Traiter", C2: "Traiter", C3: "Traiter" };
  const roleDisplay = label || (role === "A" ? "Approbateur" : role === "A2" ? "Approbateur +" : role === "B" ? "Vérificateur" : role === "C1" ? "Agent administratif" : role === "C2" ? "Magasinier" : role === "C3" ? "Concierge" : role);

  // Demandes traitées : celles où l'utilisateur a agi (dans l'historique)
  const traitees = allRequests ? allRequests.filter(r =>
    r.history && r.history.some(h => h.by === user.name) &&
    !filtered.some(f => f.id === r.id) // pas dans la file d'attente
  ) : [];

  const [showTraitees, setShowTraitees] = useState(false);
  const [showTraiteesActivite, setShowTraiteesActivite] = useState(false);
  const [showTraiteesAchat, setShowTraiteesAchat] = useState(false);

  // La file de l'agent administratif (C1) mélange achats et activités : on la sépare en 2 catégories.
  const isAgentQueue = role === "C1";
  const activitesPendantes = isAgentQueue ? filtered.filter(r => r.type === "activite") : [];
  const achatsPendants = isAgentQueue ? filtered.filter(r => r.type === "achat") : [];
  const activitesTraitees = isAgentQueue ? traitees.filter(r => r.type === "activite") : [];
  const achatsTraitees = isAgentQueue ? traitees.filter(r => r.type === "achat") : [];
  // Achats : nouvelles demandes (pas encore de commande) vs matériel déjà en commande.
  const achatsNouvelles = achatsPendants.filter(r => r.status === "validee");
  const achatsEnCommande = achatsPendants.filter(r => r.status !== "validee");

  function goToRequest(r) {
    setSelectedRequest(r);
    if (onSetPrevView) onSetPrevView();
    setTimeout(() => setView("detail"), 0);
  }

  // Seuls l'Approbateur, l'Approbateur + et le Vérificateur peuvent refuser une demande.
  const canRefuse = role === "A" || role === "A2" || role === "B";

  function actionButtons(r) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ ...S.btn, padding: "4px 10px", fontSize: 12 }} onClick={() => goToRequest(r)}>Voir</button>
        <button style={{ ...S.btnPrimary, padding: "4px 10px", fontSize: 12 }} onClick={() => onAction(r.id, actionMap[role], "", user)}>{roleLabels[role]}</button>
        {canRefuse && <button style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 12 }} onClick={() => onAction(r.id, "refusee", "", user)}>Refuser</button>}
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
      <table style={S.table}>
        <thead><tr>{headers.map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {list.map((r, i) => {
            const cpe = withAuth ? authInfo(r.formData?.cpeAuth) : null;
            const ce = withAuth ? authInfo(r.formData?.ceAuth) : null;
            const st = withStatus ? (STATUSES[r.status] || { label: r.status, color: "#6b7280" }) : null;
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
    );
  }

  function renderCategoryTraiteesTable(list, withAuth) {
    const headers = withAuth
      ? ["Nº", "Titre", "Demandeur", "Statut", "Approuvé CPE", "Approuvé CÉ", "Date action", ""]
      : ["Nº", "Titre", "Demandeur", "Statut", "Date action", ""];
    return (
      <table style={S.table}>
        <thead><tr>{headers.map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {list.map((r, i) => {
            const monAction = [...(r.history || [])].reverse().find(h => h.by === user.name);
            const st = STATUSES[r.status] || { label: r.status, color: "#6b7280" };
            const cpe = withAuth ? authInfo(r.formData?.cpeAuth) : null;
            const ce = withAuth ? authInfo(r.formData?.ceAuth) : null;
            return (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12 }}>{r.requestNumber || r.id}</td>
                <td style={S.td}><strong>{r.title}</strong></td>
                <td style={S.td}>{r.authorName}</td>
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
    );
  }

  function handlePrintActivites() {
    const activiteHeaders = ["Nº", "Titre", "Type", "Demandeur", "Responsable(s)", "Date demande", "Date(s)/heure(s) prévues", "Description", "Niveaux", "Matières", "Groupes", "Direction responsable", "Concentration (passion)", "Obligatoire", "Transport", "Coût élève", "Coût adulte", "Coût libération", "Coût transport", "Autres coûts", "Total", "Statut", "Approuvé CPE", "Approuvé CÉ"];
    const activiteRows = activitesPendantes.map(r => {
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
        fd["Total estimé"] || "",
        STATUTS_LABEL[r.status] || r.status,
        fmtAuthLong(fd.cpeAuth),
        fmtAuthLong(fd.ceAuth),
      ];
    });

    const html =
      `<h2>Demandes d'activités et de sorties — ${esc(roleDisplay)}</h2>` +
      `<p>Imprimé le ${esc(new Date().toLocaleDateString("fr-CA"))}</p>` +
      buildTableHTML(activiteHeaders, activiteRows, `Demandes d'activités et de sorties (${activiteRows.length})`);

    printHTML(html, { landscape: true, title: "Demandes d'activités et de sorties — " + roleDisplay });
  }

  function handlePrintAchats() {
    const achatHeaders = ["Nº", "Titre", "Demandeur", "Date", "Statut", "Prix total"];
    const achatRows = achatsPendants.map(r => [
      r.requestNumber || r.id, r.title, r.authorName, r.date,
      STATUTS_LABEL[r.status] || r.status,
      (r.formData && r.formData.total) ? r.formData.total : "—",
    ]);

    const html =
      `<h2>Demandes d'achat de matériel — ${esc(roleDisplay)}</h2>` +
      `<p>Imprimé le ${esc(new Date().toLocaleDateString("fr-CA"))}</p>` +
      buildTableHTML(achatHeaders, achatRows, `Demandes d'achat de matériel (${achatRows.length})`);

    printHTML(html, { landscape: true, title: "Demandes d'achat de matériel — " + roleDisplay });
  }

  return (
    <div style={S.content}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button style={S.btn} onClick={onBack}>← Retour</button>
        <div style={{ display: "flex", gap: 10 }}>
          {(role === "A" || role === "A2" || role === "B") && (
            <button onClick={() => {
              var CATS = { achat: "Demande d'achat de matériel", activite: "Demande d'activité et de sortie", requisition: "Demande de réquisition interne" };
              var STATUTS = STATUTS_LABEL;
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
              var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
              var url = URL.createObjectURL(blob);
              var a = document.createElement("a"); a.href = url;
              a.download = "DLC_" + roleDisplay + "_" + new Date().toISOString().slice(0,10) + ".csv";
              document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              Exporter vers Excel ({filtered.length + traitees.length})
            </button>
          )}
        </div>
      </div>

      {isAgentQueue ? (
        <>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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

          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                    <td style={S.td}>{actionButtons(r)}</td>
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
                            <button style={{ ...S.btn, padding:"4px 10px", fontSize:12 }} onClick={() => goToRequest(r)}>Voir</button>
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
      )}
    </div>
  );
}
