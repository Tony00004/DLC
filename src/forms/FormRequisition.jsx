import { useState } from "react";
import { COLORS } from "../constants";
import { S } from "../styles";
import { DrawingZone } from "../components/DrawingZone";
import { printZone } from "../utils/print";
import { F } from "../components/FormField";

export function FormRequisition({ user, onSubmit, onBack, serviceTypes, editMode, initialData }) {
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
          <DrawingZone initialShapes={form.drawing} onChange={(shapes) => setForm(prev => ({ ...prev, drawing: shapes }))} />

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
