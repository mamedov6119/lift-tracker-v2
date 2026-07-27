import T from "../theme.js";
import InsightBanner from "../components/InsightBanner.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import PlanList from "../components/PlanList.jsx";
import SessionRing from "../components/SessionRing.jsx";
import AdvisorDeck from "../components/AdvisorDeck.jsx";
import { ArrowRightIcon, CircleCheckIcon, PlusIcon, StarIcon } from "../components/icons.jsx";
import { formatMinutes, formatVolume } from "../lib/format.js";

function StatLine({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default function TrainingTab({
  date, onSelectDate, summary, session, plan, insight, onDismissInsight,
  onTogglePlanItem, onLogPlanItem, onRemovePlanItem, onCompleteAll, onAddExercise,
  advisorOpen, onOpenAdvisor, onCloseAdvisor, advisorQueue, onReviewCard,
}) {
  if (advisorOpen) {
    return <div style={{ paddingTop: 28, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <AdvisorDeck queue={advisorQueue} onReview={onReviewCard} onClose={onCloseAdvisor} />
    </div>;
  }

  const allDone = plan.length > 0 && plan.every((i) => i.completed);

  return (
    <>
      <div style={{ margin: `28px ${T.gutter}px 0` }}>
        <button
          type="button"
          onClick={onOpenAdvisor}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 18, background: T.accentGradient,
            border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          }}
        >
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <StarIcon />
          </span>
          <span style={{ flex: 1, textAlign: "left" }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 700 }}>Exercise Advisor</span>
            <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,0.8)", marginTop: 1 }}>
              {advisorQueue.length > 0
                ? `${advisorQueue.length} suggestion${advisorQueue.length === 1 ? "" : "s"} for today's plan`
                : "You've reviewed every suggestion"}
            </span>
          </span>
          <ArrowRightIcon />
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <WeekStrip selected={date} activeDays={summary?.activeDays || []} onSelect={onSelectDate} />
      </div>

      <div style={{ marginTop: 16 }}>
        <InsightBanner insight={insight} onDismiss={onDismissInsight} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, margin: `20px ${T.gutter}px 0` }}>
        <SessionRing completed={session?.completedCount ?? 0} planned={session?.plannedCount ?? 0} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <StatLine label="TRAINING STYLE" value={session?.trainingStyle || "—"} />
          <StatLine
            label="VOLUME"
            value={session?.volume ? formatVolume(session.volume, session.unit) : "—"}
          />
          <StatLine label="DURATION" value={formatMinutes(session?.durationMinutes)} />
          <StatLine label="RPE" value={session?.rpe ?? "—"} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: `24px ${T.gutter}px 10px` }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Daily plan</h2>
        <button
          type="button"
          onClick={onAddExercise}
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 20,
            background: T.raised, color: T.text, fontSize: 12.5, fontWeight: 600,
            border: "none", cursor: "pointer", flexShrink: 0,
          }}
        >
          <PlusIcon />
          Add exercise
        </button>
      </div>

      <PlanList
        items={plan}
        onToggle={onTogglePlanItem}
        onLog={onLogPlanItem}
        onRemove={onRemovePlanItem}
        emptyLabel="No exercises planned. Add one above, or open the Exercise Advisor for suggestions."
      />

      {plan.length > 0 && (
        <div style={{ margin: `18px ${T.gutter}px 0` }}>
          <button
            type="button"
            onClick={onCompleteAll}
            disabled={allDone}
            style={{
              width: "100%", padding: 14, borderRadius: 20, background: "#fff", color: "#000",
              fontSize: 15, fontWeight: 700, border: "none", cursor: allDone ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: allDone ? 0.45 : 1,
            }}
          >
            <CircleCheckIcon />
            {allDone ? "All done" : "Mark Complete"}
          </button>
        </div>
      )}
    </>
  );
}
