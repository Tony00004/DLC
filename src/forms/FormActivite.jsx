import { useState, useEffect } from "react";
import { COLORS, MATIERES, NIVEAUX, config } from "../constants";
import { S } from "../styles";
import { resolveApprobateur } from "../utils/approbateur";
import { printZone } from "../utils/print";
import { F } from "../components/FormField";

export function FormActivite({ user, onSubmit, onBack, allUsers, initialData, editMode, approbateurRules = [], niveauxList = NIVEAUX, matieresList = MATIERES }) {
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
    coutLiberation: fd.coutLiberation || config.coutLiberationDefault, nbPeriodes: fd.nbPeriodes || "",
    coutTransport: fd.coutTransport || "", autreMontant: fd.autreMontant || "",
    typeTransport: fd.typeTransport || "", autreTransport: fd.autreTransport || "",
    nomEtablissement: fd.nomEtablissement || "", adresseComplete: fd.adresseComplete || "",
    personneContact: fd.personneContact || "", telephone: fd.telephone || "", poste: fd.poste || "",
    heureDepart: fd.heureDepart || "", heureRetour: fd.heureRetour || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rechercheResp, setRechercheResp] = useState("");
  const [dirAutoAssigned, setDirAutoAssigned] = useState(false);

  const approb = allUsers.filter(u => u.roles.includes("A") && !u.roles.includes("D"));

  // Auto-assign direction from rules when niveaux or matières selection changes
  useEffect(() => {
    const premierNiveau  = form.niveauxConcernes[0]    || "";
    const premiereMatiere = form.matieresConcernees[0] || "";
    if (!premierNiveau && !premiereMatiere) return;
    const resolved = resolveApprobateur(premiereMatiere, premierNiveau, approbateurRules, allUsers);
    if (resolved) { setForm(prev => ({ ...prev, directionResponsable: resolved.name })); setDirAutoAssigned(true); }
    else { setDirAutoAssigned(false); }
  }, [form.niveauxConcernes, form.matieresConcernees]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const niveaux  = niveauxList;
  const matieres = matieresList;
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
              <label style={S.label}>Direction responsable{dirAutoAssigned && <span style={{ color: "#0284c7", fontSize: 11, fontWeight: 400, marginLeft: 4 }}>(auto-assignée)</span>}<span style={{ color: COLORS.rouge }}> *</span></label>
              {dirAutoAssigned ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, border: "1px solid #bfc7d1", borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "#f0f7ff", color: COLORS.bleu, fontWeight: 600 }}>
                    {form.directionResponsable}
                  </div>
                  <button type="button" style={{ ...S.btn, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }} onClick={() => setDirAutoAssigned(false)}>
                    Modifier
                  </button>
                </div>
              ) : (
                <select style={S.select} value={form.directionResponsable} onChange={e => setForm({ ...form, directionResponsable: e.target.value })}>
                  <option value="">Sélectionnez</option>
                  {approb.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label style={S.label}>Liste des groupes concernés<span style={{ color: COLORS.rouge }}> *</span></label>
              <input style={S.input} placeholder="Ex: 101, 102, 203..." value={form.groupes} onChange={(e) => setForm({ ...form, groupes: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Activité dans le cadre d'une concentration (passion) ?<span style={{ color: COLORS.rouge }}> *</span></label>
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
              setForm({ responsables: [{ nom: user.name, courriel: user.email }], nomActivite: "", typeActivite: "", datesPrevues: [{ date: "", heureDebut: "09:15", heureFin: "15:40" }], description: "", niveauxConcernes: [], matieresConcernees: [], autreMatiere: "", autreNiveau: "", groupes: "", passion: "", passionTypes: [], passionAutres: "", obligatoire: "", autresClientele: "", coutEleve: "", nbEleves: "", coutAdulte: "", nbAdultes: "", coutLiberation: config.coutLiberationDefault, nbPeriodes: "", coutTransport: "", autreMontant: "", typeTransport: "", autreTransport: "", nomEtablissement: "", adresseComplete: "", personneContact: "", telephone: "", poste: "", heureDepart: "", heureRetour: "" });
              setError("");
            }}>Réinitialiser</button>}
            <button type="button" style={S.btn} onClick={onBack}>{editMode ? "Annuler les modifications" : "Annuler"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
