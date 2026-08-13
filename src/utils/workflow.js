// ─── Moteur de chaîne de traitement configurable ─────────────────────────────
// Chaque type de demande (achat, activite, requisition) est soumis à une suite
// d'« étapes d'approbation » modifiable par l'administrateur (onglet « Parcours
// des demandes »). Ce module centralise toute la logique qui dépend de cette
// chaîne, afin que RequestDetail / QueueView / Dashboard / HistoryView restent
// synchronisés avec la configuration au lieu de vérifier des statuts fixes.
import { STATUSES } from "../constants";

export const ROLE_LABELS = {
  A: "Approbateur", A2: "Approbateur +", B: "Vérificateur",
  C1: "Agent administratif", C2: "Magasinier", C3: "Concierge", D: "Administrateur",
};

export const ROLE_COLORS = {
  A: "#0284c7", A2: "#2563eb", B: "#7c3aed",
  C1: "#ea580c", C2: "#0891b2", C3: "#059669", D: "#dc2626",
};

const DEFAULT_ACTION_LABEL = {
  A: "Accepter", A2: "Autoriser", B: "Vérifier",
  C1: "Confirmer", C2: "Confirmer", C3: "Confirmer",
};

// Configuration par défaut — reproduit exactement le comportement historique de l'application.
export const DEFAULT_WORKFLOW_CONFIG = {
  achat: {
    approvalStages: [
      { id: "acceptee",  label: "Approuvée",                  role: "A",  actionLabel: "Accepter" },
      { id: "acceptee2", label: "Approuvée (Approbateur +)",  role: "A2", actionLabel: "Autoriser" },
      { id: "validee",   label: "Vérifiée",                   role: "B",  actionLabel: "Vérifier" },
    ],
    refusableBy: ["A", "A2", "B"],
  },
  activite: {
    approvalStages: [
      { id: "acceptee", label: "Approuvée", role: "A", actionLabel: "Accepter" },
      { id: "validee",  label: "Vérifiée",  role: "B", actionLabel: "Vérifier" },
    ],
    refusableBy: ["A", "B"],
  },
  requisition: {
    approvalStages: [
      { id: "validee", label: "Vérifiée", role: "B", actionLabel: "Vérifier" },
    ],
    refusableBy: ["B"],
    allowMagasinier: true,
    allowConcierge: true,
  },
};

export function cloneDefaultWorkflowConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_WORKFLOW_CONFIG));
}

// ── Statut de création (assigné à la soumission, avant toute étape d'approbation) ──
export function getCreationStatus(type) {
  return type === "requisition" ? "acceptee" : "soumise";
}
export function getCreationLabel(type) {
  return type === "requisition" ? "Reçue" : "Soumise";
}

export function getTypeConfig(type, workflowConfig) {
  return (workflowConfig && workflowConfig[type]) || DEFAULT_WORKFLOW_CONFIG[type];
}

export function getApprovalStages(type, workflowConfig) {
  const cfg = getTypeConfig(type, workflowConfig);
  return Array.isArray(cfg.approvalStages) ? cfg.approvalStages : [];
}

export function getRefusableBy(type, workflowConfig) {
  const cfg = getTypeConfig(type, workflowConfig);
  return Array.isArray(cfg.refusableBy) ? cfg.refusableBy : [];
}

export function allowsMagasinier(workflowConfig) {
  const cfg = getTypeConfig("requisition", workflowConfig);
  return cfg.allowMagasinier !== false;
}
export function allowsConcierge(workflowConfig) {
  const cfg = getTypeConfig("requisition", workflowConfig);
  return cfg.allowConcierge !== false;
}

// Statut requis pour que l'étape d'index i de la chaîne soit « active »
export function statusBeforeStage(type, stageIndex, workflowConfig) {
  const stages = getApprovalStages(type, workflowConfig);
  return stageIndex === 0 ? getCreationStatus(type) : stages[stageIndex - 1].id;
}

// Dernier statut de la chaîne d'approbation avant le traitement final (C1, ou attribution C2/C3)
export function getFinalApprovalStatus(type, workflowConfig) {
  const stages = getApprovalStages(type, workflowConfig);
  return stages.length > 0 ? stages[stages.length - 1].id : getCreationStatus(type);
}

// Étape (et son index) que l'utilisateur peut faire progresser depuis le statut courant
export function getAvailableAdvance(type, status, userRoles, workflowConfig, isAdmin) {
  const stages = getApprovalStages(type, workflowConfig);
  for (let i = 0; i < stages.length; i++) {
    if (status === statusBeforeStage(type, i, workflowConfig)) {
      if (isAdmin || (userRoles || []).includes(stages[i].role)) return { stage: stages[i], index: i, isLast: i === stages.length - 1 };
      return null;
    }
  }
  return null;
}

export function isPendingForRole(request, role, workflowConfig) {
  return !!getAvailableAdvance(request.type, request.status, [role], workflowConfig, false);
}

// La demande a atteint la fin de sa chaîne d'approbation (traitement final C1, ou déjà en cours de traitement)
export function isAtFinalProcessing(type, status, workflowConfig) {
  if (type === "requisition") return false; // géré via l'attribution C2/C3, cf. isPendingC2/C3
  const final = getFinalApprovalStatus(type, workflowConfig);
  return status === final || status === "commandee" || status === "partiellement_traitee";
}

export function isPendingC1(request, workflowConfig) {
  return ["achat", "activite"].includes(request.type) && isAtFinalProcessing(request.type, request.status, workflowConfig);
}

// ── Portée de l'agent administratif (C1) ──────────────────────────────────────
// Le rôle C1 peut être limité à un seul type de demande (achat de matériel et/ou
// activités et sorties). L'ancien rôle générique "C1" (comptes existants, jamais
// reconfigurés) équivaut toujours à un accès complet aux deux types.
export function effectiveC1Types(roles) {
  if (!roles) return [];
  if (roles.includes("C1")) return ["achat", "activite"];
  const types = [];
  if (roles.includes("C1_ACHAT")) types.push("achat");
  if (roles.includes("C1_ACTIVITE")) types.push("activite");
  return types;
}
export function hasAnyC1(roles) {
  return effectiveC1Types(roles).length > 0;
}
export function hasC1Scope(roles, type) {
  return effectiveC1Types(roles).includes(type);
}
export function isPendingC2(request, workflowConfig) {
  return (request.type === "achat" && isAtFinalProcessing("achat", request.status, workflowConfig))
      || (request.type === "requisition" && request.status === "validee_C2");
}
export function isPendingC3(request) {
  return request.type === "requisition" && request.status === "validee_C3";
}

export function canRoleRefuse(type, role, workflowConfig) {
  return getRefusableBy(type, workflowConfig).includes(role);
}

export function getActionLabel(stage) {
  return stage.actionLabel || DEFAULT_ACTION_LABEL[stage.role] || "Confirmer";
}

// Libellé + couleur d'un statut, en tenant compte de la chaîne configurée pour ce type
// (retombe sur les statuts fixes de constants.js pour les étapes non configurables).
export function getStatusMeta(type, status, workflowConfig) {
  if (status === getCreationStatus(type)) {
    return { label: getCreationLabel(type), color: "#64748b" };
  }
  const stages = getApprovalStages(type, workflowConfig);
  const st = stages.find(s => s.id === status);
  if (st) return { label: st.label, color: ROLE_COLORS[st.role] || "#64748b" };
  if (STATUSES[status]) return STATUSES[status];
  return { label: status, color: "#6b7280" };
}
