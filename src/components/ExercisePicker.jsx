import { useEffect, useMemo, useRef, useState } from "react";
import T from "../theme.js";
import { ChevronDownIcon, ExerciseGlyph } from "./icons.jsx";

const METRIC_LABEL = { weight: "weight", reps: "reps", time: "time" };

// Searchable dropdown over every exercise with logged history. Replaces a
// horizontal chip scroller, which got slower to use with each new exercise:
// here you type two letters instead of swiping through a row.
export default function ExercisePicker({ exercises, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const current = exercises.find((e) => e.id === selected);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    );
  }, [exercises, query]);

  // Close on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  // Keep the highlighted row in view as the cursor moves.
  useEffect(() => {
    listRef.current?.children[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const choose = (exercise) => {
    onSelect(exercise.id);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && matches[cursor]) {
      e.preventDefault();
      choose(matches[cursor]);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative", margin: `18px ${T.gutter}px 0` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", borderRadius: 16, background: T.card,
          border: `1px solid ${open ? T.accentBorder : "transparent"}`,
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span
          style={{
            width: 30, height: 30, borderRadius: 9, background: T.accentSoft, color: T.accent,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <ExerciseGlyph icon={current?.icon} size={16} color="currentColor" strokeWidth={2.4} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current?.name || "Choose an exercise"}
          </span>
          <span style={{ display: "block", fontSize: 12, color: T.textMuted, marginTop: 1 }}>
            {current ? `${current.sessions} session${current.sessions === 1 ? "" : "s"} · ${METRIC_LABEL[current.metric]}` : `${exercises.length} logged`}
          </span>
        </span>
        <span style={{ display: "flex", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
            background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)", overflow: "hidden",
            animation: "fadeIn .15s ease",
          }}
        >
          <div style={{ padding: 10, borderBottom: `1px solid ${T.hairline}` }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search exercises…"
              aria-label="Search exercises"
              style={{
                width: "100%", background: T.raised, border: `1px solid ${T.border}`,
                borderRadius: 10, minHeight: T.tap, padding: "0 12px", color: T.text, fontSize: 14, outline: "none",
              }}
            />
          </div>

          <div ref={listRef} data-scroll role="listbox" style={{ maxHeight: 260, overflowY: "auto", padding: 6 }}>
            {matches.map((e, i) => {
              const isSelected = e.id === selected;
              return (
                <button
                  key={e.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(e)}
                  onMouseEnter={() => setCursor(i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 10px", borderRadius: 10, border: "none", cursor: "pointer",
                    textAlign: "left",
                    background: i === cursor ? T.raised : "transparent",
                    color: isSelected ? T.accent : T.text,
                  }}
                >
                  <ExerciseGlyph icon={e.icon} size={15} color="currentColor" strokeWidth={2.4} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name}
                    </span>
                    <span style={{ display: "block", fontSize: 11.5, color: T.textMuted, marginTop: 1 }}>
                      {e.category}
                    </span>
                  </span>
                  <span style={{ fontSize: 11.5, color: T.textFaint, flexShrink: 0 }}>{e.sessions}×</span>
                </button>
              );
            })}

            {matches.length === 0 && (
              <p style={{ margin: 0, padding: "18px 12px", fontSize: 13, color: T.textSecondary, textAlign: "center" }}>
                No exercise matches “{query}”.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
