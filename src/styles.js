import { COLORS } from "./constants";

export const S = {
  // Layout
  page: { minHeight: "100vh", background: COLORS.fond, fontFamily: "Arial, Helvetica, sans-serif", color: COLORS.noir },
  topbar: {
    background: COLORS.bleu, display: "grid", gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center", padding: "14px 24px", gap: 16,
  },
  topbarLeft: { display: "flex", alignItems: "center", justifyContent: "flex-start" },
  topbarCenter: { textAlign: "center" },
  topbarRight: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 },
  appTitle: { margin: 0, fontSize: 22, color: "#fff", fontWeight: 700, letterSpacing: "0.07em" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#fff", opacity: 0.85 },
  content: { maxWidth: 1200, margin: "0 auto", padding: "28px 24px" },
  card: { background: "#fff", border: "1px solid #d9dee5", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", padding: "28px 32px", marginBottom: 24 },
  // Typography
  sectionTitle: { margin: "0 0 14px", fontSize: 18, color: COLORS.vertFonce, borderBottom: `2px solid ${COLORS.vertFonce}`, paddingBottom: 8, fontWeight: 700 },
  label: { display: "block", marginBottom: 6, fontWeight: 700, fontSize: 14 },
  // Inputs
  input: { width: "100%", border: "1px solid #bfc7d1", borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "#fff", boxSizing: "border-box" },
  select: { width: "100%", border: "1px solid #bfc7d1", borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "#fff", boxSizing: "border-box" },
  textarea: { width: "100%", border: "1px solid #bfc7d1", borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "#fff", boxSizing: "border-box", minHeight: 90, resize: "vertical" },
  // Buttons
  btnPrimary: { background: COLORS.vert, color: "#fff", border: `1px solid ${COLORS.vertFonce}`, borderRadius: 6, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700 },
  btn: { background: "#fff", color: COLORS.noir, border: "1px solid #c8d0d8", borderRadius: 6, padding: "9px 16px", fontSize: 14, cursor: "pointer" },
  btnDanger: { background: COLORS.rouge, color: "#fff", border: `1px solid ${COLORS.rouge}`, borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
  btnSmall: { background: "#fff", color: COLORS.vert, border: `2px solid ${COLORS.vert}`, borderRadius: 6, padding: "2px 12px", fontSize: 18, fontWeight: 700, cursor: "pointer", lineHeight: 1 },
  // Grids
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 22px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px 22px" },
  field: { marginBottom: 0 },
  // Messages
  success: { background: "#e8f7ee", border: "1px solid #b7dfc5", color: "#146c3a", borderRadius: 6, padding: "12px 14px", marginTop: 14, fontSize: 14 },
  error: { background: "#fdecec", border: "1px solid #f5c2c7", color: "#842029", borderRadius: 6, padding: "12px 14px", marginTop: 14, fontSize: 14 },
  // Badges
  badge: (color) => ({ display: "inline-block", background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 700 }),
  // Tables
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: COLORS.vertFonce, color: "#fff", padding: "8px 10px", textAlign: "left", fontSize: 13, fontWeight: 700 },
  td: { padding: "8px 10px", borderBottom: "1px solid #e5e7eb", fontSize: 13, verticalAlign: "middle" },
};
