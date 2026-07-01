import { useState } from "react";
import * as api from "../api";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (!api.USING_MOCK || dismissed) return null;
  return (
    <div style={{
      background: "#fef3c7", borderBottom: "1px solid #f59e0b", color: "#7c4a03",
      fontSize: 13, lineHeight: 1.45,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <strong>Mode démonstration — aucun serveur détecté.</strong>{" "}
          Les données affichées sont fictives : aucune information n'est enregistrée dans une base de données.
          Les modifications que vous effectuez ne seront pas visibles par les autres utilisateurs ni sur les autres appareils,
          et seront perdues au rechargement de la page.
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          style={{ border: "none", background: "transparent", color: "#7c4a03", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
