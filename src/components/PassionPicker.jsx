import { COLORS } from "../constants";
import { S } from "../styles";

// Catégorie protégée, toujours affichée en dernier — un champ texte remplace
// les sous-choix. Correspond à la valeur historiquement utilisée dans
// FormActivite.jsx (formData.passionTypes), conservée pour la rétrocompatibilité.
export const PASSION_AUTRES = "Autres";

// Sélecteur de concentration (passion) — plusieurs catégories cochables, une
// sous-option (radio) pour celles qui en ont, partagé entre FormAchat.jsx et
// FormActivite.jsx pour ne pas dupliquer cette logique.
export function PassionPicker({ categories = [], types = [], subChoices = {}, autres = "", onToggleType, onSubChoice, onAutresChange }) {
  const names = [...categories.map((c) => c.name), PASSION_AUTRES];
  return (
    <div style={{ padding: "12px 16px", background: "#f0f8f4", borderRadius: 6, marginBottom: 12 }}>
      <label style={S.label}>Quelle est la concentration (passion) concernée ?</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {names.map((name) => {
          const category = categories.find((c) => c.name === name);
          const checked = types.includes(name);
          return (
            <div key={name}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={checked} onChange={() => onToggleType(name)} />
                {name === PASSION_AUTRES ? "Autres (précisez)" : name}
              </label>
              {checked && category && category.subOptions && category.subOptions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 6, marginLeft: 24 }}>
                  {category.subOptions.map((sub) => (
                    <label key={sub} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 13, color: COLORS.gris }}>
                      <input type="radio" name={`passion-sub-${name}`} checked={subChoices[name] === sub} onChange={() => onSubChoice(name, sub)} />
                      {sub}
                    </label>
                  ))}
                </div>
              )}
              {checked && name === PASSION_AUTRES && (
                <input
                  style={{ ...S.input, marginTop: 6, marginLeft: 24, maxWidth: 400 }}
                  placeholder="Précisez la concentration"
                  value={autres}
                  onChange={(e) => onAutresChange(e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
