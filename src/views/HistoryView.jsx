import { useState } from "react";
import { COLORS, STATUSES, REQUEST_TYPES } from "../constants";
import { S } from "../styles";
import { getSchoolYear, getPrixTotal } from "../utils/format";
import { exportExcel } from "../utils/excel";

export function HistoryView({ user, requests, setView, setSelectedRequest, onDeleteYear }) {
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
  var [deleteStep, setDeleteStep] = useState(0); // 0: caché, 1: avertissement, 2: saisie de confirmation
  var [deleteInput, setDeleteInput] = useState("");

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

        {/* ── Zone de suppression (vérificatrice B ou admin D, année spécifique sélectionnée) ── */}
        {(user.roles.includes("B") || user.roles.includes("D")) && selectedYear !== "all" && (() => {
          var yearCount = requests.filter(function(r) { return getSchoolYear(r.date) === selectedYear; }).length;
          return (
            <div style={{ marginBottom: 18, border: "1px solid #fca5a5", borderRadius: 8, overflow: "hidden" }}>

              {/* En-tête de la zone danger */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#fff5f5" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#b42318" }}>
                  🗑 Suppression de l'année scolaire {selectedYear}
                </span>
                {deleteStep === 0 && (
                  <button
                    style={{ background: "#b42318", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    onClick={() => { setDeleteStep(1); setDeleteInput(""); }}>
                    Supprimer toutes les demandes…
                  </button>
                )}
                {deleteStep > 0 && (
                  <button
                    style={{ background: "none", border: "1px solid #fca5a5", color: "#b42318", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
                    onClick={() => { setDeleteStep(0); setDeleteInput(""); }}>
                    ✕ Annuler
                  </button>
                )}
              </div>

              {/* Étape 1 — avertissement */}
              {deleteStep === 1 && (
                <div style={{ padding: "14px 18px", background: "#fee2e2", borderTop: "1px solid #fca5a5" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "#7f1d1d", fontWeight: 600 }}>
                    ⚠️ Vous êtes sur le point de supprimer définitivement <strong>{yearCount} demande{yearCount !== 1 ? "s" : ""}</strong> de l'année scolaire <strong>{selectedYear}</strong>. Cette action est irréversible et ne peut pas être annulée.
                  </p>
                  <button
                    style={{ background: "#b42318", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    onClick={() => setDeleteStep(2)}>
                    Continuer vers la confirmation finale →
                  </button>
                </div>
              )}

              {/* Étape 2 — saisie de l'année pour confirmer */}
              {deleteStep === 2 && (
                <div style={{ padding: "14px 18px", background: "#fee2e2", borderTop: "1px solid #fca5a5" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "#7f1d1d" }}>
                    Pour confirmer la suppression définitive de <strong>{yearCount} demande{yearCount !== 1 ? "s" : ""}</strong>, tapez exactement l'année scolaire ci-dessous :
                  </p>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      style={{ ...S.input, maxWidth: 180, borderColor: deleteInput && deleteInput !== selectedYear ? "#b42318" : "#d1d5db" }}
                      placeholder={selectedYear}
                      value={deleteInput}
                      onChange={function(e) { setDeleteInput(e.target.value); }}
                    />
                    <button
                      disabled={deleteInput !== selectedYear}
                      style={{ background: deleteInput === selectedYear ? "#b42318" : "#e5e7eb", color: deleteInput === selectedYear ? "#fff" : "#9ca3af", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: deleteInput === selectedYear ? "pointer" : "not-allowed", transition: "all 0.15s" }}
                      onClick={function() {
                        if (deleteInput !== selectedYear) return;
                        if (onDeleteYear) onDeleteYear(selectedYear);
                        setSelectedYear("all");
                        setDeleteStep(0);
                        setDeleteInput("");
                      }}>
                      Supprimer définitivement ({yearCount})
                    </button>
                  </div>
                  {deleteInput && deleteInput !== selectedYear && (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#b42318" }}>
                      L'année saisie ne correspond pas — vérifiez le format (ex. : {selectedYear}).
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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

