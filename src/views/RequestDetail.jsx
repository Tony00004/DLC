import { useState } from "react";
import { COLORS, STATUSES, REQUEST_TYPES } from "../constants";
import { S } from "../styles";
import { printZone } from "../utils/print";

export function RequestDetail({ request, user, onAction, onBack, onEdit, onCancel, onUpdateItems, onSaveAuthorizations }) {
  const [comment, setComment] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [cpeLocal, setCpeLocal] = useState(request.formData?.cpeAuth || { decision: null, date: "", comment: "" });
  const [ceLocal,  setCeLocal]  = useState(request.formData?.ceAuth  || { decision: null, date: "", comment: "" });
  const [savingAuth, setSavingAuth] = useState(false);
  // Étapes selon le type de demande
  const isRequisition = request.type === "requisition";
  const steps = isRequisition
    ? [
        { key: "soumise",  label: "Soumise",    icon: "📝" },
        { key: "acceptee", label: "Reçue",       icon: "📬" },
        { key: "validee",  label: "Vérifiée",    icon: "✅" },
        { key: "traitee",  label: "Complétée",   icon: "🔧" },
      ]
    : request.type === "achat"
    ? [
        { key: "soumise",   label: "Soumise",     icon: "📝" },
        { key: "acceptee",  label: "Approuvée",   icon: "👍" },
        { key: "validee",   label: "Vérifiée",    icon: "✅" },
        { key: "commandee", label: "En commande", icon: "📦" },
        { key: "traitee",   label: "Complétée",   icon: "🏁" },
      ]
    : [
        { key: "soumise",  label: "Soumise",    icon: "📝" },
        { key: "acceptee", label: "Approuvée",  icon: "👍" },
        { key: "validee",  label: "Vérifiée",   icon: "✅" },
        { key: "traitee",  label: "Complétée",  icon: "🏁" },
      ];
  const currentIdx = steps.findIndex((s) => s.key === request.status);

  const canActRole = (role) => user.roles.includes(role);
  const isAdmin = user.roles.includes("D");
  const isAuthor = request.authorId === user.id;

  // Déterminer le rôle exécutant selon le type de demande
  const execRole = request.type === "requisition" ? "C3"
                 : request.type === "achat"       ? "C1"
                 : "C1"; // activite → secrétaire

  const isExecForType = canActRole(execRole) || isAdmin;
  const isMagasinier = canActRole("C2") || isAdmin;

  // Approbation : seulement pour achat et activite
  const canApprove = request.status === "soumise" && ["achat","activite"].includes(request.type)
                     && (canActRole("A") || isAdmin);
  // Vérification : achat+activite après approbation, réquisition dès soumise(=acceptee)
  const canVerify = request.status === "acceptee" && (canActRole("B") || isAdmin);
  // Agent administratif (C1) traite achat/activite
  const canSecretary = ["validee","commandee","partiellement_traitee"].includes(request.status)
                       && ["achat","activite"].includes(request.type)
                       && (canActRole("C1") || isAdmin);
  // Magasinier (C2) — achat validée, en commande ou partiellement complétée
  const canMagasinier = (
    (["validee","commandee","partiellement_traitee"].includes(request.status) && request.type === "achat") ||
    (request.status === "validee_C2" && request.type === "requisition")
  ) && (canActRole("C2") || isAdmin);
  // Agent administratif peut marquer "en commande" une demande d'achat validée
  const canMarkCommande = request.status === "validee"
                          && request.type === "achat"
                          && (canActRole("C1") || isAdmin);
  // Concierge (C3) traite les réquisitions validées
  const canConcierge = ["validee_C3"].includes(request.status)
                       && request.type === "requisition"
                       && (canActRole("C3") || isAdmin);

  // Droits de modification
  const canAuthorEdit = isAuthor && request.status === "soumise" && ["achat","activite"].includes(request.type);
  const authorBlockedByApproval = isAuthor && request.status === "acceptee" && ["achat","activite"].includes(request.type);
  const canApproverEdit = (canActRole("A") || isAdmin) && ["soumise","acceptee"].includes(request.status);
  const approverBlockedByVerif = (canActRole("A") && !isAdmin) && ["validee","commandee","traitee"].includes(request.status);
  // Le magasinier (C2) ne peut PAS modifier — seulement consulter et commenter
  const canEdit = (canActRole("A") || canActRole("B") || canActRole("C1") || canActRole("C3") || isAdmin)
                  && !["traitee","refusee","annulee"].includes(request.status);
  const canCancel = isAuthor && ["soumise","acceptee"].includes(request.status);

  const approverName = request.history ? [...request.history].reverse().find(h => h.status === "acceptee")?.by : null;
  const verifierName = request.history ? [...request.history].reverse().find(h => h.status === "validee")?.by : null;
  const isTerminated = ["traitee","refusee","annulee"].includes(request.status);

  const btnVert = { background: "#008c4a", color: "#fff", border: "1px solid #006c39", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };
  const btnJaune = { background: "#ca8a04", color: "#fff", border: "1px solid #a16207", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };
  const btnRouge = { background: "#b42318", color: "#fff", border: "1px solid #b42318", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };
  const btnOrange = { background: "#ea580c", color: "#fff", border: "1px solid #c2410c", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };
  const btnVert2 = { background: "#23b090", color: "#fff", border: "1px solid #1a8a70", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 };

  return (
    <div style={S.content}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }} className="no-print">
        <button style={{ ...S.btn }} onClick={onBack}>← Retour</button>
        <button style={{ background: "#04043C", color: "#fff", border: "1px solid #04043C", borderRadius: 6, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 700 }} onClick={() => printZone()}>Imprimer</button>
      </div>
      <div id="print-zone" style={S.card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>{request.title}</h2>
            <div style={{ color: COLORS.gris, fontSize: 13 }}>
              {REQUEST_TYPES[request.type]}{request.requestNumber ? <span style={{ fontFamily: "monospace", marginLeft: 4 }}>· {request.requestNumber}</span> : ""} · Soumis le {request.date} par {request.authorName}
            </div>
          </div>
          <span style={S.badge(STATUSES[request.status]?.color || COLORS.gris)}>{STATUSES[request.status]?.label}</span>
        </div>

        {/* Progression */}
        <h3 style={S.sectionTitle}>Progression de la demande</h3>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28, overflowX: "auto" }}>
          {steps.map((step, idx) => {
            const done = idx <= currentIdx && !["refusee","annulee"].includes(request.status);
            const current = idx === currentIdx && !["refusee","annulee"].includes(request.status);
            return (
              <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 90 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    background: done ? COLORS.vert : "#e5e7eb",
                    border: current ? `3px solid ${COLORS.vertFonce}` : "3px solid transparent",
                    boxSizing: "border-box",
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 6, fontWeight: current ? 700 : 400, color: done ? COLORS.vertFonce : COLORS.gris, textAlign: "center" }}>
                    {step.label}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ height: 3, width: 40, background: idx < currentIdx && !["refusee","annulee"].includes(request.status) ? COLORS.vert : "#e5e7eb", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenu de la demande */}
        {request.formData && (
          <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
            <h3 style={S.sectionTitle}>Détails de la demande {request.requestNumber ? <span style={{ fontSize: 14, fontWeight: 400, fontFamily: "monospace", color: COLORS.gris }}>({request.requestNumber})</span> : ""}</h3>
            {request.type === "achat" && (
              <div>
                <div style={S.grid2}>
                  {[
                    ["Demandeur / Demandeuse", request.formData.demandePar],
                    ["Courriel", request.formData.courriel ? request.formData.courriel + "@csslaval.gouv.qc.ca" : ""],
                    ["Date de la demande", request.formData.dateDemande],
                    ["Date souhaitée pour le traitement", request.formData.dateSouhaitee],
                    ["Matière", request.formData.matiere + (request.formData.autreMatiere ? " — " + request.formData.autreMatiere : "") + (request.formData.matiereArts ? " (" + request.formData.matiereArts + ")" : "")],
                    ["Niveau", request.formData.niveau + (request.formData.autreNiveau ? " — " + request.formData.autreNiveau : "")],
                    ["Direction responsable", request.formData.directionResponsable],
                    ["Fournisseur principal", request.formData.fournisseurPrincipal],
                  ].map(([label, val]) => val ? (
                    <div key={label} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                      <div style={{ fontSize: 14, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>{String(val)}</div>
                    </div>
                  ) : null)}
                </div>
                {request.formData.natureActivite && (
                  <div style={{ marginTop: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Nature de la demande</div>
                    <div style={{ fontSize: 14, padding: "6px 8px", background: "#f9fafb", borderRadius: 4, marginTop: 4 }}>{request.formData.natureActivite}</div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 22px", marginBottom: 12 }}>
                  {[
                    ["Achat par moi-même", request.formData.achatPersonnel],
                    ["Conférencier / Conférencière", request.formData.conferencier],
                    ["Activité parascolaire", request.formData.parascolaire],
                    ["Budget concentration (passion)", request.formData.budgetPassion],
                  ].map(([label, val]) => val ? (
                    <div key={label} style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                      <div style={{ fontSize: 14 }}>{String(val)}</div>
                    </div>
                  ) : null)}
                </div>
                {request.formData._rows && request.formData._rows.length > 0 && (() => {
                  const canManageItems = (canActRole("C1") || canActRole("C2") || isAdmin)
                    && ["validee","commandee","partiellement_traitee","traitee"].includes(request.status);
                  const canManageCommandeCol = (canActRole("C1") || isAdmin) && canManageItems;
                  const rows = request.formData._rows;
                  function toggleItem(idx, field) {
                    if (!canManageItems) return;
                    const updated = rows.map((r, i) => i === idx ? { ...r, [field]: !r[field] } : r);
                    if (onUpdateItems) onUpdateItems(request.id, updated);
                  }
                  return (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 15, color: COLORS.vertFonce, borderBottom: `1px solid ${COLORS.vertFonce}`, paddingBottom: 4 }}>Articles commandés</h4>
                        {canManageItems && (
                          <div style={{ fontSize: 12, color: COLORS.gris, display: "flex", gap: 14 }}>
                            <span>📦 Commandés : <strong>{rows.filter(r=>r.commande).length}/{rows.length}</strong></span>
                            <span>📬 Reçus : <strong>{rows.filter(r=>r.recu).length}/{rows.length}</strong></span>
                          </div>
                        )}
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ ...S.table, fontSize: 12 }}>
                          <thead>
                            <tr>
                              {["#","Qté","Nom du produit","Description","N° produit","Lien Web","Prix unit.","Sous-total",
                                ...(canManageCommandeCol ? ["✅ Commandé"] : []),
                                ...(canManageItems ? ["📬 Reçu"] : [])
                              ].map((h) => (
                                <th key={h} style={{ ...S.th, padding: "6px 8px", fontSize: 11,
                                  textAlign: h.startsWith("✅")||h.startsWith("📬") ? "center" : undefined,
                                  width: h.startsWith("✅")||h.startsWith("📬") ? 70 : undefined,
                                  minWidth: h.startsWith("✅")||h.startsWith("📬") ? 70 : undefined,
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, idx) => (
                              <tr key={row.id||idx} style={{ background: row.recu ? "#f0fdf4" : row.commande ? "#eff6ff" : idx % 2 === 0 ? "#fff" : "#f5f7f5" }}>
                                <td style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                                <td style={S.td}>{row.qty}</td>
                                <td style={S.td}><strong>{row.nom}</strong></td>
                                <td style={S.td}>{row.description}</td>
                                <td style={S.td}>{row.numero}</td>
                                <td style={S.td}>{row.lien ? <a href={row.lien} target="_blank" rel="noreferrer" style={{ color: COLORS.vert, fontSize: 11 }}>Lien</a> : ""}</td>
                                <td style={{ ...S.td, textAlign: "right" }}>{row.prixUnitaire ? row.prixUnitaire + " $" : ""}</td>
                                <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{row.soustotal ? row.soustotal + " $" : ""}</td>
                                {canManageCommandeCol && (
                                  <td style={{ ...S.td, textAlign: "center" }}>
                                    <input type="checkbox" checked={!!row.commande}
                                      onChange={() => toggleItem(idx, "commande")}
                                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0284c7" }}
                                      title="Cocher une fois commandé" />
                                  </td>
                                )}
                                {canManageItems && (
                                  <td style={{ ...S.td, textAlign: "center" }}>
                                    <input type="checkbox" checked={!!row.recu}
                                      onChange={() => toggleItem(idx, "recu")}
                                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#059669" }}
                                      title="Cocher une fois reçu à l'école" />
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: "#e8f5ee" }}>
                              <td colSpan={7} style={{ ...S.td, textAlign: "right", fontWeight: 700, fontSize: 13 }}>Total de la commande</td>
                              <td style={{ ...S.td, fontWeight: 700, fontSize: 13, textAlign: "right", whiteSpace: "nowrap" }}>{request.formData.total}</td>
                              {canManageCommandeCol && (
                                <td style={{ ...S.td, textAlign: "center" }}>
                                  <input type="checkbox"
                                    title="Tout cocher — Commandé"
                                    checked={rows.length > 0 && rows.every(r => r.commande)}
                                    onChange={e => {
                                      const val = e.target.checked;
                                      if (onUpdateItems) onUpdateItems(request.id, rows.map(r => ({ ...r, commande: val, recu: val ? r.recu : false })));
                                    }}
                                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0284c7" }} />
                                </td>
                              )}
                              {canManageItems && (
                                <td style={{ ...S.td, textAlign: "center" }}>
                                  <input type="checkbox"
                                    title="Tout cocher — Reçu"
                                    checked={rows.length > 0 && rows.every(r => r.recu)}
                                    onChange={e => {
                                      const val = e.target.checked;
                                      if (onUpdateItems) onUpdateItems(request.id, rows.map(r => ({ ...r, recu: val })));
                                    }}
                                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#059669" }} />
                                </td>
                              )}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      {canManageItems && rows.every(r => r.recu) && rows.length > 0 && (
                        <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, color: "#166534", fontSize: 13, fontWeight: 600 }}>
                          ✅ Tous les articles ont été reçus à l'école. Vous pouvez marquer la demande comme complétée.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            {request.type === "activite" && (() => {
              const fd = request.formData;
              const Champ = ({ label, val, fullWidth }) => val && String(val).trim() ? (
                <div style={{ marginBottom: 8, gridColumn: fullWidth ? "1 / -1" : undefined }}>
                  <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                  <div style={{ fontSize: 14, padding: "2px 0", borderBottom: "1px solid #f0f0f0" }}>{String(val)}</div>
                </div>
              ) : null;
              return (
                <div>
                  <div style={S.grid2}>
                    <Champ label="Nom de l'activité" val={fd.nomActivite || fd["Nom de l'activité"]} />
                    <Champ label="Type d'activité" val={fd.typeActivite || fd["Type"]} />
                    <Champ label="Niveaux concernés" val={fd.niveauxConcernes?.join(", ") || fd["Niveaux"]} />
                    <Champ label="Groupes" val={fd.groupes || fd["Groupes"]} />
                    <Champ label="Matières concernées" val={fd.matieresConcernees?.join(", ")} />
                    <Champ label="Activité obligatoire" val={fd.obligatoire} />
                    <Champ label="Description" val={fd.description || fd["Description"]} fullWidth />
                    {fd.autresClientele && <Champ label="Autres clientèles" val={fd.autresClientele} fullWidth />}
                  </div>

                  {fd.responsables && fd.responsables.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Responsables additionnels</div>
                      {fd.responsables.map((r, i) => <div key={i} style={{ fontSize: 14 }}>{r.nom}</div>)}
                    </div>
                  )}

                  {fd.datesPrevues && fd.datesPrevues.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Date(s) prévue(s)</div>
                      {fd.datesPrevues.map((d, i) => (
                        <div key={i} style={{ fontSize: 14, marginBottom: 2 }}>{d.date} — {d.heureDebut} à {d.heureFin}</div>
                      ))}
                    </div>
                  )}

                  <div style={{ ...S.grid2, marginTop: 12 }}>
                    <Champ label="Heure de départ" val={fd.heureDepart} />
                    <Champ label="Heure de retour" val={fd.heureRetour} />
                    <Champ label="Nom de l'établissement" val={fd.nomEtablissement} />
                    <Champ label="Adresse" val={fd.adresseComplete} />
                    <Champ label="Personne contact" val={fd.personneContact} />
                    <Champ label="Téléphone" val={fd.telephone ? fd.telephone + (fd.poste ? " p. " + fd.poste : "") : ""} />
                    <Champ label="Type de transport" val={fd.typeTransport} />
                    <Champ label="Coût transport" val={fd.coutTransport ? fd.coutTransport + " $" : ""} />
                    <Champ label="Coût / élève (taxes incl.)" val={fd.coutEleve ? fd.coutEleve + " $ × " + fd.nbEleves + " élèves" : ""} />
                    <Champ label="Coût / adulte (taxes incl.)" val={fd.coutAdulte ? fd.coutAdulte + " $ × " + fd.nbAdultes + " adultes" : ""} />
                    <Champ label="Libération par période" val={fd.coutLiberation && fd.nbPeriodes > 0 ? fd.coutLiberation + " $ × " + fd.nbPeriodes + " période(s)" : ""} />
                    <Champ label="Autre montant" val={fd.autreMontant ? fd.autreMontant + " $" : ""} />
                  </div>
                </div>
              );
            })()}
            {request.type === "requisition" && (
              <div>
                <div style={S.grid2}>
                  {["titre","typeService","typeServiceFinal","priorite","description","localConcerne","dateRealisation"].map(k => {
                    const v = request.formData[k];
                    if (!v || String(v).trim() === "") return null;
                    const labels = { titre:"Titre", typeService:"Type de service", typeServiceFinal:"Service", priorite:"Priorité", description:"Description", localConcerne:"Local concerné", dateRealisation:"Date de réalisation souhaitée" };
                    return (
                      <div key={k} style={{ marginBottom: 8, gridColumn: k === "description" ? "1 / -1" : undefined }}>
                        <div style={{ fontSize: 11, color: COLORS.gris, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{labels[k] || k}</div>
                        <div style={{ fontSize: 14, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>{String(v)}</div>
                      </div>
                    );
                  })}
                </div>
                {request.formData.drawing && request.formData.drawing.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: COLORS.vertFonce }}>Schéma / Plan joint à la demande</h4>
                    <div style={{ border: "2px solid #d1d5db", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                      <svg width="100%" viewBox="0 0 760 440" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                        <defs>
                          <marker id="ah" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                            <polygon points="0 0,9 3.5,0 7" fill="#1a1a2e" />
                          </marker>
                        </defs>
                        {request.formData.drawing.map((s, i) => {
                          const c = s.color || "#1a1a2e";
                          if (s.type === "rect")    return <rect    key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={c + "20"} stroke={c} strokeWidth={2} rx={2} />;
                          if (s.type === "ellipse") return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={c + "20"} stroke={c} strokeWidth={2} />;
                          if (s.type === "arrow")   return <line    key={i} x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1} stroke={c} strokeWidth={2} markerEnd="url(#ah)" />;
                          if (s.type === "text")    return <text    key={i} x={s.x} y={s.y} fill={c} fontSize={s.fs || 16} fontWeight={s.bold ? "bold" : "normal"} fontStyle={s.italic ? "italic" : "normal"} textDecoration={s.underline ? "underline" : "none"}>{s.text}</text>;
                          return null;
                        })}
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
        {/* Historique — après les Détails */}
        {request.history && request.history.length > 0 && (
          <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
            <h3 style={S.sectionTitle}>Historique</h3>
            <div style={{ marginBottom: 8 }}>
              {request.history.map((h, i) => (
                <div key={i} style={{ padding: "8px 12px", borderLeft: `3px solid ${STATUSES[h.status]?.color || COLORS.gris}`, marginBottom: 8, background: "#f9fafb", borderRadius: "0 4px 4px 0" }}>
                  <strong style={{ fontSize: 13 }}>{STATUSES[h.status]?.label}</strong>
                  <span style={{ fontSize: 12, color: COLORS.gris, marginLeft: 8 }}>par {h.by} · {h.date}</span>
                  {h.comment && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#333" }}>{h.comment}</p>}
                  {h.adminComment && user.roles.some(r => ["A","B","C1","C2","C3","D"].includes(r)) && (
                    <div style={{ marginTop: 6, padding: "6px 10px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 4, fontSize: 12, color: "#1e40af" }}>
                      <strong>Note administrative :</strong> {h.adminComment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Autorisations CPE / CÉ (activité seulement) ── */}
        {request.type === "activite" && (() => {
          const isAtAgentStage = ["validee", "commandee", "partiellement_traitee"].includes(request.status);
          const canEditAuth    = isAtAgentStage && (canSecretary || isAdmin);
          const hasAuthData    = cpeLocal.decision || ceLocal.decision;
          // Visible uniquement au stade agent administratif (ou après, si des données ont été sauvegardées)
          if (!isAtAgentStage && !hasAuthData) return null;
          if (!canEditAuth && !hasAuthData) return null;
          const renderAuthCard = (label, val, setVal) => {
            const isAuto = val.decision === "autorisee";
            const isRej  = val.decision === "rejetee";
            return (
              <div style={{ flex: 1, border: `1px solid ${isAuto ? "#86efac" : isRej ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 8, padding: 16, background: isAuto ? "#f0fdf4" : isRej ? "#fef2f2" : "#f9fafb" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{label}</div>
                {canEditAuth ? (
                  <>
                    <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                        <input type="radio" name={`dlc_auth_${label}`} checked={val.decision === "autorisee"} onChange={() => setVal({ ...val, decision: "autorisee" })} />
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ Autorisée</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                        <input type="radio" name={`dlc_auth_${label}`} checked={val.decision === "rejetee"} onChange={() => setVal({ ...val, decision: "rejetee" })} />
                        <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ Rejetée</span>
                      </label>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={S.label}>Date</label>
                      <input type="date" style={S.input} value={val.date} onChange={e => setVal({ ...val, date: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Commentaire</label>
                      <textarea style={{ ...S.textarea, minHeight: 60 }} rows={2} value={val.comment} onChange={e => setVal({ ...val, comment: e.target.value })} placeholder={`Commentaire pour l'autorisation ${label}…`} />
                    </div>
                  </>
                ) : (
                  <>
                    {val.decision ? (
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 13, fontWeight: 700, background: isAuto ? "#dcfce7" : "#fee2e2", color: isAuto ? "#15803d" : "#991b1b" }}>
                        {isAuto ? "✓ Autorisée" : "✗ Rejetée"}
                      </span>
                    ) : (
                      <span style={{ color: COLORS.gris, fontSize: 13, fontStyle: "italic" }}>En attente</span>
                    )}
                    {val.date && <div style={{ fontSize: 13, color: COLORS.gris, marginTop: 4 }}>{val.date}</div>}
                    {val.comment && <p style={{ margin: "6px 0 0", fontSize: 13 }}>{val.comment}</p>}
                  </>
                )}
              </div>
            );
          };
          return (
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 20, marginTop: 4 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Autorisations administratives</h3>
              <div style={{ display: "flex", gap: 16, marginBottom: canEditAuth ? 14 : 0 }}>
                {renderAuthCard("CPE", cpeLocal, setCpeLocal)}
                {renderAuthCard("CÉ",  ceLocal,  setCeLocal)}
              </div>
              {canEditAuth && (
                <button
                  style={{ ...btnVert, opacity: savingAuth ? 0.7 : 1, cursor: savingAuth ? "not-allowed" : "pointer" }}
                  disabled={savingAuth}
                  onClick={async () => {
                    setSavingAuth(true);
                    try { await onSaveAuthorizations(request.id, cpeLocal, ceLocal); }
                    finally { setSavingAuth(false); }
                  }}
                >
                  {savingAuth ? "Sauvegarde…" : "Sauvegarder les autorisations"}
                </button>
              )}
            </div>
          );
        })()}

        {/* Panneau d'actions */}
        {!isTerminated && (
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 20, marginTop: 4 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Actions</h3>

            {/* Commentaires : standard (tous) + administratif (rôles) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
              <div>
                <label style={S.label}>Commentaire (optionnel)</label>
                <textarea style={S.textarea} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire..." rows={3} />
              </div>
              {(canApprove || canVerify || canSecretary || canMagasinier || canConcierge || isAdmin) && (
                <div>
                  <label style={{ ...S.label, color: COLORS.bleu }}>Commentaire administratif (optionnel)</label>
                  <textarea style={{ ...S.textarea, borderColor: "#93c5fd", background: "#eff6ff" }} value={adminComment} onChange={(e) => setAdminComment(e.target.value)} placeholder="Note interne visible uniquement par les rôles administratifs..." rows={3} />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

              {/* ── Approbateur (A) — achat et activité ── */}
              {canApprove && (
                <>
                  <button style={btnVert} onClick={() => onAction(request.id, "acceptee", comment, user, adminComment)}>Accepter</button>
                  <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                </>
              )}

              {/* ── Vérificateur (B) ── */}
              {canVerify && !canApprove && (
                <>
                  {request.type === "requisition" ? (
                    <>
                      <button style={btnVert} onClick={() => onAction(request.id, "validee_C3", comment, user, adminComment)}>Attribuer au Concierge</button>
                      <button style={{ ...btnVert, background: "#0891b2", borderColor: "#0891b2" }} onClick={() => onAction(request.id, "validee_C2", comment, user, adminComment)}>Attribuer au Magasinier</button>
                      <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                    </>
                  ) : (
                    <>
                      <button style={btnVert} onClick={() => onAction(request.id, "validee", comment, user, adminComment)}>Vérifier</button>
                      <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                    </>
                  )}
                </>
              )}

              {/* ── Agent administratif (C1) — achat et activité ── */}
              {canSecretary && (
                <>
                  {canMarkCommande && request.type === "achat" && (
                    <button style={btnOrange} onClick={() => onAction(request.id, "commandee", comment, user, adminComment)}>
                      Marquer items en commande
                    </button>
                  )}
                  {request.type === "achat" && request.formData?._rows && (() => {
                    const rows = request.formData._rows;
                    const tousRecus = rows.length > 0 && rows.every(r => r.recu);
                    const certainsRecus = rows.some(r => r.recu) && !tousRecus;
                    return (
                      <>
                        {certainsRecus && (
                          <button style={btnOrange} onClick={() => onAction(request.id, "partiellement_traitee", comment, user, adminComment, rows)}>
                            Enregistrer réception partielle
                          </button>
                        )}
                        <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment, rows)}>
                          {tousRecus ? "Confirmer réception complète et compléter" : "Marquer comme complétée"}
                        </button>
                      </>
                    );
                  })()}
                  {request.type === "activite" && (
                    <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment)}>
                      Marquer comme complétée
                    </button>
                  )}
                  <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                </>
              )}

              {/* ── Magasinier (C2) — achat validée, en commande ou partiellement complétée ── */}
              {canMagasinier && !canSecretary && (() => {
                const rows = request.formData?._rows || [];
                const tousRecus = rows.length > 0 && rows.every(r => r.recu);
                const certainsRecus = rows.some(r => r.recu) && !tousRecus;
                return (
                  <>
                    {certainsRecus && (
                      <button style={btnOrange} onClick={() => onAction(request.id, "partiellement_traitee", comment, user, adminComment, rows)}>
                        Enregistrer réception partielle
                      </button>
                    )}
                    <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment, rows)}>
                      {tousRecus ? "Confirmer réception complète et compléter" : "Marquer comme complétée"}
                    </button>
                    <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                  </>
                );
              })()}

              {/* ── Concierge (C3) — réquisition interne ── */}
              {canConcierge && (
                <>
                  <button style={btnVert} onClick={() => onAction(request.id, "traitee", comment, user, adminComment)}>
                    Marquer comme complétée
                  </button>
                  <button style={btnRouge} onClick={() => onAction(request.id, "refusee", comment, user, adminComment)}>Refuser</button>
                </>
              )}

              {/* ── Séparateur ── */}
              {(canApproverEdit || canEdit) && (canApprove || canVerify || canSecretary || canMagasinier || canConcierge) && (
                <span style={{ width: 1, height: 32, background: "#e5e7eb", display: "inline-block", margin: "0 4px" }} />
              )}

              {/* ── Modifier la demande (un seul bouton, logique unifiée) ── */}
              {(canApproverEdit || (canEdit && !canApproverEdit)) && (
                <button style={btnJaune} onClick={() => onEdit(request, null, "")}>
                  Modifier la demande
                </button>
              )}

              {/* ── Modifier par l'auteur (seulement si soumise) ── */}
              {canAuthorEdit && !canApproverEdit && !canEdit && (
                <button style={btnVert2} onClick={() => onEdit(request, null, "auteur")}>
                  Modifier ma demande
                </button>
              )}

              {/* ── Auteur bloqué car demande approuvée — message de contact ── */}
              {authorBlockedByApproval && !canEdit && (
                <div style={{ padding: "10px 14px", background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: 6, fontSize: 13, color: "#7a5800", maxWidth: 420 }}>
                  ⚠ Votre demande a été approuvée. Pour la modifier, veuillez contacter
                  {approverName ? <strong> {approverName}</strong> : " l'approbateur"} qui a validé votre demande.
                </div>
              )}

              {/* ── Approbateur bloqué car demande vérifiée — message de contact ── */}
              {approverBlockedByVerif && (
                <div style={{ padding: "10px 14px", background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: 6, fontSize: 13, color: "#7a5800", maxWidth: 420 }}>
                  ⚠ Cette demande a été vérifiée. Pour la modifier, veuillez contacter
                  {verifierName ? <strong> {verifierName}</strong> : " le vérificateur"} qui a traité cette demande.
                </div>
              )}

              {/* ── Annulation par l'auteur ── */}
              {canCancel && (
                <button style={btnRouge} onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir annuler cette demande ? L'approbateur sera avisé.")) {
                    onCancel(request.id, user);
                  }
                }}>
                  Annuler la demande
                </button>
              )}

            </div>
          </div>
        )}

    </div>
  );
}

