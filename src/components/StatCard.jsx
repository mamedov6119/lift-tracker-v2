import T from "../theme.js";

// The paired metric tiles under the Home header.
export default function StatCard({ icon, label, value, align = "left" }) {
  return (
    <div style={{ flex: 1, background: T.card, borderRadius: 16, padding: 14, textAlign: align }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 12,
          color: T.textSecondary, fontWeight: 600,
          justifyContent: align === "center" ? "center" : "flex-start",
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: T.text }}>{value}</div>
    </div>
  );
}

// Compact variant used for the BEST / AVERAGE / SESSIONS row on Progress.
export function MiniStat({ label, value }) {
  return (
    <div style={{ flex: 1, background: T.card, borderRadius: 16, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginTop: 6 }}>{value}</div>
    </div>
  );
}
