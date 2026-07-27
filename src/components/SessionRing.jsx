import T from "../theme.js";
import { CircleCheckIcon } from "./icons.jsx";

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

// Session progress ring on the Training screen: how much of the day's plan is
// done. It replaced a calorie ring, which was an estimate dressed up as a
// measurement — this counts something the lifter actually did.
export default function SessionRing({ completed = 0, planned = 0 }) {
  const pct = planned > 0 ? Math.min(1, completed / planned) : 0;
  return (
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="60" cy="60" r={R} fill="none" stroke={T.track} strokeWidth="10" />
        <circle
          cx="60" cy="60" r={R} fill="none" stroke={T.accent} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE.toFixed(1)}
          strokeDashoffset={(CIRCUMFERENCE * (1 - pct)).toFixed(1)}
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      <div
        style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        role="img"
        aria-label={planned > 0 ? `${completed} of ${planned} exercises complete` : "Nothing planned"}
      >
        <CircleCheckIcon size={13} color={T.accent} />
        <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginTop: 2 }}>
          {planned > 0 ? completed : "—"}
        </div>
        <div style={{ fontSize: 11, color: T.textMuted }}>
          {planned > 0 ? `of ${planned} done` : "no plan"}
        </div>
      </div>
    </div>
  );
}
