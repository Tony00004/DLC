import { useState, useEffect } from "react";
import { COLORS, MATIERES, NIVEAUX } from "../constants";
import { S } from "../styles";
import { resolveApprobateur } from "../utils/approbateur";
import { printZone } from "../utils/print";
import { F } from "../components/FormField";

export function FormAchat({ user, onSubmit, onBack, allUsers, initialData, editMode, onApprove, approbateurRules = [], niveauxList = NIVEAUX, matieresList = MATIERES }) {
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
  const [dirAutoAssigned, setDirAutoAssigned] = useState(false);
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

  // Auto-assign direction from rules whenever matière or niveau changes
  useEffect(() => {
    if (!matiere && !niveau) return;
    const resolved = resolveApprobateur(matiere, niveau, approbateurRules, allUsers);
    if (resolved) { setDirection(resolved.name); setDirAutoAssigned(true); }
    else { setDirAutoAssigned(false); }
  }, [matiere, niveau]); // eslint-disable-line react-hooks/exhaustive-deps

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
              {matieresList.map(m => <option key={m} value={m}>{m}</option>)}
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
              {niveauxList.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {niveau === "Autre" && (
              <input style={{ ...S.input, marginTop: 6 }} placeholder="Précisez le niveau" value={autreNiveau} onChange={e => setAutreNiveau(e.target.value)} />
            )}
          </F>
          <F label={<>Direction responsable {dirAutoAssigned && <span style={{ color: "#0284c7", fontSize: 11, fontWeight: 400, marginLeft: 4 }}>(auto-assignée)</span>}</>} required>
            {dirAutoAssigned ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, border: "1px solid #bfc7d1", borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "#f0f7ff", color: COLORS.bleu, fontWeight: 600 }}>
                  {direction}
                </div>
                <button type="button" style={{ ...S.btn, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }} onClick={() => setDirAutoAssigned(false)}>
                  Modifier
                </button>
              </div>
            ) : (
              <select style={S.select} value={direction} onChange={e => setDirection(e.target.value)}>
                <option value="">Sélectionnez</option>
                {approb.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            )}
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
            { label: "Demande en lien avec le budget d'une concentration (passion)", val: budgetPassion, set: setBudgetPassion },
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
