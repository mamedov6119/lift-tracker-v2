import T from "../theme.js";
import { WEEKDAYS, buildMonthGrid } from "../lib/dates.js";

// Month grid from the Home screen. Days with logged activity get a ring; the
// selected day gets the accent fill.
export default function MonthCalendar({ month, selected, activeDays = [], onSelect }) {
  const active = new Set(activeDays);
  const cells = buildMonthGrid(month);

  return (
    <div style={{ margin: `0 ${T.gutter}px`, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px 0", textAlign: "center" }}>
      {WEEKDAYS.map((label) => (
        <div key={label} style={{ fontSize: 11, color: T.textFaint, paddingBottom: 6 }}>
          {label}
        </div>
      ))}

      {cells.map((cell) => {
        const isSelected = cell.iso === selected;
        const hasRing = !cell.outside && active.has(cell.iso) && !isSelected;
        return (
          <div key={cell.iso} style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
            <button
              type="button"
              onClick={() => onSelect?.(cell.iso)}
              aria-pressed={isSelected}
              aria-label={cell.iso}
              style={{
                width: 34, height: 34, borderRadius: "50%", padding: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: isSelected ? 700 : 500,
                color: cell.outside ? T.textDisabled : isSelected ? "#fff" : "rgba(255,255,255,0.85)",
                background: isSelected ? T.accent : "transparent",
                border: hasRing ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid transparent",
                cursor: "pointer",
              }}
            >
              {cell.day}
            </button>
          </div>
        );
      })}
    </div>
  );
}
