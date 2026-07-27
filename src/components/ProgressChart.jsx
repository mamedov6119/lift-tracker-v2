import { useEffect, useRef, useState } from "react";
import T from "../theme.js";

const VIEW_H = 120;
const PAD_Y = 10;

// Line chart from the Progress screen. Plots one point per session day,
// normalised to the series' own range — the shape is the message, not the
// absolute position on the canvas.
//
// The viewBox tracks the measured pixel width so the SVG never scales
// non-uniformly; that would squash the dots into ellipses on wide layouts.
export default function ProgressChart({ series, weeksLabel = "8 wks ago", formatValue = String }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(300);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasData = series && series.length > 0;
  const values = hasData ? series.map((p) => p.value) : [];
  const min = hasData ? Math.min(...values) : 0;
  const max = hasData ? Math.max(...values) : 0;
  const range = max - min || 1;
  const stepX = series?.length > 1 ? width / (series.length - 1) : 0;

  const dots = hasData
    ? series.map((p, i) => ({
        ...p,
        x: Math.round(i * stepX),
        y: Math.round(PAD_Y + (1 - (p.value - min) / range) * (VIEW_H - PAD_Y * 2)),
        last: i === series.length - 1,
      }))
    : [];

  return (
    <div ref={ref}>
      {hasData ? (
        <>
          <svg
            width="100%"
            height={VIEW_H}
            viewBox={`0 0 ${width} ${VIEW_H}`}
            style={{ marginTop: 16, overflow: "visible", display: "block" }}
            role="img"
            aria-label={`Trend across ${series.length} sessions, from ${formatValue(values[0])} to ${formatValue(values[values.length - 1])}`}
          >
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" y1={VIEW_H * f} x2={width} y2={VIEW_H * f} stroke={T.hairline} strokeWidth="1" />
            ))}
            <polyline
              points={dots.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={T.accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {dots.map((p) => (
              <circle key={p.date} cx={p.x} cy={p.y} r={p.last ? 5 : 3} fill={p.last ? T.accent : T.accentDot}>
                <title>{`${p.date}: ${formatValue(p.value)}`}</title>
              </circle>
            ))}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 10.5, color: T.textFaint }}>{weeksLabel}</span>
            <span style={{ fontSize: 10.5, color: T.textFaint }}>Today</span>
          </div>
        </>
      ) : (
        <p style={{ margin: "24px 0", fontSize: 13, color: T.textSecondary, textAlign: "center" }}>
          No sessions logged for this lift yet.
        </p>
      )}
    </div>
  );
}
