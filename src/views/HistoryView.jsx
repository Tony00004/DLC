import { useState } from "react";
import { COLORS, STATUSES, REQUEST_TYPES } from "../constants";
import { S } from "../styles";
import { getSchoolYear, getPrixTotal } from "../utils/format";
import { exportExcel } from "../utils/excel";
import { isPendingForRole, isPendingC1, isPendingC2, isPendingC3, getStatusMeta, getApprovalStages, getCreationStatus, getCreationLabel } from "../utils/workflow";

// Fusionne les statuts fixes avec les étapes configurées par l'administrateur,
// pour peupler le filtre « Statut » de la liste des demandes.
function buildStatusOptions(workflowConfig) {
  const map = new Map();
  Object.entries(STATUSES).forEach(([k, v]) => map.set(k, v.label));
  ["achat", "activite", "requisition"].forEach((type) => {
    map.set(getCreationStatus(type), getCreationLabel(type));
    getApprovalStages(type, workflowConfig).forEach((s) => map.set(s.id, s.label));
  });
  return Array.from(map.entries());
}

export function HistoryView({ user, requests, setView, setSelectedRequest, onDeleteYear, workflowConfig }) {
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
        var inQueue = (user.roles.includes("A") && isPendingForRole(r, "A", workflowConfig))
          || (user.roles.includes("A2") && isPendingForRole(r, "A2", workflowConfig))
          || (user.roles.includes("B") && isPendingForRole(r, "B", workflowConfig))
          || (user.roles.includes("C1") && isPendingC1(r, workflowConfig))
          || (user.roles.includes("C2") && isPendingC2(r, workflowConfig))
          || (user.roles.includes("C3") && isPendingC3(r));
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
  var [selectedAuthor, setSelectedAuthor] = useState("all");
  var [dateFrom, setDateFrom] = useState("");
  var [dateTo, setDateTo] = useState("");
  var [search, setSearch] = useState("");

  // Demandeurs distincts (pour le filtre « Demandeur »)
  var allAuthors = Array.from(new Set(allVisible.map(function(r) { return r.authorName; }))).sort();

  function resetFilters() {
    setSelectedYear(bestYear); setSelectedType("all"); setSelectedStatus("all");
    setSelectedAuthor("all"); setDateFrom(""); setDateTo(""); setSearch("");
  }
  var filtersActive = selectedYear !== bestYear || selectedType !== "all" || selectedStatus !== "all"
    || selectedAuthor !== "all" || dateFrom !== "" || dateTo !== "" || search !== "";

  // Tri des colonnes du tableau
  var [sortField, setSortField] = useState("date");
  var [sortDir, setSortDir] = useState("desc");
  var SORT_COLUMNS = [
    { key: "requestNumber", label: "Nº demande", defaultDir: "asc", get: function(r) { return r.requestNumber || String(r.id); } },
    { key: "type",          label: "Catégorie",  defaultDir: "asc", get: function(r) { return REQUEST_TYPES[r.type] || r.type; } },
    { key: "title",         label: "Titre",      defaultDir: "asc", get: function(r) { return r.title; } },
    { key: "authorName",    label: "Demandeur",  defaultDir: "asc", get: function(r) { return r.authorName; } },
    { key: "date",          label: "Date",       defaultDir: "desc", get: function(r) { return r.date; } },
    { key: "status",        label: "Statut",     defaultDir: "asc", get: function(r) { return getStatusMeta(r.type, r.status, workflowConfig).label; } },
    { key: "approbateur",   label: "Approbateur", defaultDir: "asc", get: function(r) {
        var h = r.history && r.history.find(function(h) { return h.status === "acceptee"; });
        return h ? h.by : "";
      } },
    { key: "prix",          label: "Prix total", defaultDir: "desc", get: function(r) {
        var n = parseFloat(String(getPrixTotal(r)).replace(/[^0-9.-]/g, ""));
        return isNaN(n) ? -1 : n;
      } },
  ];
  function handleSort(col) {
    if (sortField === col.key) {
      setSortDir(function(d) { return d === "asc" ? "desc" : "asc"; });
    } else {
      setSortField(col.key);
      setSortDir(col.defaultDir);
    }
  }

  // Filtrer
  var t = search.toLowerCase();
  var activeSortCol = SORT_COLUMNS.find(function(c) { return c.key === sortField; }) || SORT_COLUMNS[4];
  var filtered = allVisible.filter(function(r) {
    var yearOk = selectedYear === "all" || getSchoolYear(r.date) === selectedYear;
    var typeOk = selectedType === "all" || r.type === selectedType;
    var statusOk = selectedStatus === "all" || r.status === selectedStatus;
    var authorOk = selectedAuthor === "all" || r.authorName === selectedAuthor;
    var dateFromOk = !dateFrom || r.date >= dateFrom;
    var dateToOk = !dateTo || r.date <= dateTo;
    var searchOk = !t ||
      (r.requestNumber || "").toLowerCase().includes(t) ||
      r.title.toLowerCase().includes(t) ||
      r.authorName.toLowerCase().includes(t);
    return yearOk && typeOk && statusOk && authorOk && dateFromOk && dateToOk && searchOk;
  }).sort(function(a, b) {
    var av = activeSortCol.get(a), bv = activeSortCol.get(b);
    var cmp = typeof av === "number" && typeof bv === "number"
      ? av - bv
      : String(av).localeCompare(String(bv), "fr", { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Compteurs sur toutes les demandes visibles (pas juste le filtre)
  var nbEnCours = allVisible.filter(function(r) { return !["traitee","refusee","annulee"].includes(r.status); }).length;
  var nbTraitees = allVisible.filter(function(r) { return r.status === "traitee"; }).length;
  var nbRefusees = allVisible.filter(function(r) { return ["refusee","annulee"].includes(r.status); }).length;

  return (
    <div style={S.content} className="s-content">
      <button style={{ ...S.btn, marginBottom: 20 }} onClick={() => setView("dashboard")}>← Retour</button>
      <div style={S.card} className="s-card">

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

        {/* Bascule Mes demandes / Demandes sur lesquelles j'ai agi */}
        {hasRoles && !isAdmin && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[["mes", "Mes demandes"], ["agis", "Demandes sur lesquelles j'ai agi"]].map(function([key, label]) {
              var active = histTab === key;
              return (
                <button key={key}
                  style={{
                    padding: "8px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer",
                    fontWeight: active ? 700 : 500,
                    background: active ? COLORS.bleu : "#fff",
                    color: active ? "#fff" : COLORS.gris,
                    border: `1px solid ${active ? COLORS.bleu : "#d9dee5"}`,
                  }}
                  onClick={function() { setHistTab(key); }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Compteurs rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }} className="s-dash-stats">
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
              {buildStatusOptions(workflowConfig).map(function([k, label]) { return <option key={k} value={k}>{label}</option>; })}
            </select>
          </div>
          {allAuthors.length > 1 && (
            <div>
              <label style={S.label}>Demandeur</label>
              <select style={{ ...S.select, minWidth: 170 }} value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)}>
                <option value="all">Tous</option>
                {allAuthors.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
              </select>
            </div>
          )}
          <div>
            <label style={S.label}>Du</label>
            <input type="date" style={{ ...S.input, minWidth: 150 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Au</label>
            <input type="date" style={{ ...S.input, minWidth: 150 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={S.label}>Recherche</label>
            <input style={S.input} placeholder="Nº, titre, demandeur…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {filtersActive && (
            <button style={{ ...S.btn, fontSize: 12, padding: "6px 12px", alignSelf: "flex-end" }} onClick={resetFilters}>
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
            {selectedStatus !== "all" ? " · " + (buildStatusOptions(workflowConfig).find(([k]) => k === selectedStatus)?.[1] || selectedStatus) : ""}
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
            <button style={S.btn} onClick={() => { setSelectedYear("all"); setSelectedType("all"); setSelectedStatus("all"); setSelectedAuthor("all"); setDateFrom(""); setDateTo(""); setSearch(""); }}>
              Voir toutes les demandes
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }} className="s-table-wrap">
            <table style={S.table}>
              <thead>
                <tr>
                  {SORT_COLUMNS.map((col) => (
                    <th key={col.key} style={{ ...S.th, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }} onClick={() => handleSort(col)} title="Trier">
                      {col.label} {sortField === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                  ))}
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  var st = getStatusMeta(r.type, r.status, workflowConfig);
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

