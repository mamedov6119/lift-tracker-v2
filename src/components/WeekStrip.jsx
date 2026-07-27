import T from "../theme.js";
import { buildWeek } from "../lib/dates.js";

// Seven-day selector on the Training screen. A dot under the number marks a
// day that already has logged work — activity is not signalled by colour
// alone, since the selected day also carries the accent fill.
export default function WeekStrip({ selected, activeDays = [], onSelect }) {
  const active = new Set(activeDays);
  const days = buildWeek(selected);

  return (
    <div style={{ margin: `0 ${T.gutter}px`, display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center" }}>
      {days.map((d) => {
        const isSelected = d.iso === selected;
        const isActive = active.has(d.iso);
        return (
          <button
            key={d.iso}
            type="button"
            className="pressable"
            onClick={() => onSelect?.(d.iso)}
            aria-pressed={isSelected}
            aria-label={`${d.iso}${isActive ? ", trained" : ""}`}
            style={{
              background: "none", border: "none", padding: "4px 0", cursor: "pointer",
              minHeight: T.tap + 20, display: "flex", flexDirection: "column", alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: T.textMuted }}>{d.label}</span>
            <span
              className="tnum"
              style={{
                width: 34, height: 34, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "6px auto 0", fontFamily: T.fontDisplay, fontSize: 15.5, fontWeight: 600,
                color: isSelected ? T.accentInk : "rgba(255,255,255,0.82)",
                background: isSelected ? T.accent : "transparent",
                transition: "background-color 160ms ease",
              }}
            >
              {d.day}
            </span>
            <span
              style={{
                width: 4, height: 4, borderRadius: "50%", marginTop: 5,
                background: isActive && !isSelected ? T.accent : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
