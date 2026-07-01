export function resolveApprobateur(matiere, niveau, rules, users) {
  if (!rules || rules.length === 0) return null;
  const rule = rules.find(r => {
    const mOk = r.matieres.length === 0 || r.matieres.includes(matiere);
    const nOk = r.niveaux.length === 0   || r.niveaux.includes(niveau);
    return mOk && nOk;
  });
  if (!rule) return null;
  return users.find(u => u.id === rule.approbateurId) || null;
}
