import T from "../theme.js";

// The paired metric tiles under the Home header.
export default function StatCard({ icon, label, value, align = "left" }) {
  return (
    <div style={{ flex: 1, background: T.card, borderRadius: 16, padding: "14px 14px 16px", textAlign: align }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 11.5,
          color: T.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
          justifyContent: align === "center" ? "center" : "flex-start",
        }}
      >
        {icon}
        {label}
      </div>
      <div
        className="tnum"
        style={{
          fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700, lineHeight: 1.1,
          marginTop: 8, color: T.text, letterSpacing: 0.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Compact variant used for the BEST / AVERAGE / SESSIONS row on Progress.
export function MiniStat({ label, value }) {
  return (
    <div style={{ flex: 1, background: T.card, borderRadius: 16, padding: "14px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
      <div
        className="tnum"
        style={{ fontFamily: T.fontDisplay, fontSize: 21, fontWeight: 700, color: T.text, marginTop: 6 }}
      >
        {value}
      </div>
    </div>
  );
}
