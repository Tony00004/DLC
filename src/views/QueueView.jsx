import { useState } from "react";
import { COLORS, STATUSES, REQUEST_TYPES } from "../constants";
import { S } from "../styles";

export function QueueView({ role, label, requests, allRequests, user, onAction, onBack, setSelectedRequest, setView, onSetPrevView }) {
  const filtered = requests; // demandes en attente (pré-filtrées)
  const actionMap = { A: "acceptee", B: "validee", C1: "traitee", C2: "traitee", C3: "traitee" };
  const roleLabels = { A: "Approuver", B: "Vérifier", C1: "Traiter", C2: "Traiter", C3: "Traiter" };
  const roleDisplay = label || (role === "A" ? "Approbateur" : role === "B" ? "Vérificateur" : role === "C1" ? "Agent administratif" : role === "C2" ? "Magasinier" : role === "C3" ? "Concierge" : role);

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
            var STATUTS = { soumise:"Soumise", acceptee:"Approuvée", validee:"Vérifiée", validee_C2:"Attribuée — Magasinier", validee_C3:"Attribuée — Concierge", commandee:"En commande", partiellement_traitee:"Partiellement complétée", traitee:"Traitée", refusee:"Refusée", annulee:"Annulée" };
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
