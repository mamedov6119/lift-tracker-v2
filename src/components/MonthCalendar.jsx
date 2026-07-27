import T from "../theme.js";
import { WEEKDAYS, buildMonthGrid } from "../lib/dates.js";

// Month grid from the Home screen. Days with logged activity get a ring; the
// selected day gets the accent fill.
//
// The visible circle stays 34px for grid density, but each button fills its
// whole cell (~62 × 44) so the tap area clears the 44px minimum.
export default function MonthCalendar({ month, selected, activeDays = [], onSelect }) {
  const active = new Set(activeDays);
  const cells = buildMonthGrid(month);

  return (
    <div
      style={{ margin: `0 ${T.gutter}px`, display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center" }}
      role="grid"
      aria-label="Training calendar"
    >
      {WEEKDAYS.map((label) => (
        <div key={label} style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, color: T.textFaint, paddingBottom: 8 }}>
          {label}
        </div>
      ))}

      {cells.map((cell) => {
        const isSelected = cell.iso === selected;
        const hasRing = !cell.outside && active.has(cell.iso) && !isSelected;
        return (
          <button
            key={cell.iso}
            type="button"
            className="pressable"
            onClick={() => onSelect?.(cell.iso)}
            aria-pressed={isSelected}
            aria-label={`${cell.iso}${hasRing ? ", trained" : ""}`}
            style={{
              width: "100%", height: T.tap, padding: 0, border: "none", background: "none",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <span
              className="tnum"
              style={{
                width: 34, height: 34, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontDisplay,
                fontSize: 15.5, fontWeight: isSelected ? 700 : 500,
                color: cell.outside ? T.textDisabled : isSelected ? T.accentInk : "rgba(255,255,255,0.88)",
                background: isSelected ? T.accent : "transparent",
                border: hasRing ? "1.5px solid rgba(255,255,255,0.38)" : "1.5px solid transparent",
                transition: "background-color 160ms ease, border-color 160ms ease",
              }}
            >
              {cell.day}
            </span>
          </button>
        );
      })}
    </div>
  );
}
