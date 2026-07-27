import T from "../theme.js";
import ScreenHeader from "../components/ui/ScreenHeader.jsx";
import InsightBanner from "../components/InsightBanner.jsx";
import MonthCalendar from "../components/MonthCalendar.jsx";
import PlanList from "../components/PlanList.jsx";
import StatCard from "../components/StatCard.jsx";
import { CheckCircleIcon, ChevronRightIcon, PlusIcon, WeightIcon } from "../components/icons.jsx";
import { formatLong, formatMonthRange, formatShort, monthOf, shiftMonth } from "../lib/dates.js";
import { formatVolume } from "../lib/format.js";

// Month paging. Without these the only way to reach another month is tapping a
// dimmed adjacent-month day, which nothing signals is possible.
function MonthStep({ label, onClick, rotate = 0 }) {
  return (
    <button
      type="button"
      className="pressable"
      onClick={onClick}
      aria-label={label}
      style={{
        width: T.tap, height: T.tap, borderRadius: 12, border: "none", background: "none",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}
    >
      <span style={{ display: "flex", transform: `rotate(${rotate}deg)` }}>
        <ChevronRightIcon color={T.textMuted} width={9} height={15} />
      </span>
    </button>
  );
}

export default function HomeTab({ date, onSelectDate, summary, plan, unit, insight, onDismissInsight, onTogglePlanItem, onLogPlanItem, onRemovePlanItem, onAddExercise }) {
  const month = monthOf(date);

  return (
    <>
      <ScreenHeader title="Home" subtitle={formatLong(date)} />

      <div style={{ marginTop: 14 }}>
        <InsightBanner insight={insight} onDismiss={onDismissInsight} sunken />
      </div>

      <div style={{ display: "flex", gap: 12, margin: `14px ${T.gutter}px 0` }}>
        <StatCard
          icon={<WeightIcon />}
          label="Volume lifted"
          value={formatVolume(summary?.totalVolume, unit)}
        />
        <StatCard
          icon={<CheckCircleIcon />}
          label="Days completed"
          value={`${summary?.daysCompleted ?? 0} days`}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: `20px ${T.gutter}px 4px` }}>
        <div className="tnum" style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: T.textMuted }}>
          {formatMonthRange(month)}
        </div>
        <div style={{ display: "flex", gap: 4, marginRight: -10 }}>
          <MonthStep label="Previous month" onClick={() => onSelectDate(shiftMonth(date, -1))} rotate={180} />
          <MonthStep label="Next month" onClick={() => onSelectDate(shiftMonth(date, 1))} />
        </div>
      </div>

      <MonthCalendar
        month={month}
        selected={date}
        activeDays={summary?.activeDays || []}
        onSelect={onSelectDate}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: `22px ${T.gutter}px 10px` }}>
        <h2 style={{ margin: 0, fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: T.text }}>
          Daily plan: {formatShort(date)}
        </h2>
        <button
          type="button"
          className="pressable"
          onClick={onAddExercise}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            minHeight: T.tap, padding: "0 16px", borderRadius: 20,
            background: T.raised, color: T.text, fontSize: 12.5, fontWeight: 600,
            border: "none", cursor: "pointer", flexShrink: 0,
          }}
        >
          <PlusIcon />
          Add
        </button>
      </div>

      <PlanList
        items={plan}
        onToggle={onTogglePlanItem}
        onLog={onLogPlanItem}
        onRemove={onRemovePlanItem}
        emptyLabel="Nothing planned for this day. Use Add to pick an exercise, or try the Exercise Advisor on the Training tab."
      />
    </>
  );
}
