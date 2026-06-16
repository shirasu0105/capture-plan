// Shared inline style objects ported from the prototype's S()/renderVals().
// Values reference the CSS custom properties applied on the app shell.
import type { CSSProperties } from "react";

const MONO = "'JetBrains Mono', monospace";
export const mono = MONO;

export const sBtnPrimary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--primary)",
  color: "var(--on-primary)",
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
};
export const sBtnPrimaryHover: CSSProperties = { background: "var(--primary-hover)" };

export const sBtnSecondary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  background: "var(--surface-2)",
  color: "var(--ink)",
  border: "1px solid var(--hairline)",
  borderRadius: "8px",
  height: "34px",
  padding: "0 13px",
  fontSize: "13.5px",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
export const sBtnSecondaryHover: CSSProperties = {
  background: "var(--surface-hover)",
  border: "1px solid var(--hairline-strong)",
};

export const sGhost: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "transparent",
  color: "var(--ink-subtle)",
  border: "none",
  borderRadius: "7px",
  padding: "6px 8px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
export const sGhostHover: CSSProperties = { background: "var(--surface-2)", color: "var(--ink)" };

export const sCard: CSSProperties = {
  background: "var(--surface-1)",
  border: "1px solid var(--hairline)",
  borderRadius: "12px",
};

export const sInput: CSSProperties = {
  width: "100%",
  background: "var(--surface-1)",
  color: "var(--ink)",
  border: "1px solid var(--hairline-strong)",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "14px",
  outline: "none",
};

export const sTextarea: CSSProperties = {
  ...sInput,
  minHeight: "120px",
  lineHeight: 1.6,
  fontFamily: "inherit",
  resize: "vertical",
};

export const sInputFocus: CSSProperties = {
  border: "1px solid var(--primary)",
  boxShadow: "0 0 0 3px rgba(94,106,210,0.22)",
};

export const rowHover: CSSProperties = { background: "var(--surface-2)" };
export const availHover: CSSProperties = { background: "var(--surface-2)" };
export const menuItemHover: CSSProperties = { background: "var(--surface-2)" };

export const stepBtn: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 6,
  border: "1px solid var(--hairline-strong)",
  background: "var(--surface-1)",
  color: "var(--ink-muted)",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: "1",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};
export const stepBtnHover: CSSProperties = { background: "var(--surface-2)", color: "var(--ink)" };

export const statusBtnHover: CSSProperties = {
  filter: "brightness(1.12)",
  border: "1px solid var(--hairline-strong)",
};

export const delBtn: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "none",
  background: "transparent",
  color: "var(--ink-tertiary)",
  cursor: "pointer",
  fontSize: 13,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};
export const delBtnHover: CSSProperties = { background: "var(--st-check-bg)", color: "#e5534b" };

export const iconBtn: CSSProperties = {
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 7,
  background: "transparent",
  color: "var(--ink-subtle)",
  cursor: "pointer",
};
export const iconBtnHover: CSSProperties = { background: "var(--surface-2)", color: "var(--ink)" };

export const topbarActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  height: "28px",
  padding: "0 10px",
  borderRadius: "8px",
  border: "1px solid var(--hairline)",
  background: "var(--surface-2)",
  color: "var(--ink)",
  fontSize: "12.5px",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  cursor: "pointer",
};
export const topbarActionHover: CSSProperties = {
  background: "var(--surface-hover)",
  border: "1px solid var(--hairline-strong)",
};

export const addOptStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  width: "100%",
  marginTop: "8px",
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px dashed var(--hairline-strong)",
  background: "transparent",
  color: "var(--ink-subtle)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};
export const addOptHover: CSSProperties = {
  background: "var(--surface-2)",
  border: "1px dashed var(--ink-tertiary)",
  color: "var(--ink)",
};

export const sortHover: CSSProperties = { background: "var(--surface-2)" };
export const trHover: CSSProperties = { background: "var(--surface-2)" };
