import { COLORS } from "../constants";
import { S } from "../styles";
import {
  ROLE_LABELS, ROLE_COLORS, DEFAULT_WORKFLOW_CONFIG,
  getCreationLabel, getApprovalStages, getRefusableBy, getTypeConfig,
  allowsMagasinier, allowsConcierge,
} from "../utils/workflow";

const TYPE_META = {
  achat:       { title: "🛒 Demande d'achat de matériel", finalLabel: "Traitée", finalRole: "C1" },
  activite:    { title: "🎒 Demande d'activités et de sorties", finalLabel: "Traitée", finalRole: "C1" },
  requisition: { title: "🔧 Demande de réquisition interne", finalLabel: "Traitée", finalRole: null },
};

const ALL_ROLES = ["A", "A2", "B", "C1", "C2", "C3", "D"];

const smallBtn = {
  border: "1px solid #c8d0d8", background: "#fff", borderRadius: 5, cursor: "pointer",
  fontSize: 12, padding: "2px 7px", lineHeight: 1.4,
};

export function AdminWorkflowTab({ workflowConfig, onUpdateWorkflowConfig }) {
  function addStage(type) {
    const stages = getApprovalStages(type, workflowConfig);
    const newStage = { id: "custom_" + Date.now(), label: "Nouvelle étape", role: "A", actionLabel: "" };
    onUpdateWorkflowConfig(prev => ({ ...prev, [type]: { ...getTypeConfig(type, prev), approvalStages: [...stages, newStage] } }));
  }
  function updateStage(type, index, patch) {
    const stages = getApprovalStages(type, workflowConfig).map((s, i) => (i === index ? { ...s, ...patch } : s));
    onUpdateWorkflowConfig(prev => ({ ...prev, [type]: { ...getTypeConfig(type, prev), approvalStages: stages } }));
  }
  function removeStage(type, index) {
    const stages = getApprovalStages(type, workflowConfig).filter((_, i) => i !== index);
    onUpdateWorkflowConfig(prev => ({ ...prev, [type]: { ...getTypeConfig(type, prev), approvalStages: stages } }));
  }
  function moveStage(type, index, dir) {
    const stages = [...getApprovalStages(type, workflowConfig)];
    const j = index + dir;
    if (j < 0 || j >= stages.length) return;
    [stages[index], stages[j]] = [stages[j], stages[index]];
    onUpdateWorkflowConfig(prev => ({ ...prev, [type]: { ...getTypeConfig(type, prev), approvalStages: stages } }));
  }
  function toggleRefusable(type, role) {
    const list = getRefusableBy(type, workflowConfig);
    const next = list.includes(role) ? list.filter(r => r !== role) : [...list, role];
    onUpdateWorkflowConfig(prev => ({ ...prev, [type]: { ...getTypeConfig(type, prev), refusableBy: next } }));
  }
  function toggleAttribution(field) {
    const other = field === "allowMagasinier" ? "allowConcierge" : "allowMagasinier";
    const current = field === "allowMagasinier" ? allowsMagasinier(workflowConfig) : allowsConcierge(workflowConfig);
    const otherVal = other === "allowMagasinier" ? allowsMagasinier(workflowConfig) : allowsConcierge(workflowConfig);
    if (current && !otherVal) { alert("Au moins une option d'attribution (Magasinier ou Concierge) doit rester active."); return; }
    onUpdateWorkflowConfig(prev => ({ ...prev, requisition: { ...getTypeConfig("requisition", prev), [field]: !current } }));
  }
  function resetType(type) {
    if (!window.confirm("Réinitialiser la chaîne de traitement de ce type de demande aux valeurs par défaut ?")) return;
    onUpdateWorkflowConfig(prev => ({ ...prev, [type]: JSON.parse(JSON.stringify(DEFAULT_WORKFLOW_CONFIG[type])) }));
  }

  function chip(active, onClick, label, color) {
    return (
      <span key={label} onClick={onClick} style={{
        display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 12, cursor: "pointer",
        fontWeight: active ? 700 : 400, border: `1px solid ${active ? color : "#c8d0d8"}`,
        background: active ? color + "18" : "#f6f7f9", color: active ? color : COLORS.gris,
        margin: "3px 6px 3px 0", userSelect: "none",
      }}>{label}</span>
    );
  }

  function renderStageBox(type, stage, index, total) {
    const color = ROLE_COLORS[stage.role] || "#64748b";
    return (
      <div key={stage.id} style={{ border: `2px solid ${color}`, borderRadius: 10, padding: "8px 10px", minWidth: 190, background: color + "0d", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center" }}>
          <button type="button" disabled={index === 0} style={{ ...smallBtn, opacity: index === 0 ? 0.4 : 1 }} title="Monter" onClick={() => moveStage(type, index, -1)}>↑</button>
          <button type="button" disabled={index === total - 1} style={{ ...smallBtn, opacity: index === total - 1 ? 0.4 : 1 }} title="Descendre" onClick={() => moveStage(type, index, 1)}>↓</button>
          <div style={{ flex: 1 }} />
          <button type="button" style={{ ...smallBtn, color: COLORS.rouge, borderColor: "#fca5a5" }} title="Retirer cette étape" onClick={() => removeStage(type, index)}>✕</button>
        </div>
        <input style={{ ...S.input, fontWeight: 700, fontSize: 13, marginBottom: 6, borderColor: color, padding: "6px 8px" }}
          value={stage.label} onChange={e => updateStage(type, index, { label: e.target.value })} placeholder="Nom de l'étape" />
        <select style={{ ...S.select, marginBottom: 6, padding: "6px 8px", fontSize: 12, fontWeight: 700, color }}
          value={stage.role} onChange={e => updateStage(type, index, { role: e.target.value })}>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r} — {ROLE_LABELS[r]}</option>)}
        </select>
        <input style={{ ...S.input, fontSize: 12, padding: "6px 8px" }}
          value={stage.actionLabel || ""} onChange={e => updateStage(type, index, { actionLabel: e.target.value })}
          placeholder="Libellé du bouton (optionnel)" />
      </div>
    );
  }

  function fixedBox(label, role) {
    const color = role ? (ROLE_COLORS[role] || "#64748b") : COLORS.vert;
    return (
      <div style={{ border: `2px dashed ${color}`, borderRadius: 10, padding: "10px 14px", minWidth: 150, textAlign: "center", background: "#fff", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12.5, color }}>{label}</div>
        {role && <div style={{ fontSize: 10, color: COLORS.gris, marginTop: 2 }}>{role} — {ROLE_LABELS[role]}</div>}
        <div style={{ fontSize: 9.5, color: "#9ca3af", marginTop: 4 }}>étape fixe</div>
      </div>
    );
  }

  const arrow = <div style={{ fontSize: 20, color: "#94a3b8", padding: "0 4px", flexShrink: 0 }}>→</div>;

  function renderLane(type) {
    const meta = TYPE_META[type];
    const stages = getApprovalStages(type, workflowConfig);
    const refusableBy = getRefusableBy(type, workflowConfig);
    return (
      <div key={type} style={{ border: "1px solid #d9dee5", borderRadius: 10, padding: "18px 20px", marginBottom: 20, background: "#fafbfc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: COLORS.bleu }}>{meta.title}</h4>
          <button type="button" style={{ ...S.btn, fontSize: 12, padding: "5px 12px" }} onClick={() => resetType(type)}>↺ Réinitialiser par défaut</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", paddingBottom: 8, flexWrap: "wrap" }}>
          {fixedBox(getCreationLabel(type), null)}
          {stages.map((stage, i) => (
            <div key={stage.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {arrow}
              {renderStageBox(type, stage, i, stages.length)}
            </div>
          ))}
          {arrow}
          <button type="button" onClick={() => addStage(type)} style={{ ...S.btnSmall, minWidth: 44, height: 44, borderRadius: 10, fontSize: 22 }} title="Ajouter une étape">+</button>
          {arrow}
          {type === "requisition" ? (
            <>
              {allowsConcierge(workflowConfig) && <>{fixedBox("Attribuée — Concierge → Traitée", "C3")}</>}
              {allowsMagasinier(workflowConfig) && <>{arrow}{fixedBox("Attribuée — Magasinier → Traitée", "C2")}</>}
            </>
          ) : (
            fixedBox(meta.finalLabel, meta.finalRole)
          )}
        </div>

        {type === "requisition" && (
          <div style={{ marginTop: 14, display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { field: "allowMagasinier", label: "Autoriser l'attribution au Magasinier (C2)", val: allowsMagasinier(workflowConfig) },
              { field: "allowConcierge",  label: "Autoriser l'attribution au Concierge (C3)",  val: allowsConcierge(workflowConfig) },
            ].map(({ field, label, val }) => (
              <div key={field} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: val ? "#f0fdf4" : "#f9fafb", border: `1px solid ${val ? "#86efac" : "#e5e7eb"}`, borderRadius: 8 }}>
                <div style={{ position: "relative", width: 38, height: 21, cursor: "pointer" }} onClick={() => toggleAttribution(field)}>
                  <div style={{ width: 38, height: 21, borderRadius: 11, background: val ? COLORS.vert : "#d1d5db", transition: "background 0.2s" }} />
                  <div style={{ position: "absolute", top: 2, left: val ? 19 : 2, width: 17, height: 17, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
                <span style={{ fontSize: 12.5 }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gris, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Qui peut refuser une demande de ce type ?
          </div>
          <div>
            {ALL_ROLES.filter(r => r !== "D").map(r => chip(refusableBy.includes(r), () => toggleRefusable(type, r), `${r} — ${ROLE_LABELS[r]}`, ROLE_COLORS[r]))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: COLORS.bleu }}>Parcours des demandes</h3>
        <p style={{ margin: 0, color: COLORS.gris, fontSize: 13 }}>
          Visualisez et modifiez la chaîne d'approbation de chaque type de demande : ajoutez, retirez, réordonnez ou réattribuez les étapes.
          L'étape finale de traitement (agent administratif / attribution magasinier-concierge) reste fixe, mais tout ce qui précède est entièrement modifiable.
        </p>
      </div>

      <div style={{ padding: "10px 14px", background: "#fff5f5", border: "1px solid #fca5a5", borderLeft: "4px solid #b42318", borderRadius: 6, fontSize: 12, color: "#7f1d1d", marginBottom: 20 }}>
        ⚠️ Modifier une chaîne déjà en cours d'utilisation peut affecter les demandes actuellement à une étape retirée ou renommée : elles resteront visibles dans l'historique mais pourraient ne plus apparaître dans aucune file d'attente tant qu'un administrateur ne les réoriente pas manuellement.
      </div>

      {renderLane("achat")}
      {renderLane("activite")}
      {renderLane("requisition")}
    </div>
  );
}
