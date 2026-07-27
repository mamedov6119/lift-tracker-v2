import { useState } from "react";
import T from "../theme.js";
import { BoltIcon, ChevronDownIcon, CloseIcon } from "./icons.jsx";

// The design's collapsible TODAY'S INSIGHT banner. Collapsed by default so a
// nudge never blocks the screen — expanding it is the lifter's choice, and
// dismissing keeps the "observational, never nagging" contract from v1.
export default function InsightBanner({ insight, onDismiss, sunken = false }) {
  const [open, setOpen] = useState(false);
  if (!insight) return null;

  return (
    <div
      style={{
        margin: `0 ${T.gutter}px`,
        background: sunken ? T.cardSunken : T.card,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${T.accentBorder}`,
        animation: "fadeIn .2s ease",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span
          style={{
            width: 28, height: 28, borderRadius: 8, background: T.accentSoft,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <BoltIcon />
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: 0.2 }}>
          TODAY'S INSIGHT
        </span>
        <span style={{ display: "flex", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>
            {insight.title}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,0.8)" }}>
            {insight.body}
          </p>
          {insight.citation && (
            <p style={{ margin: "10px 0 0", fontSize: 11.5, lineHeight: 1.5, color: T.textSecondary, fontStyle: "italic" }}>
              {insight.citation}
            </p>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(insight.id)}
              style={{
                marginTop: 12, display: "flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: 20, background: T.raised,
                color: T.textSecondary, fontSize: 12, fontWeight: 600,
                border: "none", cursor: "pointer",
              }}
            >
              <CloseIcon size={9} color={T.textSecondary} strokeWidth={2} />
              Dismiss for today
            </button>
          )}
        </div>
      )}
    </div>
  );
}
