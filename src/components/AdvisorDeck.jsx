import { useCallback, useRef, useState } from "react";
import T from "../theme.js";
import { CloseIcon, EmptyCheckIcon, ExerciseGlyph } from "./icons.jsx";

const SWIPE_THRESHOLD = 90;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Exercise Advisor: a swipe deck over the suggestion queue. Swiping right (or
// pressing the green button, or →) adds the exercise to the day's plan.
export default function AdvisorDeck({ queue, onReview, onClose }) {
  const [drag, setDrag] = useState({ x: 0, active: false });
  const startX = useRef(0);
  const [top, next] = queue;

  const commit = useCallback(
    (accepted) => {
      if (!top) return;
      setDrag({ x: 0, active: false });
      onReview(top, accepted);
    },
    [top, onReview]
  );

  const onPointerDown = (e) => {
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ x: 0, active: true });
  };
  const onPointerMove = (e) => {
    if (!drag.active) return;
    setDrag({ x: e.clientX - startX.current, active: true });
  };
  const onPointerUp = () => {
    if (!drag.active) return;
    if (drag.x > SWIPE_THRESHOLD) commit(true);
    else if (drag.x < -SWIPE_THRESHOLD) commit(false);
    else setDrag({ x: 0, active: false });
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") commit(true);
    if (e.key === "ArrowLeft") commit(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${T.gutter}px` }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Exercise Advisor</h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close advisor"
          style={{
            width: 34, height: 34, borderRadius: 10, background: T.card, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <CloseIcon />
        </button>
      </div>

      {top ? (
        <>
          <div style={{ flex: 1, position: "relative", margin: `18px ${T.gutter}px 8px`, minHeight: 340 }}>
            {next && (
              <div
                style={{
                  position: "absolute", inset: 0, borderRadius: 26, background: next.thumb,
                  transform: "scale(0.94) translateY(10px)", opacity: 0.55,
                }}
              />
            )}
            <div
              role="group"
              tabIndex={0}
              aria-label={`${top.name}. Press right arrow to add, left arrow to skip.`}
              onKeyDown={onKeyDown}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                position: "absolute", inset: 0, borderRadius: 26, background: top.thumb,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                touchAction: "none", cursor: "grab", userSelect: "none", outline: "none",
                transform: `translateX(${drag.x}px) rotate(${drag.x / 14}deg)`,
                transition: drag.active ? "none" : "transform .3s ease",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ ...stampStyle, left: 22, background: "rgba(51,224,150,0.9)", color: T.successInk, transform: "rotate(-8deg)", opacity: clamp01(drag.x / 80) }}>
                ADD
              </div>
              <div style={{ ...stampStyle, right: 22, background: "rgba(255,77,77,0.9)", color: "#fff", transform: "rotate(8deg)", opacity: clamp01(-drag.x / 80) }}>
                SKIP
              </div>

              <div
                style={{
                  width: 88, height: 88, borderRadius: 24, background: "rgba(255,255,255,0.14)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <ExerciseGlyph icon={top.icon} size={46} color="#fff" />
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, color: T.text, marginTop: 20, textAlign: "center", padding: "0 20px" }}>
                {top.name}
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 6 }}>{top.category}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, padding: "8px 20px 26px" }}>
            <button
              type="button"
              onClick={() => commit(false)}
              aria-label={`Skip ${top.name}`}
              style={{
                width: 58, height: 58, borderRadius: "50%", background: T.card,
                border: "1.5px solid rgba(255,77,77,0.5)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <CloseIcon size={20} color={T.accent} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => commit(true)}
              aria-label={`Add ${top.name} to today's plan`}
              style={{
                width: 58, height: 58, borderRadius: "50%", background: T.success, border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
                <path d="M2 9l6 6L20 2" stroke={T.successInk} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "60px 40px", textAlign: "center" }}>
          <EmptyCheckIcon />
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>You've reviewed every suggestion</div>
          <div style={{ fontSize: 13, color: T.textSecondary }}>Come back tomorrow for a fresh set.</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: 8, padding: "12px 22px", borderRadius: 20, background: "#fff",
              color: "#000", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
            }}
          >
            Back to plan
          </button>
        </div>
      )}
    </div>
  );
}

const stampStyle = {
  position: "absolute", top: 22, padding: "6px 14px", borderRadius: 10,
  fontSize: 13, fontWeight: 800, letterSpacing: 1, pointerEvents: "none",
};
