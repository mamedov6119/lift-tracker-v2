import T from "../../theme.js";

export default function ScreenHeader({ title, subtitle, trailing }) {
  return (
    <div style={{ padding: `28px ${T.gutter}px 4px`, display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: -0.4 }}>{title}</h1>
        {subtitle && <p style={{ margin: "2px 0 0", fontSize: 13, color: T.textMuted }}>{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}
