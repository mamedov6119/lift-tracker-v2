import { useEffect, useMemo, useRef, useState } from "react";
import T from "../theme.js";
import { api } from "../lib/api.js";
import { CloseIcon, ExerciseGlyph } from "./icons.jsx";

const METRICS = [
  { id: "weight", label: "Weight", hint: "Barbell and dumbbell work — logged as weight × reps." },
  { id: "reps", label: "Reps", hint: "Bodyweight work — logged as reps." },
  { id: "time", label: "Time", hint: "Held or continuous work — logged in seconds." },
];
const ICONS = ["barbell", "chevron", "rope", "arrows"];

const field = {
  background: T.raised, border: `1px solid ${T.border}`, borderRadius: 12,
  padding: "11px 12px", color: T.text, fontSize: 15, outline: "none", width: "100%", minWidth: 0,
};
const labelStyle = { fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.3, textTransform: "uppercase" };
const primaryBtn = {
  width: "100%", padding: 14, borderRadius: 20, background: "#fff", color: "#000",
  fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
};
const ghostBtn = {
  padding: "10px 14px", borderRadius: 20, background: T.raised, color: T.textSecondary,
  fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
};

function Pill({ active, children, ...rest }) {
  return (
    <button
      type="button"
      style={{
        padding: "8px 14px", borderRadius: 18, fontSize: 13, fontWeight: 600, cursor: "pointer",
        border: "none", background: active ? T.accent : T.raised, color: active ? "#fff" : T.textSecondary,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// Adds any exercise to a day's plan — the catalog browser the Advisor deck
// isn't: the Advisor suggests, this lets you go and get a specific lift.
// Also where new exercises are created, so the catalog isn't a fixed list.
export default function AddExerciseSheet({ date, planExerciseIds = [], onAdd, onClose }) {
  const [step, setStep] = useState("browse");
  const [exercises, setExercises] = useState([]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [seconds, setSeconds] = useState("45");
  const [draft, setDraft] = useState({ name: "", category: "", metric: "weight", icon: "barbell" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    api.getExercises().then(setExercises).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (step === "browse") searchRef.current?.focus();
  }, [step]);

  const inPlan = new Set(planExerciseIds);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    );
  }, [exercises, query]);

  const choose = (exercise) => {
    setPicked(exercise);
    setError(null);
    setStep("target");
  };

  const submitTarget = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onAdd({
        exerciseId: picked.id,
        targetSets: Number(sets) || 1,
        targetReps: Number(reps) || 1,
        targetSeconds: Number(seconds) || 30,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Give the exercise a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.createExercise({
        name: draft.name.trim(),
        category: draft.category.trim(),
        metric: draft.metric,
        icon: draft.icon,
      });
      setExercises((current) => [...current, created]);
      setBusy(false);
      choose(created);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const heading = step === "create" ? "New exercise" : step === "target" ? picked.name : "Add exercise";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: T.card,
          borderRadius: "24px 24px 0 0", padding: "18px 20px 24px",
          animation: "sheetUp .2s ease", maxHeight: "88dvh",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <h2 style={{ margin: 0, flex: 1, fontSize: 17, fontWeight: 700, color: T.text }}>{heading}</h2>
          {step !== "browse" && (
            <button type="button" onClick={() => { setStep("browse"); setError(null); }} style={ghostBtn}>
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 10, background: T.raised, border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}
          >
            <CloseIcon size={11} />
          </button>
        </div>

        {step === "browse" && (
          <>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises…"
              aria-label="Search exercises"
              style={{ ...field, marginBottom: 10 }}
            />

            <div data-scroll style={{ flex: 1, overflowY: "auto", minHeight: 120, margin: "0 -4px" }}>
              {matches.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => choose(e)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 4px", background: "none", border: "none",
                    borderBottom: `1px solid ${T.hairline}`, cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 38, height: 38, borderRadius: 11, background: e.thumb, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    <ExerciseGlyph icon={e.icon} size={18} color="currentColor" strokeWidth={2.4} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name}
                    </span>
                    <span style={{ display: "block", fontSize: 11.5, color: T.textMuted, marginTop: 1 }}>
                      {e.category || "Custom"}
                    </span>
                  </span>
                  {inPlan.has(e.id) && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, flexShrink: 0 }}>IN PLAN</span>
                  )}
                </button>
              ))}

              {matches.length === 0 && (
                <p style={{ margin: 0, padding: "20px 4px", fontSize: 13, color: T.textSecondary, textAlign: "center" }}>
                  Nothing matches “{query}”. Create it below.
                </p>
              )}
            </div>

            {error && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: T.accent }}>{error}</p>}

            <button
              type="button"
              onClick={() => { setDraft((d) => ({ ...d, name: query.trim() })); setError(null); setStep("create"); }}
              style={{ ...primaryBtn, marginTop: 14 }}
            >
              + Create new exercise
            </button>
          </>
        )}

        {step === "target" && (
          <form onSubmit={submitTarget}>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: T.textSecondary }}>
              {picked.category || "Custom"} · logged in {picked.metric === "time" ? "seconds" : picked.metric === "reps" ? "reps" : "weight × reps"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={labelStyle}>Sets</span>
                <input style={field} type="number" inputMode="numeric" min="1" value={sets} onChange={(e) => setSets(e.target.value)} />
              </label>
              {picked.metric === "time" ? (
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={labelStyle}>Seconds</span>
                  <input style={field} type="number" inputMode="numeric" min="1" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
                </label>
              ) : (
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={labelStyle}>Reps</span>
                  <input style={field} type="number" inputMode="numeric" min="1" value={reps} onChange={(e) => setReps(e.target.value)} />
                </label>
              )}
            </div>

            <p style={{ margin: "12px 0 0", fontSize: 11.5, color: T.textFaint, lineHeight: 1.5 }}>
              These are targets for the plan line. What you actually lift is whatever you log against it.
            </p>

            {error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: T.accent }}>{error}</p>}

            <button type="submit" disabled={busy} style={{ ...primaryBtn, marginTop: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Adding…" : "Add to plan"}
            </button>
          </form>
        )}

        {step === "create" && (
          <form onSubmit={submitCreate} data-scroll style={{ overflowY: "auto" }}>
            <div style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={labelStyle}>Name</span>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus -- first field of a purpose-built form */}
                <input style={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Bulgarian Split Squat" autoFocus />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={labelStyle}>Category</span>
                <input style={field} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Unilateral · Legs" />
              </label>

              <div style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>How is it measured?</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {METRICS.map((m) => (
                    <Pill key={m.id} active={draft.metric === m.id} onClick={() => setDraft({ ...draft, metric: m.id })}>
                      {m.label}
                    </Pill>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: T.textFaint, lineHeight: 1.5 }}>
                  {METRICS.find((m) => m.id === draft.metric).hint} This can't be changed later without
                  losing the exercise's history, so pick the one that matches how you'll train it.
                </p>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>Icon</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setDraft({ ...draft, icon })}
                      aria-label={icon}
                      aria-pressed={draft.icon === icon}
                      style={{
                        width: 44, height: 44, borderRadius: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "none",
                        background: draft.icon === icon ? T.accentSoft : T.raised,
                        color: draft.icon === icon ? T.accent : T.textSecondary,
                      }}
                    >
                      <ExerciseGlyph icon={icon} size={20} color="currentColor" strokeWidth={2.4} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: T.accent }}>{error}</p>}

            <button type="submit" disabled={busy} style={{ ...primaryBtn, marginTop: 18, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Creating…" : "Create & set targets"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
