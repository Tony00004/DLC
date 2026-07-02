import { useState } from "react";
import { COLORS } from "../constants";
import { S } from "../styles";
import { DLCLogo } from "../components/DLCLogo";
import { Topbar } from "../components/Topbar";
import { DemoBanner } from "../components/DemoBanner";

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onLogin(email, password);
      setError("");
    } catch (err) {
      setError(err.message || "Courriel ou mot de passe invalide.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ ...S.page, display: "flex", flexDirection: "column" }}>
      <Topbar />
      <DemoBanner />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ ...S.card, maxWidth: 460, width: "100%", padding: "0 0 32px", overflow: "hidden" }}>
          <div style={{ background: COLORS.bleu, padding: "36px 32px 28px", textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <DLCLogo size={110} />
            </div>
            <h2 style={{ margin: "0 0 6px", color: "#fff", fontSize: 24, fontWeight: 700, letterSpacing: "0.04em" }}>Connexion</h2>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.82)", fontSize: 13 }}>Accès réservé au personnel de l'école</p>
          </div>
          <div style={{ padding: "0 32px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Identifiant (courriel)</label>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #bfc7d1", borderRadius: 6, overflow: "hidden" }}>
                <input
                  style={{ ...S.input, border: "none", flex: 1, borderRadius: 0 }}
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="identifiant"
                  required
                />
                <span style={{ padding: "0 10px", background: "#f3f4f6", color: COLORS.gris, fontSize: 12, whiteSpace: "nowrap", borderLeft: "1px solid #bfc7d1", lineHeight: "38px" }}>
                  @csslaval.gouv.qc.ca
                </span>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Mot de passe</label>
              <input style={S.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <div style={S.error}>{error}</div>}
            <button type="submit" disabled={submitting} style={{ ...S.btnPrimary, width: "100%", padding: "12px", marginTop: 16, fontSize: 15, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Connexion…" : "Connexion"}
            </button>
          </form>
          <div style={{ marginTop: 24, padding: "14px 16px", background: "#f6f7f9", borderRadius: 6, fontSize: 12, color: COLORS.gris }}>
            <strong style={{ color: COLORS.bleu, fontSize: 13 }}>Comptes démo</strong>
            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              {[
                { email: "mdupont",   pwd: "1234",  nom: "Mario Dumont",   role: "Utilisateur",    color: "#6b7280" },
                { email: "jmartin",   pwd: "1234",  nom: "Jean Martin",     role: "Approbateur",    color: "#0284c7" },
                { email: "plefebvre", pwd: "1234",  nom: "Pierre Lefebvre", role: "Approbateur",    color: "#0284c7" },
                { email: "sbernard",  pwd: "1234",  nom: "Sophie Bernard",  role: "Vérificateur",   color: "#7c3aed" },
                { email: "ltremblay", pwd: "1234",  nom: "Luc Tremblay",   role: "Agent administratif",     color: "#ea580c" },
                { email: "pgagnon",   pwd: "1234",  nom: "Paula Gagnon",   role: "Magasinier",     color: "#0891b2" },
                { email: "mcaron",    pwd: "1234",  nom: "Michel Caron",   role: "Concierge",      color: "#059669" },
                { email: "admin",     pwd: "admin", nom: "Admin Système",  role: "Administrateur", color: "#dc2626" },
              ].map(c => (
                <div key={c.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", background: "#fff", borderRadius: 5, border: "1px solid #e5e7eb", cursor: "pointer" }}
                  onClick={() => { setEmail(c.email); setPassword(c.pwd); }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "#374151", fontSize: 12 }}>{c.nom}</span>
                    <span style={{ marginLeft: 6, fontSize: 11, background: c.color + "18", color: c.color, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>{c.role}</span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.gris }}>
                    {c.email} / {c.pwd}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "center" }}>Cliquez sur un compte pour le sélectionner</p>
          </div>
          </div>{/* fin padding div */}
        </div>
      </div>
    </div>
  );
}
