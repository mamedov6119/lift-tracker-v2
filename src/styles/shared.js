import T from "../theme.js";

export const inputStyle = {
    background: T.surface2,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "10px 12px",
    color: T.textPrimary,
    fontSize: 14,
    outline: "none",
    fontFamily: "'Manrope', sans-serif",
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
};
export const primaryBtn = {
    background: T.teal,
    color: "#04342C",
    border: "none",
    borderRadius: 10,
    padding: "11px 16px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: "'Manrope', sans-serif",
};
export const secondaryBtn = {
    background: "transparent",
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "11px 16px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    color: T.textSecondary,
    fontFamily: "'Manrope', sans-serif",
};