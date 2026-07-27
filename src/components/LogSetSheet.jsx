import { useEffect, useState } from "react";
import T from "../theme.js";
import { CloseIcon } from "./icons.jsx";

const field = {
  background: T.raised, border: `1px solid ${T.border}`, borderRadius: 12,
  minHeight: T.tap, padding: "0 12px", color: T.text, fontSize: 15, outline: "none",
  width: "100%", minWidth: 0,
};
const labelStyle = { fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.3, textTransform: "uppercase" };

// Bottom sheet for recording an actual set. The design's plan rows only have a
// checkbox; this is where the numbers behind the checkbox come from, and it's
// what feeds every chart and rule in the app.
//
// Which fields appear depends on how the exercise is measured — a plank asks
// for seconds, a pull-up for reps, a squat for weight and reps.
export default function LogSetSheet({ exercise, date, unit = "lb", onSubmit, onClose }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [seconds, setSeconds] = useState("");
  const [rpe, setRpe] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!exercise) return null;
  const metric = exercise.metric || "weight";
  const isTimed = metric === "time";

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(isTimed ? seconds : reps);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(isTimed ? "Enter how long you held it, in seconds." : "Enter how many reps you completed.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        exerciseId: exercise.exerciseId || exercise.id,
        date,
        weight: metric === "weight" ? Number(weight) || 0 : 0,
        reps: isTimed ? 0 : amount,
        durationSeconds: isTimed ? amount : 0,
        rpe: rpe === "" ? null : Number(rpe),
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Log a set of ${exercise.name}`}
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: T.card,
          borderRadius: "24px 24px 0 0", padding: "18px 20px 28px",
          animation: "sheetUp .2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: exercise.thumb, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{exercise.name}</div>
            <div style={{ fontSize: 12.5, color: T.textSecondary, marginTop: 1 }}>{exercise.category}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: T.tap, height: T.tap, borderRadius: 12, background: T.raised, border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}
          >
            <CloseIcon size={11} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: metric === "weight" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
          {metric === "weight" && (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Weight ({unit})</span>
              <input style={field} type="number" inputMode="decimal" step="2.5" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
            </label>
          )}
          {isTimed ? (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Seconds</span>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the sheet exists only to capture this field */}
              <input style={field} type="number" inputMode="numeric" min="1" value={seconds} onChange={(e) => setSeconds(e.target.value)} placeholder="0" autoFocus />
            </label>
          ) : (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Reps</span>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the sheet exists only to capture this field */}
              <input style={field} type="number" inputMode="numeric" min="1" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="0" autoFocus />
            </label>
          )}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>RPE</span>
            <input style={field} type="number" inputMode="decimal" step="0.5" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} placeholder="—" />
          </label>
        </div>

        {error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: T.accent }}>{error}</p>}

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 18, width: "100%", padding: 14, borderRadius: 20,
            background: "#fff", color: "#000", fontSize: 15, fontWeight: 700,
            border: "none", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Log set"}
        </button>
      </form>
    </div>
  );
}
