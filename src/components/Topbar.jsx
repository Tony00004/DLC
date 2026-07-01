import { S } from "../styles";
import { DLCLogo } from "./DLCLogo";
import { EcoleLogo } from "./EcoleLogo";

export function Topbar({ user, onLogout, setView, requests }) {
  return (
    <div style={S.topbar}>
      <div style={S.topbarLeft}>
        <DLCLogo size={50} />
      </div>
      <div style={S.topbarCenter}>
        <h1 style={S.appTitle}>Demandes Locales Centralisées</h1>
        <p style={S.subtitle}>CSS Laval</p>
      </div>
      <div style={S.topbarRight}>
        {user && (
          <>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{user.name}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                {user.roles.length > 0
                  ? user.roles.map(r => r === "A" ? "Approbateur" : r === "B" ? "Vérificateur" : r === "C1" ? "Agent administratif" : r === "C2" ? "Magasinier" : r === "C3" ? "Concierge" : r === "D" ? "Administrateur" : r).join(", ")
                  : "Utilisateur"}
              </div>
            </div>
            <button style={{ ...S.btn, fontSize: 12, padding: "6px 12px" }} onClick={onLogout}>
              Déconnexion
            </button>
          </>
        )}
        <EcoleLogo />
      </div>
    </div>
  );
}
