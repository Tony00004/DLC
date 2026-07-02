import { useState } from "react";
import { COLORS, MATIERES, NIVEAUX, config } from "../constants";
import { S } from "../styles";

export function AdminView({ onBack, allUsers, onUpdateRoles, serviceTypes, onUpdateServiceTypes, activeForms, onUpdateActiveForms, statusDefinitions = {}, onUpdateStatusDefinitions, approbateurRules = [], onUpdateApprobateurRules, niveauxList = [], matieresList = [], onUpdateNiveauxList, onUpdateMatieresList }) {
  const [activeTab, setActiveTab] = useState("droits");
  const [users, setUsers] = useState(allUsers.map((u) => ({ ...u })));
  const [newServiceType, setNewServiceType] = useState("");
  const [newNiveau,      setNewNiveau]      = useState("");
  const [newMatiere,     setNewMatiere]     = useState("");
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

  const TABS = [
    { id: "droits",        label: "Gestion des droits",             icon: "👥" },
    { id: "approbateurs",  label: "Assignation des approbateurs",   icon: "📋" },
    { id: "statuts",       label: "Définitions des statuts",        icon: "🏷️" },
    { id: "achat",         label: "Formulaire — Achat matériel",    icon: "🛒" },
    { id: "activite",      label: "Formulaire — Activités/Sorties", icon: "🎒" },
    { id: "requisition",   label: "Formulaire — Réquisition interne", icon: "🔧" },
  ];

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
    <div style={S.content}>
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

            {/* Légende des rôles — 3 colonnes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { role: "A",  label: "Approbateur",    desc: "Approuve les demandes d'achat et d'activité",   color: "#0284c7" },
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end", marginBottom: 28, padding: "16px 18px", background: "#f6f7f9", borderRadius: 8, border: "1px solid #e5e7eb" }}>
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
            <div style={{ overflowX: "auto", marginBottom: 18 }}>
              <table style={{ ...S.table, minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={S.th}>Nom</th>
                    <th style={S.th}>Courriel</th>
                    {[
                      { role: "A",  label: "Approbateur",    color: "#0284c7" },
                      { role: "B",  label: "Vérificateur",   color: "#7c3aed" },
                      { role: "C1", label: "Agent administratif",     color: "#ea580c" },
                      { role: "C2", label: "Magasinier",     color: "#0891b2" },
                      { role: "C3", label: "Concierge",      color: "#059669" },
                      { role: "D",  label: "Administrateur", color: "#dc2626" },
                    ].map(r => (
                      <th key={r.role} style={{ ...S.th, textAlign: "center", color: r.color, minWidth: 80 }}>
                        <div style={{ fontSize: 10, fontWeight: 900 }}>{r.role}</div>
                        <div style={{ fontSize: 10, fontWeight: 600 }}>{r.label}</div>
                      </th>
                    ))}
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const isAdminUser = u.roles.includes("D");
                    return (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={S.td}>
                          <strong>{u.name}</strong>
                          {isAdminUser && <span style={{ marginLeft: 6, fontSize: 10, background: "#dc262618", color: "#dc2626", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>ADMIN</span>}
                        </td>
                        <td style={{ ...S.td, fontSize: 12, color: COLORS.gris }}>{u.email}@csslaval.gouv.qc.ca</td>
                        {["A", "B", "C1", "C2", "C3", "D"].map((role) => (
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

        {/* ── Onglet : Définitions des statuts ── */}
        {activeTab === "statuts" && (
          <div>
            {sectionTitle("Définitions des statuts", "Ces textes s'affichent en bulle d'aide lorsque l'utilisateur survole un statut dans « Mes demandes récentes ».")}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "soumise",               label: "Soumise",                color: "#64748b" },
                { key: "acceptee",              label: "Approuvée",              color: "#0284c7" },
                { key: "validee",               label: "Vérifiée",               color: "#7c3aed" },
                { key: "commandee",             label: "En commande",            color: "#ea580c" },
                { key: "partiellement_traitee", label: "Partiellement complétée", color: "#f59e0b" },
                { key: "traitee",               label: "Traitée",                color: "#008c4a" },
                { key: "refusee",               label: "Refusée",                color: "#b42318" },
                { key: "annulee",               label: "Annulée",                color: "#78350f" },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "center", padding: "12px 16px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
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
              Ces types apparaissent dans le menu déroulant du formulaire. "Autres (précisez)" est toujours conservé en dernier.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {serviceTypes.map((st, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.fond, border: "1px solid #d9dee5", borderRadius: 20, padding: "5px 14px 5px 16px", fontSize: 13 }}>
                  <span>{st}</span>
                  {st !== "Autres (précisez)" && (
                    <button type="button"
                      style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.rouge, fontWeight: 700, fontSize: 15, padding: "0 2px", lineHeight: 1 }}
                      onClick={() => onUpdateServiceTypes(serviceTypes.filter((_, j) => j !== i))}
                      title="Retirer ce type">✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input
                style={{ ...S.input, maxWidth: 320 }}
                placeholder="Nouveau type de service…"
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              />
              <button type="button" style={S.btnPrimary} onClick={() => {
                const t = newServiceType.trim();
                if (t && !serviceTypes.includes(t)) {
                  onUpdateServiceTypes([...serviceTypes.filter(s => s !== "Autres (précisez)"), t, "Autres (précisez)"]);
                  setNewServiceType("");
                }
              }}>+ Ajouter</button>
            </div>
            <p style={{ fontSize: 12, color: COLORS.gris }}>
              ℹ️ "Autres (précisez)" est protégé et ne peut pas être retiré.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
