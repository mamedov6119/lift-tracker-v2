import T from "../theme.js";
import { CheckIcon, SwapIcon } from "./icons.jsx";

// One row of the daily plan. The design's "Replace" button is repurposed as
// "Log" — this is a lift tracker, so the useful action on an open item is
// recording the set you just did, which is also what checks it off.
function PlanRow({ item, onToggle, onLog, onRemove }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.hairline}` }}>
      <button
        type="button"
        onClick={() => onToggle(item)}
        role="checkbox"
        aria-checked={item.completed}
        aria-label={`Mark ${item.name} ${item.completed ? "incomplete" : "complete"}`}
        style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: item.completed ? T.accent : "transparent",
          border: item.completed ? `1.5px solid ${T.accent}` : `1.5px solid ${T.checkBorder}`,
        }}
      >
        {item.completed && <CheckIcon />}
      </button>

      <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: item.thumb }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15, fontWeight: 600,
            color: item.completed ? T.textMuted : T.text,
            textDecoration: item.completed ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>{item.sub}</div>
      </div>

      {item.completed ? (
        <button
          type="button"
          onClick={() => onRemove?.(item)}
          style={{
            padding: "8px 14px", borderRadius: 20, background: T.veil, color: T.textMuted,
            fontSize: 12.5, fontWeight: 600, flexShrink: 0, border: "none",
            cursor: onRemove ? "pointer" : "default",
          }}
        >
          Completed
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onLog(item)}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 20,
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
      <p style={{ margin: `12px ${T.gutter}px`, fontSize: 13.5, color: T.textSecondary }}>{emptyLabel}</p>
    );
  }
  return (
    <div style={{ margin: `0 ${T.gutter}px` }}>
      {items.map((item) => (
        <PlanRow key={item.id} item={item} onToggle={onToggle} onLog={onLog} onRemove={onRemove} />
      ))}
    </div>
  );
}
