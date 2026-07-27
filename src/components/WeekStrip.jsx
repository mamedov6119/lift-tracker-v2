import T from "../theme.js";
import { buildWeek } from "../lib/dates.js";

// Seven-day selector on the Training screen. A dot under the number marks a
// day that already has logged work.
export default function WeekStrip({ selected, activeDays = [], onSelect }) {
  const active = new Set(activeDays);
  const days = buildWeek(selected);

  return (
    <div style={{ margin: `0 ${T.gutter}px`, display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center" }}>
      {days.map((d) => {
        const isSelected = d.iso === selected;
        return (
          <button
            key={d.iso}
            type="button"
            onClick={() => onSelect?.(d.iso)}
            aria-pressed={isSelected}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <div style={{ fontSize: 11, color: T.textMuted }}>{d.label}</div>
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "6px auto 0", fontSize: 14, fontWeight: 600,
                color: isSelected ? "#fff" : "rgba(255,255,255,0.75)",
                background: isSelected ? T.accent : "transparent",
              }}
            >
              {d.day}
            </div>
            <div
              style={{
                width: 4, height: 4, borderRadius: "50%", margin: "4px auto 0",
                background: active.has(d.iso) && !isSelected ? T.accent : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
