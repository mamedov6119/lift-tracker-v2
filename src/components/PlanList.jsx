import T from "../theme.js";
import { CheckIcon, SwapIcon } from "./icons.jsx";

// One row of the daily plan. The design's "Replace" button is repurposed as
// "Log" — this is a lift tracker, so the useful action on an open item is
// recording the set you just did, which is also what checks it off.
//
// The checkbox and the Log button both render a small visual but claim a full
// 44px tap area, so the row stays visually light without being fiddly to hit.
function PlanRow({ item, index, onToggle, onLog, onRemove }) {
  return (
    <div
      className="rise-in"
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
        borderBottom: `1px solid ${T.hairline}`,
        animationDelay: `${Math.min(index, 5) * 45}ms`,
      }}
    >
      <button
        type="button"
        className="pressable"
        onClick={() => onToggle(item)}
        role="checkbox"
        aria-checked={item.completed}
        aria-label={`Mark ${item.name} ${item.completed ? "incomplete" : "complete"}`}
        style={{
          width: T.tap, height: T.tap, flexShrink: 0, cursor: "pointer", padding: 0,
          background: "none", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span
          style={{
            width: 22, height: 22, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: item.completed ? T.accent : "transparent",
            border: item.completed ? `1.5px solid ${T.accent}` : `1.5px solid ${T.checkBorder}`,
            transition: "background-color 160ms ease, border-color 160ms ease",
          }}
        >
          {item.completed && <CheckIcon />}
        </span>
      </button>

      <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: item.thumb }} />

      <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
        <div
          style={{
            fontSize: 15.5, fontWeight: 600, letterSpacing: 0.1,
            color: item.completed ? T.textMuted : T.text,
            textDecoration: item.completed ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color 160ms ease",
          }}
        >
          {item.name}
        </div>
        <div className="tnum" style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>
          {item.sub}
        </div>
      </div>

      {item.completed ? (
        <button
          type="button"
          className="pressable"
          onClick={() => onRemove?.(item)}
          aria-label={`Remove ${item.name} from the plan`}
          style={{
            minHeight: T.tap, padding: "0 14px", borderRadius: 20, background: T.veil,
            color: T.textMuted, fontSize: 12.5, fontWeight: 600, flexShrink: 0, border: "none",
            cursor: onRemove ? "pointer" : "default",
          }}
        >
          Completed
        </button>
      ) : (
        <button
          type="button"
          className="pressable"
          onClick={() => onLog(item)}
          aria-label={`Log a set of ${item.name}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            minHeight: T.tap, padding: "0 14px", borderRadius: 20,
            background: T.raised, color: T.text, fontSize: 12.5, fontWeight: 600,
            border: "none", cursor: "pointer", flexShrink: 0,
          }}
        >
          <SwapIcon />
          Log
        </button>
      )}
    </div>
  );
}

export default function PlanList({ items, onToggle, onLog, onRemove, emptyLabel = "Nothing planned yet." }) {
  if (items.length === 0) {
    return (
      <p style={{ margin: `12px ${T.gutter}px`, fontSize: 13.5, lineHeight: 1.6, color: T.textSecondary }}>
        {emptyLabel}
      </p>
    );
  }
  return (
    <div style={{ margin: `0 ${T.gutter}px` }}>
      {items.map((item, i) => (
        <PlanRow
          key={item.id}
          item={item}
          index={i}
          onToggle={onToggle}
          onLog={onLog}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
