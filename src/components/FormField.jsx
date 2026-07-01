import { COLORS } from "../constants";
import { S } from "../styles";

export function F({ label, required: req, children }) {
  return (
    <div style={S.field}>
      <label style={S.label}>
        {label}{req && <span style={{ color: COLORS.rouge }}> *</span>}
      </label>
      {children}
    </div>
  );
}
