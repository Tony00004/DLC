import { useState } from "react";
import { COLORS, REQUEST_TYPES, CUSTOM_EVENT_COLORS, GENERIC_EVENT_COLOR_KEYS } from "../constants";
import { S } from "../styles";
import { isPendingForRole, isPendingC1, isPendingC2, isPendingC3, getStatusMeta, hasAnyC1, hasC1Scope } from "../utils/workflow";

export function Dashboard({ user, requests, setView, setSelectedRequest, activeForms, setPrevView, statusDefinitions = {}, calendarEvents = [], onSaveCalendarEvents, workflowConfig, onContinueDraft, onDeleteDraft, showCalendar = true }) {
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", dates: [{ date: "", heureDebut: "", heureFin: "" }], couleur: "cerisier" });
  const [savingEvent, setSavingEvent] = useState(false);
  const canManageCalendar = user.roles.includes("A") || user.roles.includes("A2") || hasAnyC1(user.roles) || user.roles.includes("D");
  const myRequests = requests.filter((r) => r.authorId === user.id && r.status !== "brouillon");
  const myDrafts = requests.filter((r) => r.authorId === user.id && r.status === "brouillon")
    .sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date));
  const pendingA  = requests.filter(r => isPendingForRole(r, "A", workflowConfig) && user.roles.includes("A")
    && (user.roles.includes("D") || !r.formData || r.formData.directionResponsable === user.name));
  const pendingA2 = requests.filter(r => isPendingForRole(r, "A2", workflowConfig) && user.roles.includes("A2"));
  const pendingB  = requests.filter(r => isPendingForRole(r, "B", workflowConfig) && user.roles.includes("B"));
  const pendingC1 = requests.filter(r => isPendingC1(r, workflowConfig) && hasC1Scope(user.roles, r.type));
  const pendingC2 = requests.filter(r => isPendingC2(r, workflowConfig) && user.roles.includes("C2"));
  const pendingC3 = requests.filter(r => isPendingC3(r) && user.roles.includes("C3"));

  function statusCount(st) {
    return myRequests.filter((r) => r.status === st).length;
  }

  return (
    <div style={S.content} className="s-content">
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Tableau de bord</h2>

      {/* Stats row — 5 catégories */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }} className="s-dash-stats">
        {[
          { label: "Mes demandes soumises",                  value: statusCount("soumise"),  color: "#6b7280", icon: "📝" },
          { label: "Mes demandes en cours d'approbation",    value: statusCount("acceptee") + statusCount("acceptee2"), color: "#0284c7", icon: "👍" },
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

      {/* Nouvelle demande (colonne gauche) + Calendrier (colonne droite, si affiché) */}
      <div style={{ display: "grid", gridTemplateColumns: showCalendar ? "260px 1fr" : "1fr", gap: 24, marginBottom: 24, alignItems: "start" }} className="s-dash-main">
        <div style={{ ...S.card, marginBottom: 0 }} className="s-card">
          <h3 style={S.sectionTitle}>Nouvelle demande</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(REQUEST_TYPES).map(([key, label]) => {
              const isActive = activeForms ? activeForms[key] !== false : true;
              return isActive ? (
                <button key={key} style={S.btnPrimary} onClick={() => setView("form_" + key)}>
                  + {label}
                </button>
              ) : (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f3f4f6", cursor: "not-allowed", opacity: 0.7 }}>
                  <span style={{ fontSize: 14, color: "#9ca3af", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#b42318", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, padding: "2px 8px" }}>Désactivé</span>
                </div>
              );
            })}
          </div>
        </div>

        {showCalendar && (
        <div style={{ ...S.card, marginBottom: 0, padding: "18px 20px" }} className="s-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ ...S.sectionTitle, margin: 0, paddingBottom: 6 }}>Calendrier</h3>
            {canManageCalendar && (
              <button style={{ ...S.btn, fontSize: 11, padding: "4px 10px" }} onClick={() => { setNewEvent({ title: "", dates: [{ date: "", heureDebut: "", heureFin: "" }], couleur: "cerisier" }); setShowAddEvent(true); }}>
                + Ajouter un événement
              </button>
            )}
          </div>
          {(() => {
            const now = new Date();
            const todayIso = now.toISOString().slice(0, 10);
            const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
            const jours = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

            const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
            const startOffset = (first.getDay() + 6) % 7;
            const gridStart = new Date(first);
            gridStart.setDate(first.getDate() - startOffset);

            const cells = [];
            for (let i = 0; i < 42; i++) {
              const d = new Date(gridStart);
              d.setDate(gridStart.getDate() + i);
              const iso = d.toISOString().slice(0, 10);
              const inMonth = d.getMonth() === calMonth.getMonth();
              const dowIdx = (d.getDay() + 6) % 7;
              const dayActivites = requests.filter(r =>
                r.type === "activite" &&
                !["refusee","annulee"].includes(r.status) &&
                Array.isArray(r.formData?.datesPrevues) &&
                r.formData.datesPrevues.some(dp => dp.date === iso)
              );
              const dayCustom = calendarEvents.filter(e => e.date === iso);
              const hasNonFinal = dayActivites.some(r => r.status !== "traitee");
              const hasFinal    = dayActivites.some(r => r.status === "traitee");
              const hasAny = dayActivites.length > 0 || dayCustom.length > 0;
              cells.push({ iso, day: d.getDate(), inMonth, isWeekend: dowIdx >= 5, isToday: iso === todayIso, dayActivites, dayCustom, hasNonFinal, hasFinal, hasAny });
            }
            while (cells.length > 35 && cells.slice(-7).every(c => !c.inMonth)) cells.splice(-7, 7);

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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                  {jours.map(j => (
                    <div key={j} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, color: COLORS.gris, textTransform: "uppercase", paddingBottom: 2 }}>{j}</div>
                  ))}
                  {cells.map(c => {
                    const bg = !c.inMonth ? "#f6f7f9"
                      : c.hasNonFinal  ? "#fef9c3"
                      : c.hasFinal     ? "#dcfce7"
                      : c.isWeekend    ? "#f3f4f6"
                      : "#fff";
                    const textColor = !c.inMonth ? "#aaa"
                      : c.hasNonFinal ? "#92400e"
                      : c.hasFinal    ? COLORS.vertFonce
                      : COLORS.noir;
                    return (
                      <div key={c.iso}
                        onClick={() => { if (c.hasAny && c.inMonth) setSelectedDate(c.iso); }}
                        style={{
                          borderRadius: 5, padding: "3px 2px", textAlign: "center", minHeight: 30,
                          border: c.isToday ? `2px solid ${COLORS.bleu}` : "1px solid #e5e7eb",
                          background: bg, opacity: c.inMonth ? 1 : 0.45,
                          cursor: c.hasAny && c.inMonth ? "pointer" : "default",
                        }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: textColor }}>{c.day}</div>
                        {c.inMonth && c.dayActivites.length > 0 && (
                          <div style={{ fontSize: 7, marginTop: 1, color: textColor, fontWeight: 700, lineHeight: 1 }}>
                            {c.hasNonFinal ? "En cours" : "Complétée"}
                          </div>
                        )}
                        {c.inMonth && c.dayCustom.length > 0 && (
                          <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2, flexWrap: "wrap" }}>
                            {c.dayCustom.slice(0, 3).map(ev => (
                              <div key={ev.id} style={{ width: 5, height: 5, borderRadius: "50%", background: CUSTOM_EVENT_COLORS[ev.couleur]?.dot || "#6b7280" }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Légende */}
                <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 10, color: COLORS.gris, flexWrap: "wrap" }}>
                  <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#fef9c3", border: "1px solid #d97706", borderRadius: 2, marginRight: 4 }} />Activité ou sortie en attente d'autorisation</span>
                  <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#dcfce7", border: "1px solid #008c4a", borderRadius: 2, marginRight: 4 }} />Activité ou sortie</span>
                  <span><span style={{ display: "inline-block", width: 7, height: 7, background: CUSTOM_EVENT_COLORS.cpe.dot, borderRadius: "50%", marginRight: 4 }} />CPE</span>
                  <span><span style={{ display: "inline-block", width: 7, height: 7, background: CUSTOM_EVENT_COLORS.ce.dot, borderRadius: "50%", marginRight: 4 }} />CÉ</span>
                  <span>Autres couleurs : Évènements personnalisés</span>
                </div>
              </>
            );
          })()}
        </div>
        )}
      </div>

      {/* ── Popup détail d'une journée ── */}
      {selectedDate && (() => {
        const activitesDuJour = requests.filter(r =>
          r.type === "activite" &&
          !["refusee","annulee"].includes(r.status) &&
          Array.isArray(r.formData?.datesPrevues) &&
          r.formData.datesPrevues.some(d => d.date === selectedDate)
        );
        const eventsDuJour = calendarEvents.filter(e => e.date === selectedDate);
        const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setSelectedDate(null)}>
            <div style={{ ...S.card, maxWidth: 580, width: "90%", maxHeight: "80vh", overflowY: "auto", marginBottom: 0 }} className="s-card" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ ...S.sectionTitle, margin: 0, border: "none", padding: 0, textTransform: "capitalize", fontSize: 15 }}>
                  Événements du {dateLabel}
                </h3>
                <button style={{ ...S.btn, padding: "4px 10px" }} onClick={() => setSelectedDate(null)}>✕</button>
              </div>

              {/* Activités et sorties */}
              {activitesDuJour.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gris, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Activités et sorties</div>
                  {activitesDuJour.map(r => {
                    const fd = r.formData || {};
                    const dInfo = fd.datesPrevues?.find(d => d.date === selectedDate);
                    const isCompleted = r.status === "traitee";
                    return (
                      <div key={r.id} style={{ padding: "10px 14px", marginBottom: 8, background: isCompleted ? "#f0fdf4" : "#fefce8", border: `1px solid ${isCompleted ? "#86efac" : "#fde68a"}`, borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.bleu }}>{fd.nomActivite || fd["Nom de l'activité"] || r.title}</span>
                          <span style={{ ...S.badge(getStatusMeta(r.type, r.status, workflowConfig).color) }}>{getStatusMeta(r.type, r.status, workflowConfig).label}</span>
                        </div>
                        {dInfo && <div style={{ fontSize: 12, color: COLORS.gris }}>{dInfo.heureDebut && dInfo.heureFin ? `${dInfo.heureDebut} – ${dInfo.heureFin}` : ""}</div>}
                        <div style={{ fontSize: 12, marginTop: 3 }}><strong>Niveaux :</strong> {(fd.niveauxConcernes || []).join(", ") || "—"} &nbsp;·&nbsp; <strong>Groupes :</strong> {fd.groupes || "—"}</div>
                        {fd.matieresConcernees?.length > 0 && <div style={{ fontSize: 12 }}><strong>Matières :</strong> {fd.matieresConcernees.join(", ")}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Événements personnalisés */}
              {eventsDuJour.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gris, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Événements</div>
                  {eventsDuJour.map(ev => {
                    const col = CUSTOM_EVENT_COLORS[ev.couleur] || CUSTOM_EVENT_COLORS.graphite;
                    return (
                      <div key={ev.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", marginBottom: 8, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{ev.title}</div>
                          {(ev.heureDebut || ev.heureFin) && (
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{ev.heureDebut}{ev.heureFin ? ` – ${ev.heureFin}` : ""}</div>
                          )}
                        </div>
                        {canManageCalendar && (
                          <button style={{ ...S.btnDanger, padding: "3px 8px", fontSize: 12, marginLeft: 12, flexShrink: 0 }}
                            onClick={async () => {
                              const updated = calendarEvents.filter(e => e.id !== ev.id);
                              await onSaveCalendarEvents(updated);
                            }}>
                            Supprimer
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activitesDuJour.length === 0 && eventsDuJour.length === 0 && (
                <p style={{ color: COLORS.gris, fontSize: 14 }}>Aucun événement à cette date.</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modal ajout d'événement ── */}
      {showAddEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowAddEvent(false)}>
          <div style={{ ...S.card, maxWidth: 460, width: "90%", marginBottom: 0 }} className="s-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ ...S.sectionTitle, margin: 0, border: "none", padding: 0, fontSize: 15 }}>Nouvel événement</h3>
              <button style={{ ...S.btn, padding: "4px 10px" }} onClick={() => setShowAddEvent(false)}>✕</button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Titre de l'événement <span style={{ color: COLORS.rouge }}>*</span></label>
              <input style={S.input} value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Ex : Réunion pédagogique" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Date(s) <span style={{ color: COLORS.rouge }}>*</span></label>
              {newEvent.dates.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  <input type="date" style={{ ...S.input, flex: "1 1 130px", minWidth: 120 }} value={d.date} onChange={e => {
                    const next = [...newEvent.dates]; next[i] = { ...d, date: e.target.value };
                    setNewEvent(p => ({ ...p, dates: next }));
                  }} />
                  <input type="time" style={{ ...S.input, flex: "0 0 100px" }} value={d.heureDebut} onChange={e => {
                    const next = [...newEvent.dates]; next[i] = { ...d, heureDebut: e.target.value };
                    setNewEvent(p => ({ ...p, dates: next }));
                  }} />
                  <span style={{ fontWeight: 700, flexShrink: 0 }}>à</span>
                  <input type="time" style={{ ...S.input, flex: "0 0 100px" }} value={d.heureFin} onChange={e => {
                    const next = [...newEvent.dates]; next[i] = { ...d, heureFin: e.target.value };
                    setNewEvent(p => ({ ...p, dates: next }));
                  }} />
                  <button type="button" style={{ ...S.btnDanger, padding: "4px 8px", fontSize: 14, flexShrink: 0 }} onClick={() => {
                    if (newEvent.dates.length > 1) setNewEvent(p => ({ ...p, dates: p.dates.filter((_, j) => j !== i) }));
                  }}>✕</button>
                </div>
              ))}
              <button type="button" style={{ ...S.btnSmall, marginTop: 4, fontSize: 16 }} onClick={() => setNewEvent(p => ({ ...p, dates: [...p.dates, { date: "", heureDebut: "", heureFin: "" }] }))}>+</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Couleur</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {GENERIC_EVENT_COLOR_KEYS.map((key) => {
                  const col = CUSTOM_EVENT_COLORS[key];
                  return (
                    <button key={key} type="button" title={col.label}
                      onClick={() => setNewEvent(p => ({ ...p, couleur: key }))}
                      style={{ width: 32, height: 32, borderRadius: "50%", background: col.dot, border: newEvent.couleur === key ? "3px solid #1e293b" : `2px solid ${col.dot}`, cursor: "pointer", flexShrink: 0 }} />
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["cpe", "ce"].map((key) => {
                  const col = CUSTOM_EVENT_COLORS[key];
                  const active = newEvent.couleur === key;
                  return (
                    <button key={key} type="button"
                      onClick={() => setNewEvent(p => ({ ...p, couleur: key }))}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, cursor: "pointer", background: active ? col.bg : "#fff", border: `1.5px solid ${active ? col.border : "#d9dee5"}` }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: col.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: active ? col.border : COLORS.gris }}>{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btnPrimary, opacity: savingEvent ? 0.7 : 1, cursor: savingEvent ? "not-allowed" : "pointer" }}
                disabled={savingEvent}
                onClick={async () => {
                  const datesValides = newEvent.dates.filter(d => d.date);
                  if (!newEvent.title.trim() || datesValides.length === 0) { alert("Le titre et au moins une date sont obligatoires."); return; }
                  setSavingEvent(true);
                  try {
                    // Une case + une heure par date : chaque date devient un événement distinct
                    // (même titre, même couleur), pour permettre plusieurs dates en un seul ajout.
                    const nouveaux = datesValides.map((d, i) => ({
                      id: Date.now() + i,
                      title: newEvent.title.trim(),
                      couleur: newEvent.couleur,
                      date: d.date, heureDebut: d.heureDebut, heureFin: d.heureFin,
                    }));
                    await onSaveCalendarEvents([...calendarEvents, ...nouveaux]);
                    setShowAddEvent(false);
                  } finally { setSavingEvent(false); }
                }}>
                {savingEvent ? "Sauvegarde…" : "Ajouter l'événement" + (newEvent.dates.filter(d => d.date).length > 1 ? "s" : "")}
              </button>
              <button style={S.btn} onClick={() => setShowAddEvent(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Role actions — toujours visible si au moins 1 rôle exécutant */}
      {(user.roles.some(r => ["A","A2","B","C2","C3","D"].includes(r)) || hasAnyC1(user.roles)) && (
        <div style={{ ...S.card, marginBottom: 24 }} className="s-card">
          <h3 style={{ ...S.sectionTitle, marginBottom: 16 }}>Actions requises</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { role: "A",  label: "Approbateur",  count: pendingA.length,  color: "#0284c7", queue: "queue_A", ok: user.roles.includes("A") },
              { role: "A2", label: "Approbateur +", count: pendingA2.length, color: "#2563eb", queue: "queue_A2", ok: user.roles.includes("A2") },
              { role: "B",  label: "Vérificateur", count: pendingB.length,  color: "#7c3aed", queue: "queue_B", ok: user.roles.includes("B") },
              { role: "C1", label: "Agent administratif",   count: pendingC1.length, color: "#ea580c", queue: "queue_C1", ok: hasAnyC1(user.roles) },
              { role: "C2", label: "Magasinier",   count: pendingC2.length, color: "#0891b2", queue: "queue_C2", ok: user.roles.includes("C2") },
              { role: "C3", label: "Concierge",    count: pendingC3.length, color: COLORS.vert, queue: "queue_C3", ok: user.roles.includes("C3") },
            ].filter(item => item.ok).map(item => (
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
        <div style={{ ...S.card, marginBottom: 20, background: "linear-gradient(135deg, #f0f8f4 0%, #e8f5ee 100%)", border: "1px solid #c3e6d4" }} className="s-card">
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

      {/* Brouillons en attente d'envoi */}
      {myDrafts.length > 0 && (
        <div style={{ ...S.card, background: "#fffbeb", border: "1px solid #fde68a" }} className="s-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ ...S.sectionTitle, margin: 0, border: "none", padding: 0, color: "#92400e" }}>💾 Mes brouillons ({myDrafts.length})</h3>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#7a5800" }}>
            Ces demandes n'ont pas encore été envoyées — reprenez-les pour les compléter et les soumettre.
          </p>
          <div className="s-table-wrap">
            <table style={S.table}>
              <thead>
                <tr>
                  {["Type", "Titre", "Dernière modification", "Actions"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myDrafts.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fffdf5" }}>
                    <td style={S.td}><span style={{ fontSize: 12 }}>{REQUEST_TYPES[r.type]}</span></td>
                    <td style={S.td}><strong>{r.title || "Brouillon sans titre"}</strong></td>
                    <td style={S.td}>{(r.updatedAt || r.date || "").toString().slice(0, 10)}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ ...S.btnPrimary, padding: "4px 12px", fontSize: 12 }} onClick={() => onContinueDraft(r)}>
                          Continuer
                        </button>
                        <button style={{ ...S.btnDanger, padding: "4px 12px", fontSize: 12 }} onClick={() => onDeleteDraft(r.id)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My requests list */}
      <div style={S.card} className="s-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ ...S.sectionTitle, margin: 0 }}>Mes demandes récentes</h3>
          <button style={{ ...S.btn, fontSize: 13, padding: "6px 14px" }} onClick={() => setView("history")}>
            Mon historique
          </button>
        </div>
        {myRequests.length === 0 ? (
          <p style={{ color: COLORS.gris, fontSize: 14 }}>Aucune demande pour l'instant. Créez votre première demande ci-dessus.</p>
        ) : (
          <div className="s-table-wrap">
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
                const st = getStatusMeta(r.type, r.status, workflowConfig);
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={S.td}>{r.id}</td>
                    <td style={S.td}><span style={{ fontSize: 12 }}>{REQUEST_TYPES[r.type]}</span></td>
                    <td style={S.td}><strong>{r.title}</strong></td>
                    <td style={S.td}>{r.date}</td>
                    <td style={S.td}>
                      <span style={{ ...S.badge(st.color), cursor: statusDefinitions[r.status] ? "help" : "default" }}
                        title={statusDefinitions[r.status] || ""}>
                        {st.label}
                      </span>
                    </td>
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
          </div>
        )}
      </div>
    </div>
  );
}
