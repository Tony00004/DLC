import { useState } from "react";
import { COLORS, MATIERES, NIVEAUX, config, DEFAULT_FORM_MESSAGES } from "../constants";
import { S } from "../styles";
import { AdminWorkflowTab } from "./AdminWorkflowTab";

export function AdminView({ onBack, allUsers, onUpdateRoles, serviceTypes, onUpdateServiceTypes, activeForms, onUpdateActiveForms, statusDefinitions = {}, onUpdateStatusDefinitions, approbateurRules = [], onUpdateApprobateurRules, niveauxList = [], matieresList = [], onUpdateNiveauxList, onUpdateMatieresList, workflowConfig, onUpdateWorkflowConfig, notificationConfig, onUpdateNotificationConfig, showDemoAccounts = true, onUpdateShowDemoAccounts, fournisseurList = [], onUpdateFournisseurList, passionCategories = [], onUpdatePassionCategories, formMessages = DEFAULT_FORM_MESSAGES, onUpdateFormMessages }) {
  const [activeTab, setActiveTab] = useState("droits");
  const [users, setUsers] = useState(allUsers.map((u) => ({ ...u })));
  const [sortRole, setSortRole] = useState(null);
  const [newServiceType, setNewServiceType] = useState("");
  const [newNiveau,      setNewNiveau]      = useState("");
  const [newMatiere,     setNewMatiere]     = useState("");
  const [newFournisseur, setNewFournisseur] = useState("");
  const [newPassionCategory, setNewPassionCategory] = useState("");
  const [newSubOption, setNewSubOption] = useState({});
  const [savedMsg, setSavedMsg] = useState("");

  function toggleRole(userId, role) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, roles: u.roles.includes(role) ? u.roles.filter((r) => r !== role) : [...u.roles, role] }
          : u
      )
    );
  }

  function save() {
    onUpdateRoles(users);
    setSavedMsg("✓ Modifications enregistrées");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  // Éditeur d'un message conditionnel de formulaire (affiché selon une case cochée / une
  // réponse donnée). Champ non contrôlé (defaultValue) pour ne pas re-rendre à chaque frappe ;
  // la clé forcée sur la valeur courante permet de le remonter si la valeur change ailleurs.
  function messageEditor(key, label, hint) {
    const id = `msg-${key}`;
    const current = (formMessages && formMessages[key]) ?? DEFAULT_FORM_MESSAGES[key];
    return (
      <div style={{ marginTop: 20 }}>
        <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>{label}</h4>
        {hint && <p style={{ margin: "0 0 8px", fontSize: 12, color: COLORS.gris }}>{hint}</p>}
        <textarea key={current} id={id} defaultValue={current} rows={3} style={{ ...S.textarea, width: "100%" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="button" style={S.btnPrimary} onClick={() => {
            const val = document.getElementById(id).value;
            if (onUpdateFormMessages) onUpdateFormMessages(prev => ({ ...prev, [key]: val }));
          }}>Enregistrer</button>
          <button type="button" style={S.btn} onClick={() => {
            if (onUpdateFormMessages) onUpdateFormMessages(prev => ({ ...prev, [key]: DEFAULT_FORM_MESSAGES[key] }));
          }}>↺ Réinitialiser</button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "droits",        label: "Gestion des droits",             icon: "👥" },
    { id: "parcours",      label: "Parcours des demandes",          icon: "🧭" },
    { id: "approbateurs",  label: "Assignation des approbateurs",   icon: "📋" },
    { id: "statuts",       label: "Définitions des statuts",        icon: "🏷️" },
    { id: "achat",         label: "Formulaire — Achat matériel",    icon: "🛒" },
    { id: "activite",      label: "Formulaire — Activités/Sorties", icon: "🎒" },
    { id: "requisition",   label: "Formulaire — Réquisition interne", icon: "🔧" },
    { id: "notifications",  label: "Notifications par courriel",     icon: "📧" },
  ];

  const NOTIF_ROLES = [
    { role: "A",  label: "Approbateur",         color: "#0284c7" },
    { role: "A2", label: "Approbateur +",       color: "#2563eb" },
    { role: "B",  label: "Vérificateur",        color: "#7c3aed" },
    { role: "C1", label: "Agent administratif", color: "#ea580c" },
    { role: "C2", label: "Magasinier",          color: "#0891b2" },
    { role: "C3", label: "Concierge",           color: "#16a34a" },
  ];
  const notifRoles = notificationConfig?.roles || {};
  const requesterMode = notificationConfig?.requester?.mode || "each_stage";

  function updateRequesterMode(mode) {
    onUpdateNotificationConfig(prev => ({ ...prev, requester: { ...prev.requester, mode } }));
  }
  function updateRoleField(role, field, value) {
    onUpdateNotificationConfig(prev => ({
      ...prev,
      roles: { ...prev.roles, [role]: { ...prev.roles[role], [field]: value } },
    }));
  }
  function updateTemplateField(kind, field, value) {
    onUpdateNotificationConfig(prev => ({
      ...prev,
      templates: { ...prev.templates, [kind]: { ...prev.templates[kind], [field]: value } },
    }));
  }

  function addPassionCategory() {
    const name = newPassionCategory.trim();
    if (name && !passionCategories.some(c => c.name === name)) {
      onUpdatePassionCategories(prev => [...prev, { name, subOptions: [] }]);
      setNewPassionCategory("");
    }
  }
  function removePassionCategory(name) {
    onUpdatePassionCategories(prev => prev.filter(c => c.name !== name));
  }
  function addSubOption(catName) {
    const val = (newSubOption[catName] || "").trim();
    if (!val) return;
    onUpdatePassionCategories(prev => prev.map(c => c.name === catName
      ? { ...c, subOptions: c.subOptions.includes(val) ? c.subOptions : [...c.subOptions, val] }
      : c));
    setNewSubOption(prev => ({ ...prev, [catName]: "" }));
  }
  function removeSubOption(catName, sub) {
    onUpdatePassionCategories(prev => prev.map(c => c.name === catName
      ? { ...c, subOptions: c.subOptions.filter(s => s !== sub) }
      : c));
  }
  function passionCategoriesEditor() {
    return (
      <div style={{ marginTop: 20 }}>
        <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>Catégories de concentration (passion)</h4>
        <p style={{ fontSize: 12, color: COLORS.gris, marginBottom: 10 }}>
          S'applique aux deux formulaires : Achat de matériel et Activités/Sorties. Une catégorie peut avoir des sous-choix (un seul sélectionnable à la fois) — laissez-la sans sous-choix pour une simple case à cocher. « Autres (précisez) » reste toujours disponible en dernier, sans configuration.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {passionCategories.map((cat) => (
            <div key={cat.name} style={{ padding: "10px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <strong style={{ fontSize: 14, flex: 1 }}>{cat.name}</strong>
                <button type="button"
                  style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.rouge, fontWeight: 700, fontSize: 15, padding: "0 2px", lineHeight: 1 }}
                  onClick={() => removePassionCategory(cat.name)}
                  title="Supprimer la catégorie">✕</button>
              </div>
              {cat.subOptions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {cat.subOptions.map((sub) => (
                    <div key={sub} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #d9dee5", borderRadius: 16, padding: "3px 10px 3px 12px", fontSize: 12 }}>
                      <span>{sub}</span>
                      <button type="button"
                        style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.rouge, fontWeight: 700, fontSize: 13, padding: "0 2px", lineHeight: 1 }}
                        onClick={() => removeSubOption(cat.name, sub)}
                        title="Retirer">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <input style={{ ...S.input, maxWidth: 220, fontSize: 12, padding: "5px 8px" }}
                  placeholder="Nouveau sous-choix…"
                  value={newSubOption[cat.name] || ""}
                  onChange={e => setNewSubOption(prev => ({ ...prev, [cat.name]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
                <button type="button" style={{ ...S.btn, fontSize: 12, padding: "5px 10px" }} onClick={() => addSubOption(cat.name)}>+ Ajouter</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <input style={{ ...S.input, maxWidth: 280 }}
            placeholder="Nouvelle catégorie…"
            value={newPassionCategory}
            onChange={e => setNewPassionCategory(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
          <button type="button" style={S.btnPrimary} onClick={addPassionCategory}>+ Ajouter une catégorie</button>
        </div>
      </div>
    );
  }

  const tabBtn = (id) => ({
    padding: "10px 18px", fontSize: 13, borderRadius: "8px 8px 0 0", cursor: "pointer",
    fontWeight: activeTab === id ? 700 : 500,
    background: activeTab === id ? "#fff" : "#f0f2f5",
    color: activeTab === id ? COLORS.bleu : COLORS.gris,
    border: "1px solid #d9dee5",
    borderBottom: activeTab === id ? "1px solid #fff" : "1px solid #d9dee5",
    marginRight: 4, marginBottom: -1, position: "relative", zIndex: activeTab === id ? 2 : 1,
    transition: "all .12s",
  });

  const sectionTitle = (txt, sub) => (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: COLORS.bleu }}>{txt}</h3>
      {sub && <p style={{ margin: 0, color: COLORS.gris, fontSize: 13 }}>{sub}</p>}
    </div>
  );

  return (
    <div style={S.content} className="s-content">
      <button style={{ ...S.btn, marginBottom: 16 }} onClick={onBack}>← Retour</button>

      {/* En-tête */}
      <div style={{ background: COLORS.bleu, borderRadius: "12px 12px 0 0", padding: "20px 28px", marginBottom: 0 }}>
        <h2 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 700 }}>⚙️ Administration</h2>
        <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
          Paramètres du système DLC — École de la Croisée / CSS Laval
        </p>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", flexWrap: "wrap", padding: "0 12px", background: "#f0f2f5", borderLeft: "1px solid #d9dee5", borderRight: "1px solid #d9dee5" }}>
        {TABS.map(t => (
          <button key={t.id} style={tabBtn(t.id)} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div style={{ background: "#fff", border: "1px solid #d9dee5", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "28px 32px" }}>

        {/* ── Onglet : Gestion des droits ── */}
        {activeTab === "droits" && (
          <div>
            {sectionTitle("Gestion des droits des utilisateurs", "Attribuez les rôles à chaque membre du personnel. Un utilisateur peut avoir plusieurs rôles simultanément.")}

            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 8, border: `1px solid ${showDemoAccounts ? "#f59e0b55" : "#e5e7eb"}`, background: showDemoAccounts ? "#fffbeb" : "#f9fafb", marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: showDemoAccounts ? "#b45309" : "#9ca3af" }}>
                  {showDemoAccounts ? "⚠️ Comptes de démonstration visibles" : "✓ Comptes de démonstration masqués"}
                </div>
                <div style={{ fontSize: 12, color: COLORS.gris, marginTop: 2 }}>
                  {showDemoAccounts
                    ? "La liste des comptes de test (identifiant + mot de passe) est affichée sur la page de connexion — visible par n'importe qui."
                    : "La page de connexion n'affiche plus la liste des comptes de test."}
                </div>
              </div>
              <div style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}
                onClick={() => onUpdateShowDemoAccounts(!showDemoAccounts)}>
                <div style={{ width: 44, height: 24, borderRadius: 12, background: showDemoAccounts ? "#f59e0b" : "#d1d5db", transition: "background 0.2s" }} />
                <div style={{ position: "absolute", top: 3, left: showDemoAccounts ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: showDemoAccounts ? "#b45309" : "#9ca3af", minWidth: 60, textAlign: "right" }}>{showDemoAccounts ? "Visibles" : "Masqués"}</span>
            </div>

            {/* Légende des rôles — 3 colonnes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }} className="s-grid3">
              {[
                { role: "A",  label: "Approbateur",    desc: "Approuve les demandes d'achat et d'activité",   color: "#0284c7" },
                { role: "A2", label: "Approbateur +",  desc: "Autorise les demandes d'achat de matériel avant le vérificateur", color: "#2563eb" },
                { role: "B",  label: "Vérificateur",   desc: "Vérifie toutes les demandes approuvées",        color: "#7c3aed" },
                { role: "C1", label: "Agent administratif",     desc: "Traite les achats et activités vérifiés",       color: "#ea580c" },
                { role: "C2", label: "Magasinier",     desc: "Reçoit et complète les commandes d'achat",      color: "#0891b2" },
                { role: "C3", label: "Concierge",      desc: "Traite les réquisitions internes vérifiées",    color: "#059669" },
                { role: "D",  label: "Administrateur", desc: "Accès complet au système",                      color: "#dc2626" },
              ].map(r => (
                <div key={r.role} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${r.color}33`, background: r.color + "08", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontWeight: 900, fontSize: 18, color: r.color, minWidth: 28, marginTop: 1 }}>{r.role}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: r.color }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: COLORS.gris, marginTop: 2 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Ajouter un utilisateur ── */}
            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>➕ Ajouter un utilisateur</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end", marginBottom: 28, padding: "16px 18px", background: "#f6f7f9", borderRadius: 8, border: "1px solid #e5e7eb" }} className="s-grid2">
              <div>
                <label style={S.label}>Nom complet <span style={{ color: COLORS.rouge }}>*</span></label>
                <input id="new-user-name" style={S.input} placeholder="Ex : Julie Tremblay" onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
              </div>
              <div>
                <label style={S.label}>Identifiant courriel <span style={{ color: COLORS.rouge }}>*</span></label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #bfc7d1", borderRadius: 6, overflow: "hidden" }}>
                  <input id="new-user-email" style={{ ...S.input, border: "none", flex: 1 }} placeholder="identifiant" onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
                  <span style={{ padding: "0 8px", background: "#f3f4f6", fontSize: 11, color: COLORS.gris, whiteSpace: "nowrap", borderLeft: "1px solid #bfc7d1", lineHeight: "38px" }}>@csslaval.gouv.qc.ca</span>
                </div>
              </div>
              <div>
                <label style={S.label}>Mot de passe temporaire <span style={{ color: COLORS.rouge }}>*</span></label>
                <input id="new-user-password" style={S.input} placeholder="Ex : Bienvenue2026!" type="text" onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
              </div>
              <button type="button" style={{ ...S.btnPrimary, height: 40, whiteSpace: "nowrap" }} onClick={() => {
                const name  = document.getElementById("new-user-name").value.trim();
                const email = document.getElementById("new-user-email").value.trim();
                const pwd   = document.getElementById("new-user-password").value.trim();
                if (!name || !email || !pwd) { alert("Veuillez remplir les 3 champs pour ajouter un utilisateur."); return; }
                if (users.find(u => u.email === email)) { alert("Un utilisateur avec cet identifiant existe déjà."); return; }
                const newUser = { id: Date.now(), name, email, password: pwd, roles: [] };
                setUsers(prev => [...prev, newUser]);
                document.getElementById("new-user-name").value = "";
                document.getElementById("new-user-email").value = "";
                document.getElementById("new-user-password").value = "";
                setSavedMsg("✓ Utilisateur ajouté — cliquez sur Enregistrer pour confirmer");
                setTimeout(() => setSavedMsg(""), 5000);
              }}>+ Ajouter</button>
            </div>

            {/* ── Tableau des utilisateurs ── */}
            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>
              Utilisateurs du système ({users.length})
            </h4>
            <p style={{ fontSize: 12, color: COLORS.gris, marginTop: -6, marginBottom: 10 }}>
              💡 Cliquez sur un rôle dans l'en-tête du tableau pour regrouper les utilisateurs qui le possèdent en tête de liste.
            </p>
            <div style={{ overflowX: "auto", marginBottom: 18 }} className="s-table-wrap">
              <table style={{ ...S.table, minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={S.th}>Nom</th>
                    <th style={S.th}>Courriel</th>
                    {[
                      { role: "A",  label: "Approbateur",    color: "#0284c7" },
                      { role: "A2", label: "Approbateur +",  color: "#2563eb" },
                      { role: "B",  label: "Vérificateur",   color: "#7c3aed" },
                      { role: "C1", label: "Agent administratif",     color: "#ea580c" },
                      { role: "C2", label: "Magasinier",     color: "#0891b2" },
                      { role: "C3", label: "Concierge",      color: "#059669" },
                      { role: "D",  label: "Administrateur", color: "#dc2626" },
                    ].map(r => (
                      <th key={r.role}
                        onClick={() => setSortRole(prev => prev === r.role ? null : r.role)}
                        title={`Regrouper les utilisateurs « ${r.label} » en tête de liste`}
                        style={{
                          ...S.th, textAlign: "center", color: r.color, minWidth: 80, cursor: "pointer", userSelect: "none",
                          background: sortRole === r.role ? r.color + "22" : S.th.background,
                          boxShadow: sortRole === r.role ? `inset 0 -3px 0 ${r.color}` : undefined,
                        }}>
                        <div style={{ fontSize: 10, fontWeight: 900 }}>{r.role}{sortRole === r.role ? " ▾" : ""}</div>
                        <div style={{ fontSize: 10, fontWeight: 600 }}>{r.label}</div>
                      </th>
                    ))}
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {(sortRole ? [...users].sort((a, b) => Number(b.roles.includes(sortRole)) - Number(a.roles.includes(sortRole))) : users).map((u, i) => {
                    const isAdminUser = u.roles.includes("D");
                    return (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={S.td}>
                          <strong>{u.name}</strong>
                          {isAdminUser && <span style={{ marginLeft: 6, fontSize: 10, background: "#dc262618", color: "#dc2626", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>ADMIN</span>}
                        </td>
                        <td style={{ ...S.td, fontSize: 12, color: COLORS.gris }}>{u.email}@csslaval.gouv.qc.ca</td>
                        {["A", "A2", "B", "C1", "C2", "C3", "D"].map((role) => (
                          <td key={role} style={{ ...S.td, textAlign: "center" }}>
                            <input type="checkbox" checked={u.roles.includes(role)} onChange={() => toggleRole(u.id, role)}
                              style={{ width: 16, height: 16, cursor: "pointer" }} />
                          </td>
                        ))}
                        <td style={{ ...S.td, textAlign: "center" }}>
                          <button type="button"
                            title="Retirer cet utilisateur"
                            style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 5, color: COLORS.rouge, cursor: "pointer", fontSize: 13, padding: "3px 8px", fontWeight: 700 }}
                            onClick={() => {
                              if (u.roles.includes("D") && users.filter(x => x.roles.includes("D")).length === 1) {
                                alert("Impossible de retirer le dernier administrateur du système.");
                                return;
                              }
                              if (window.confirm(`Retirer ${u.name} du système ?

Cette action est immédiate. Cliquez sur « Enregistrer » pour confirmer.`)) {
                                setUsers(prev => prev.filter(x => x.id !== u.id));
                                setSavedMsg("✓ Utilisateur retiré — cliquez sur Enregistrer pour confirmer");
                                setTimeout(() => setSavedMsg(""), 5000);
                              }
                            }}>
                            🗑 Retirer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button style={S.btnPrimary} onClick={save}>Enregistrer les modifications</button>
              {savedMsg && <span style={{ color: savedMsg.includes("retiré") ? COLORS.rouge : COLORS.vert, fontSize: 13, fontWeight: 600 }}>{savedMsg}</span>}
            </div>
            <p style={{ fontSize: 12, color: COLORS.gris, marginTop: 8 }}>
              ℹ️ Les ajouts et retraits sont temporaires jusqu'à ce que vous cliquiez sur « Enregistrer les modifications ».
            </p>
          </div>
        )}

        {/* ── Onglet : Parcours des demandes ── */}
        {activeTab === "parcours" && (
          <AdminWorkflowTab workflowConfig={workflowConfig} onUpdateWorkflowConfig={onUpdateWorkflowConfig} />
        )}

        {/* ── Onglet : Définitions des statuts ── */}
        {activeTab === "statuts" && (
          <div>
            {sectionTitle("Définitions des statuts", "Ces textes s'affichent en bulle d'aide lorsque l'utilisateur survole un statut dans « Mes demandes récentes ».")}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "soumise",               label: "Soumise",                color: "#64748b" },
                { key: "acceptee",              label: "Approuvée",              color: "#0284c7" },
                { key: "acceptee2",             label: "Approuvée (Approbateur +)", color: "#2563eb" },
                { key: "validee",               label: "Vérifiée",               color: "#7c3aed" },
                { key: "commandee",             label: "En commande",            color: "#ea580c" },
                { key: "partiellement_traitee", label: "Partiellement complétée", color: "#f59e0b" },
                { key: "traitee",               label: "Traitée",                color: "#008c4a" },
                { key: "refusee",               label: "Refusée",                color: "#b42318" },
                { key: "annulee",               label: "Annulée",                color: "#78350f" },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "center", padding: "12px 16px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }} className="s-grid2">
                  <span style={{ ...S.badge(color), fontSize: 13, textAlign: "center" }}>{label}</span>
                  <input
                    style={S.input}
                    value={statusDefinitions[key] || ""}
                    onChange={e => onUpdateStatusDefinitions(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Définition du statut « ${label} »…`}
                  />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: COLORS.gris, marginTop: 14 }}>
              ℹ️ Les modifications sont appliquées immédiatement pour tous les utilisateurs.
            </p>
          </div>
        )}

        {/* ── Onglet : Assignation des approbateurs ── */}
        {activeTab === "approbateurs" && (() => {
          const approbUsers = allUsers.filter(u => u.roles.includes("A") && !u.roles.includes("D"));

          function addRule() {
            if (approbUsers.length === 0) return;
            const newId = (approbateurRules.length > 0 ? Math.max(...approbateurRules.map(r => r.id)) : 0) + 1;
            onUpdateApprobateurRules([...approbateurRules, { id: newId, approbateurId: approbUsers[0].id, matieres: [], niveaux: [] }]);
          }

          function removeRule(id) {
            onUpdateApprobateurRules(approbateurRules.filter(r => r.id !== id));
          }

          function updateRule(id, field, value) {
            onUpdateApprobateurRules(approbateurRules.map(r => r.id === id ? { ...r, [field]: value } : r));
          }

          function toggleItem(id, field, item) {
            const rule = approbateurRules.find(r => r.id === id);
            if (!rule) return;
            const arr = rule[field];
            updateRule(id, field, arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
          }

          const chipStyle = (active) => ({
            display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 12, cursor: "pointer",
            fontWeight: active ? 700 : 400, border: `1px solid ${active ? COLORS.vert : "#c8d0d8"}`,
            background: active ? COLORS.vert + "18" : "#f6f7f9", color: active ? COLORS.vertFonce : COLORS.gris,
            margin: "3px 3px 3px 0", userSelect: "none",
          });

          return (
            <div>
              {sectionTitle("Assignation des approbateurs", "Définissez quelles matières et quels niveaux sont associés à chaque direction. Le système attribuera automatiquement la direction responsable lors de la soumission d'une demande d'achat ou d'activité.")}

              <div style={{ padding: "12px 16px", background: "#e8f0fe", borderRadius: 8, border: "1px solid #c7d9f5", fontSize: 13, color: "#174ea6", marginBottom: 20 }}>
                ℹ️ Une règle correspond si <strong>toutes</strong> les conditions non vides sont respectées. Laisser une liste vide signifie « toutes les valeurs ». Si plusieurs règles s'appliquent, la première de la liste est utilisée. Si aucune règle ne s'applique, le demandeur sélectionne la direction manuellement.
              </div>

              {approbateurRules.length === 0 && (
                <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 16 }}>Aucune règle définie — les demandeurs choisissent la direction manuellement.</p>
              )}

              {approbateurRules.map((rule, idx) => {
                const approbUser = allUsers.find(u => u.id === rule.approbateurId);
                return (
                  <div key={rule.id} style={{ border: "1px solid #d9dee5", borderRadius: 10, padding: "18px 20px", marginBottom: 16, background: "#fafbfc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.bleu }}>Règle #{idx + 1}</span>
                      <button type="button" style={{ ...S.btnDanger, padding: "3px 10px", fontSize: 12 }} onClick={() => removeRule(rule.id)}>✕ Supprimer</button>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={S.label}>Direction responsable (approbateur)</label>
                      <select style={{ ...S.select, maxWidth: 300 }} value={rule.approbateurId}
                        onChange={e => updateRule(rule.id, "approbateurId", Number(e.target.value))}>
                        {approbUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={S.label}>Matières couvertes <span style={{ color: COLORS.gris, fontWeight: 400, fontSize: 12 }}>(vide = toutes)</span></label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                        {MATIERES.filter(m => m !== "Autre").map(m => (
                          <span key={m} style={chipStyle(rule.matieres.includes(m))} onClick={() => toggleItem(rule.id, "matieres", m)}>{m}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={S.label}>Niveaux couverts <span style={{ color: COLORS.gris, fontWeight: 400, fontSize: 12 }}>(vide = tous)</span></label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                        {NIVEAUX.filter(n => n !== "Autre" && n !== "Non applicable").map(n => (
                          <span key={n} style={chipStyle(rule.niveaux.includes(n))} onClick={() => toggleItem(rule.id, "niveaux", n)}>{n}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button type="button" style={S.btnPrimary} onClick={addRule} disabled={approbUsers.length === 0}>
                + Ajouter une règle
              </button>
              {approbUsers.length === 0 && (
                <p style={{ color: COLORS.rouge, fontSize: 13, marginTop: 8 }}>Aucun utilisateur avec le rôle Approbateur (A) — assignez d'abord ce rôle dans l'onglet « Gestion des droits ».</p>
              )}
            </div>
          );
        })()}

        {/* ── Onglet : Formulaire Achat ── */}
        {activeTab === "achat" && (
          <div>
            {sectionTitle("Modification du formulaire « Demande d'achat de matériel »", "Paramétrez les options disponibles dans ce formulaire.")}
            {(() => {
              const isActive = activeForms ? activeForms["achat"] !== false : true;
              const color = "#0284c7";
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 8, border: `1px solid ${isActive ? color + "55" : "#e5e7eb"}`, background: isActive ? color + "08" : "#f9fafb", marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? color : "#9ca3af" }}>{isActive ? "✓ Formulaire actif" : "✗ Formulaire inactif"}</div>
                    <div style={{ fontSize: 12, color: COLORS.gris, marginTop: 2 }}>{isActive ? "Les utilisateurs peuvent soumettre ce type de demande." : "Ce formulaire est désactivé — aucune nouvelle soumission n'est possible."}</div>
                  </div>
                  <div style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}
                    onClick={() => { if (onUpdateActiveForms) onUpdateActiveForms(prev => ({ ...prev, achat: !isActive })); }}>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: isActive ? color : "#d1d5db", transition: "background 0.2s" }} />
                    <div style={{ position: "absolute", top: 3, left: isActive ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? color : "#9ca3af", minWidth: 46 }}>{isActive ? "Actif" : "Inactif"}</span>
                </div>
              );
            })()}

            <div style={{ padding: "16px 20px", background: "#f6f7f9", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <label style={{ ...S.label, margin: 0, minWidth: 280, fontWeight: 600 }}>Coût d'une libération par période ($)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" step="0.01" min="0" style={{ ...S.input, width: 120 }} defaultValue={config.coutLiberationDefault} id="cout-liberation-input" />
                  <button type="button" style={S.btnPrimary} onClick={() => {
                    const val = document.getElementById("cout-liberation-input").value;
                    if (val && !isNaN(parseFloat(val))) { config.coutLiberationDefault = val; alert("Coût de libération mis à jour : " + val + " $"); }
                  }}>Mettre à jour</button>
                </div>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: COLORS.gris }}>
                Ce montant est utilisé dans le calcul des coûts de la demande d'achat de matériel (libération d'un enseignant pour aller acheter).
              </p>
            </div>

            {/* Listes niveaux / matières (partagées avec form Activité) */}
            {(() => {
              const autreToggle = (list, updateFn) => {
                const hasAutre = list.includes("Autre");
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: hasAutre ? "#f0fdf4" : "#f9fafb", borderRadius: 8, border: `1px solid ${hasAutre ? "#86efac" : "#e5e7eb"}`, marginTop: 10 }}>
                    <span style={{ fontSize: 13, flex: 1 }}>Option <strong>« Autre » avec champ à compléter</strong></span>
                    <div style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}
                      onClick={() => updateFn(hasAutre ? list.filter(i => i !== "Autre") : [...list, "Autre"])}>
                      <div style={{ width: 44, height: 24, borderRadius: 12, background: hasAutre ? COLORS.vert : "#d1d5db", transition: "background 0.2s" }} />
                      <div style={{ position: "absolute", top: 3, left: hasAutre ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: hasAutre ? COLORS.vert : "#9ca3af", minWidth: 46 }}>{hasAutre ? "Actif" : "Inactif"}</span>
                  </div>
                );
              };
              const listWidget = (title, list, updateFn, newVal, setNewVal) => (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>{title}</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {list.filter(item => item !== "Autre").map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.fond, border: "1px solid #d9dee5", borderRadius: 20, padding: "5px 14px 5px 16px", fontSize: 13 }}>
                        <span>{item}</span>
                        <button type="button"
                          style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.rouge, fontWeight: 700, fontSize: 15, padding: "0 2px", lineHeight: 1 }}
                          onClick={() => updateFn(list.filter(x => x !== item))}
                          title="Retirer">✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input style={{ ...S.input, maxWidth: 280 }} placeholder="Nouvel élément…" value={newVal}
                      onChange={e => setNewVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
                    <button type="button" style={S.btnPrimary} onClick={() => {
                      const t = newVal.trim();
                      if (t && t !== "Autre" && !list.includes(t)) { updateFn([...list, t]); setNewVal(""); }
                    }}>+ Ajouter</button>
                  </div>
                  {autreToggle(list, updateFn)}
                </div>
              );
              return (
                <>
                  {listWidget("Niveaux disponibles", niveauxList, onUpdateNiveauxList, newNiveau, setNewNiveau)}
                  {listWidget("Matières disponibles", matieresList, onUpdateMatieresList, newMatiere, setNewMatiere)}
                  <p style={{ fontSize: 12, color: COLORS.gris, marginTop: 10 }}>
                    ℹ️ Ces listes s'appliquent aux deux formulaires : Achat de matériel et Activités/Sorties.
                  </p>
                </>
              );
            })()}

            {/* Liste des fournisseurs — toujours conservée en ordre alphabétique */}
            {(() => {
              const AUTRE_FOURNISSEUR = "Autre (précisez)";
              const sortFournisseurs = (list) => {
                const rest = list.filter(f => f !== AUTRE_FOURNISSEUR);
                rest.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
                return list.includes(AUTRE_FOURNISSEUR) ? [...rest, AUTRE_FOURNISSEUR] : rest;
              };
              return (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>Fournisseurs proposés (ruban « Fournisseur principal »)</h4>
                  <p style={{ fontSize: 12, color: COLORS.gris, marginBottom: 10 }}>
                    Cette liste est toujours affichée en ordre alphabétique — « {AUTRE_FOURNISSEUR} » reste protégé et demeure en dernier.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {fournisseurList.filter(f => f !== AUTRE_FOURNISSEUR).map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.fond, border: "1px solid #d9dee5", borderRadius: 20, padding: "5px 14px 5px 16px", fontSize: 13 }}>
                        <span>{f}</span>
                        <button type="button"
                          style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.rouge, fontWeight: 700, fontSize: 15, padding: "0 2px", lineHeight: 1 }}
                          onClick={() => onUpdateFournisseurList(sortFournisseurs(fournisseurList.filter(x => x !== f)))}
                          title="Retirer">✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input style={{ ...S.input, maxWidth: 280 }} placeholder="Nouveau fournisseur…" value={newFournisseur}
                      onChange={e => setNewFournisseur(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
                    <button type="button" style={S.btnPrimary} onClick={() => {
                      const t = newFournisseur.trim();
                      if (t && t !== AUTRE_FOURNISSEUR && !fournisseurList.includes(t)) {
                        onUpdateFournisseurList(sortFournisseurs([...fournisseurList, t]));
                        setNewFournisseur("");
                      }
                    }}>+ Ajouter</button>
                  </div>
                </div>
              );
            })()}

            {passionCategoriesEditor()}

            {/* Messages conditionnels affichés selon les réponses données */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Messages conditionnels</h4>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: COLORS.gris }}>
                Ces messages s'affichent automatiquement selon les cases cochées dans le formulaire.
              </p>
              {messageEditor("achatPersonnelWarning", "Message — « Demande que j'irai acheter par moi-même » = Oui")}
              {messageEditor("conferencierWarning", "Message — « Demande en lien avec un conférencier ou une conférencière » = Oui")}
            </div>
          </div>
        )}

        {/* ── Onglet : Formulaire Activités ── */}
        {activeTab === "activite" && (
          <div>
            {sectionTitle("Modification du formulaire « Demande d'activité et de sortie »", "Paramétrez les options disponibles dans ce formulaire.")}
            {(() => {
              const isActive = activeForms ? activeForms["activite"] !== false : true;
              const color = "#7c3aed";
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 8, border: `1px solid ${isActive ? color + "55" : "#e5e7eb"}`, background: isActive ? color + "08" : "#f9fafb", marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? color : "#9ca3af" }}>{isActive ? "✓ Formulaire actif" : "✗ Formulaire inactif"}</div>
                    <div style={{ fontSize: 12, color: COLORS.gris, marginTop: 2 }}>{isActive ? "Les utilisateurs peuvent soumettre ce type de demande." : "Ce formulaire est désactivé — aucune nouvelle soumission n'est possible."}</div>
                  </div>
                  <div style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}
                    onClick={() => { if (onUpdateActiveForms) onUpdateActiveForms(prev => ({ ...prev, activite: !isActive })); }}>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: isActive ? color : "#d1d5db", transition: "background 0.2s" }} />
                    <div style={{ position: "absolute", top: 3, left: isActive ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? color : "#9ca3af", minWidth: 46 }}>{isActive ? "Actif" : "Inactif"}</span>
                </div>
              );
            })()}
            {(() => {
              const autreToggle = (list, updateFn) => {
                const hasAutre = list.includes("Autre");
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: hasAutre ? "#f0fdf4" : "#f9fafb", borderRadius: 8, border: `1px solid ${hasAutre ? "#86efac" : "#e5e7eb"}`, marginTop: 10 }}>
                    <span style={{ fontSize: 13, flex: 1 }}>Option <strong>« Autre » avec champ à compléter</strong></span>
                    <div style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}
                      onClick={() => updateFn(hasAutre ? list.filter(i => i !== "Autre") : [...list, "Autre"])}>
                      <div style={{ width: 44, height: 24, borderRadius: 12, background: hasAutre ? COLORS.vert : "#d1d5db", transition: "background 0.2s" }} />
                      <div style={{ position: "absolute", top: 3, left: hasAutre ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: hasAutre ? COLORS.vert : "#9ca3af", minWidth: 46 }}>{hasAutre ? "Actif" : "Inactif"}</span>
                  </div>
                );
              };
              const listWidget = (title, list, updateFn, newVal, setNewVal) => (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>{title}</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {list.filter(item => item !== "Autre").map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.fond, border: "1px solid #d9dee5", borderRadius: 20, padding: "5px 14px 5px 16px", fontSize: 13 }}>
                        <span>{item}</span>
                        <button type="button"
                          style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.rouge, fontWeight: 700, fontSize: 15, padding: "0 2px", lineHeight: 1 }}
                          onClick={() => updateFn(list.filter(x => x !== item))}
                          title="Retirer">✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input style={{ ...S.input, maxWidth: 280 }} placeholder="Nouvel élément…" value={newVal}
                      onChange={e => setNewVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
                    <button type="button" style={S.btnPrimary} onClick={() => {
                      const t = newVal.trim();
                      if (t && t !== "Autre" && !list.includes(t)) { updateFn([...list, t]); setNewVal(""); }
                    }}>+ Ajouter</button>
                  </div>
                  {autreToggle(list, updateFn)}
                </div>
              );
              return (
                <>
                  {listWidget("Niveaux disponibles (Niveau(x) concerné(s))", niveauxList, onUpdateNiveauxList, newNiveau, setNewNiveau)}
                  {listWidget("Matières disponibles (Matière(s) concernée(s))", matieresList, onUpdateMatieresList, newMatiere, setNewMatiere)}
                  <p style={{ fontSize: 12, color: COLORS.gris, marginTop: 10 }}>
                    ℹ️ Ces listes s'appliquent aux deux formulaires : Achat de matériel et Activités/Sorties.
                  </p>
                </>
              );
            })()}

            {passionCategoriesEditor()}

            {/* Messages conditionnels affichés selon les réponses données */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Messages conditionnels</h4>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: COLORS.gris }}>
                Ces messages s'affichent automatiquement selon les cases cochées dans le formulaire.
              </p>
              {messageEditor("zoneGriseeWarning", "Message — avertissement zone grisée du calendrier scolaire (nature = Sortie ou Voyage)", "Utilisez « {type} » dans le texte : il sera remplacé automatiquement par « la sortie » ou « le voyage » selon le cas.")}
              {messageEditor("dateProcheWarning", "Message — date prévue très rapprochée (moins de 3 semaines)")}
              {messageEditor("autobusWarning", "Message — location d'un autobus scolaire ou de ville sélectionnée")}
            </div>
          </div>
        )}

        {/* ── Onglet : Formulaire Réquisition ── */}
        {activeTab === "requisition" && (
          <div>
            {sectionTitle("Modification du formulaire « Demande de réquisition interne »", "Gérez les types de service disponibles dans ce formulaire.")}
            {(() => {
              const isActive = activeForms ? activeForms["requisition"] !== false : true;
              const color = "#059669";
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 8, border: `1px solid ${isActive ? color + "55" : "#e5e7eb"}`, background: isActive ? color + "08" : "#f9fafb", marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? color : "#9ca3af" }}>{isActive ? "✓ Formulaire actif" : "✗ Formulaire inactif"}</div>
                    <div style={{ fontSize: 12, color: COLORS.gris, marginTop: 2 }}>{isActive ? "Les utilisateurs peuvent soumettre ce type de demande." : "Ce formulaire est désactivé — aucune nouvelle soumission n'est possible."}</div>
                  </div>
                  <div style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}
                    onClick={() => { if (onUpdateActiveForms) onUpdateActiveForms(prev => ({ ...prev, requisition: !isActive })); }}>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: isActive ? color : "#d1d5db", transition: "background 0.2s" }} />
                    <div style={{ position: "absolute", top: 3, left: isActive ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? color : "#9ca3af", minWidth: 46 }}>{isActive ? "Actif" : "Inactif"}</span>
                </div>
              );
            })()}

            <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>Types de service disponibles</h4>
            <p style={{ color: COLORS.gris, fontSize: 13, marginBottom: 14 }}>
              Ces types apparaissent dans le menu déroulant du formulaire. Lorsqu'activée, l'option "Autres (précisez)" est toujours conservée en dernier.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {serviceTypes.filter(st => st !== "Autres (précisez)").map((st, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.fond, border: "1px solid #d9dee5", borderRadius: 20, padding: "5px 14px 5px 16px", fontSize: 13 }}>
                  <span>{st}</span>
                  <button type="button"
                    style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.rouge, fontWeight: 700, fontSize: 15, padding: "0 2px", lineHeight: 1 }}
                    onClick={() => onUpdateServiceTypes(serviceTypes.filter(s => s !== st))}
                    title="Retirer ce type">✕</button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
              <input
                style={{ ...S.input, maxWidth: 320 }}
                placeholder="Nouveau type de service…"
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              />
              <button type="button" style={S.btnPrimary} onClick={() => {
                const t = newServiceType.trim();
                if (t && t !== "Autres (précisez)" && !serviceTypes.includes(t)) {
                  const hasAutres = serviceTypes.includes("Autres (précisez)");
                  const rest = serviceTypes.filter(s => s !== "Autres (précisez)");
                  onUpdateServiceTypes(hasAutres ? [...rest, t, "Autres (précisez)"] : [...rest, t]);
                  setNewServiceType("");
                }
              }}>+ Ajouter</button>
            </div>

            {(() => {
              const hasAutres = serviceTypes.includes("Autres (précisez)");
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: hasAutres ? "#f0fdf4" : "#f9fafb", borderRadius: 8, border: `1px solid ${hasAutres ? "#86efac" : "#e5e7eb"}` }}>
                  <span style={{ fontSize: 13, flex: 1 }}>Option <strong>« Autres (précisez) » avec champ à compléter</strong></span>
                  <div style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}
                    onClick={() => onUpdateServiceTypes(hasAutres ? serviceTypes.filter(s => s !== "Autres (précisez)") : [...serviceTypes, "Autres (précisez)"])}>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: hasAutres ? COLORS.vert : "#d1d5db", transition: "background 0.2s" }} />
                    <div style={{ position: "absolute", top: 3, left: hasAutres ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: hasAutres ? COLORS.vert : "#9ca3af", minWidth: 46 }}>{hasAutres ? "Actif" : "Inactif"}</span>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Onglet : Notifications par courriel ── */}
        {activeTab === "notifications" && (
          <div>
            {sectionTitle(
              "Notifications par courriel",
              "Configurez qui reçoit un courriel, à quel rythme, et le contenu de chaque type de courriel. Aucun courriel n'est envoyé s'il n'y a rien à signaler."
            )}

            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>Demandeur (personne qui a soumis la demande)</h4>
            <div style={{ marginBottom: 28, maxWidth: 420 }}>
              <select style={S.select} value={requesterMode} onChange={e => updateRequesterMode(e.target.value)}>
                <option value="each_stage">À chaque étape</option>
                <option value="after_verification">Seulement après la vérification</option>
                <option value="never">Aucunement</option>
              </select>
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>Rôles du parcours</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {NOTIF_ROLES.map(({ role, label, color }) => {
                const roleCfg = notifRoles[role] || {};
                const isActive = roleCfg.enabled !== false;
                const mode = roleCfg.mode || "immediate";
                return (
                  <div key={role} style={{ padding: "12px 16px", borderRadius: 8, border: `1px solid ${isActive ? color + "55" : "#e5e7eb"}`, background: isActive ? color + "08" : "#f9fafb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ ...S.badge(color), minWidth: 32, textAlign: "center" }}>{role}</span>
                      <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: isActive ? color : "#9ca3af", minWidth: 140 }}>{label}</div>
                      <div style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }} onClick={() => updateRoleField(role, "enabled", !isActive)}>
                        <div style={{ width: 44, height: 24, borderRadius: 12, background: isActive ? color : "#d1d5db", transition: "background 0.2s" }} />
                        <div style={{ position: "absolute", top: 3, left: isActive ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? color : "#9ca3af", minWidth: 46 }}>{isActive ? "Actif" : "Inactif"}</span>
                      {isActive && (
                        <select style={{ ...S.select, maxWidth: 220 }} value={mode} onChange={e => updateRoleField(role, "mode", e.target.value)}>
                          <option value="immediate">À chaque demande</option>
                          <option value="daily1">1 fois par jour</option>
                          <option value="daily2">2 fois par jour</option>
                        </select>
                      )}
                      {isActive && mode !== "immediate" && (
                        <input type="time" style={{ ...S.input, maxWidth: 110 }} value={roleCfg.time1 || "07:30"} onChange={e => updateRoleField(role, "time1", e.target.value)} />
                      )}
                      {isActive && mode === "daily2" && (
                        <input type="time" style={{ ...S.input, maxWidth: 110 }} value={roleCfg.time2 || "13:00"} onChange={e => updateRoleField(role, "time2", e.target.value)} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: COLORS.gris, marginBottom: 28 }}>
              ℹ️ « À chaque demande » envoie un courriel dès que la demande parvient à ce rôle. Les cadences 1×/2× par jour sont vérifiées toutes les 10 minutes et n'envoient qu'un résumé s'il y a au moins une demande en attente.
            </p>

            {[
              { kind: "requester", title: "Contenu — courriel au demandeur", tokens: "{{nom}}, {{titre}}, {{statut}}, {{date}}" },
              { kind: "approverImmediate", title: "Contenu — notification immédiate (rôles du parcours)", tokens: "{{nom}}, {{titre}}, {{role}}, {{date}}" },
              { kind: "approverDigest", title: "Contenu — récapitulatif groupé (rôles du parcours)", tokens: "{{nom}}, {{total}}, {{date}}" },
            ].map(({ kind, title, tokens }) => {
              const tpl = (notificationConfig?.templates || {})[kind] || {};
              return (
                <div key={kind} style={{ marginBottom: 28 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: COLORS.bleu }}>{title}</h4>
                  <p style={{ color: COLORS.gris, fontSize: 12, marginBottom: 12 }}>
                    Jetons disponibles : <code>{tokens}</code>. La mise en page visuelle (logo, couleurs, bouton vers l'application) reste fixe.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={S.label}>Objet du courriel</label>
                      <input style={S.input} value={tpl.subjectTemplate || ""} onChange={e => updateTemplateField(kind, "subjectTemplate", e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>Message d'accueil</label>
                      <input style={S.input} value={tpl.greetingTemplate || ""} onChange={e => updateTemplateField(kind, "greetingTemplate", e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>Phrase d'introduction</label>
                      <input style={S.input} value={tpl.introTemplate || ""} onChange={e => updateTemplateField(kind, "introTemplate", e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>Note de bas de page</label>
                      <textarea style={S.textarea} value={tpl.footerTemplate || ""} onChange={e => updateTemplateField(kind, "footerTemplate", e.target.value)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
