import T from "../theme.js";
import ScreenHeader from "../components/ui/ScreenHeader.jsx";
import InsightBanner from "../components/InsightBanner.jsx";
import ProgressChart from "../components/ProgressChart.jsx";
import ExercisePicker from "../components/ExercisePicker.jsx";
import { MiniStat } from "../components/StatCard.jsx";
import { useProgress } from "../hooks/useProgress.js";
import { formatMetricValue, splitMetricValue } from "../lib/format.js";

const FOOTNOTE = {
  weight: "Plotted as estimated 1RM (Epley) from your best set each day — it tracks strength across different rep ranges more honestly than top weight alone.",
  reps: "Plotted as your best set each day, in reps.",
  time: "Plotted as your longest hold each day.",
};

export default function ProgressTab({ insight, onDismissInsight }) {
  const { exercises, selected, setSelected, detail, loading, error } = useProgress();
  const metric = detail?.metric || "weight";
  const unit = detail?.unit || "lb";
  const up = (detail?.trendPct ?? 0) >= 0;
  const current = detail ? splitMetricValue(detail.current, metric, unit) : null;

  return (
    <>
      <ScreenHeader title="Progress" subtitle="Track how each lift is trending" />

      <div style={{ marginTop: 14 }}>
        <InsightBanner insight={insight} onDismiss={onDismissInsight} sunken />
      </div>

      {error && <p style={{ margin: `16px ${T.gutter}px`, fontSize: 13, color: T.accent }}>{error}</p>}

      {exercises.length > 0 && (
        <ExercisePicker exercises={exercises} selected={selected} onSelect={setSelected} />
      )}

      {exercises.length === 0 && !loading && (
        <p style={{ margin: `24px ${T.gutter}px`, fontSize: 13.5, color: T.textSecondary, lineHeight: 1.6 }}>
          Nothing to chart yet. Log a set from the Training tab and the exercise shows up here.
        </p>
      )}

      {detail && (
        <>
          <div style={{ margin: `16px ${T.gutter}px 0`, background: T.card, borderRadius: 20, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{detail.exercise.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                  {detail.sessions} session{detail.sessions === 1 ? "" : "s"} logged
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>
                  {current.value}
                  <span style={{ fontSize: 12, fontWeight: 500, color: T.textMuted }}>{current.unit}</span>
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4, color: up ? T.success : T.accent }}>
                  {up ? "+" : ""}{detail.trendPct}% vs 8 wks ago
                </div>
              </div>
            </div>

            <ProgressChart
              series={detail.series}
              formatValue={(v) => formatMetricValue(v, metric, unit)}
            />
          </div>

          <div style={{ display: "flex", gap: 12, margin: `16px ${T.gutter}px 0` }}>
            <MiniStat label="BEST" value={formatMetricValue(detail.best, metric, unit)} />
            <MiniStat label="AVERAGE" value={formatMetricValue(detail.avg, metric, unit)} />
            <MiniStat label="SESSIONS" value={detail.sessions} />
          </div>

          <p style={{ margin: `12px ${T.gutter}px 0`, fontSize: 11.5, color: T.textFaint, lineHeight: 1.5 }}>
            {FOOTNOTE[metric]}
          </p>
        </>
      )}
    </>
  );
}
