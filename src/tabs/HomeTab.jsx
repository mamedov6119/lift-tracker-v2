import T from "../theme.js";
import ScreenHeader from "../components/ui/ScreenHeader.jsx";
import InsightBanner from "../components/InsightBanner.jsx";
import MonthCalendar from "../components/MonthCalendar.jsx";
import PlanList from "../components/PlanList.jsx";
import StatCard from "../components/StatCard.jsx";
import { CheckCircleIcon, WeightIcon } from "../components/icons.jsx";
import { formatLong, formatMonthRange, formatShort, monthOf } from "../lib/dates.js";
import { formatVolume } from "../lib/format.js";

export default function HomeTab({ date, onSelectDate, summary, plan, unit, insight, onDismissInsight, onTogglePlanItem, onLogPlanItem, onRemovePlanItem }) {
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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: `20px ${T.gutter}px 10px` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>{formatMonthRange(month)}</div>
      </div>

      <MonthCalendar
        month={month}
        selected={date}
        activeDays={summary?.activeDays || []}
        onSelect={onSelectDate}
      />

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: `22px ${T.gutter}px 10px` }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>
          Daily plan: {formatShort(date)}
        </h2>
      </div>

      <PlanList
        items={plan}
        onToggle={onTogglePlanItem}
        onLog={onLogPlanItem}
        onRemove={onRemovePlanItem}
        emptyLabel="Nothing planned for this day. Add something from the Exercise Advisor on the Training tab."
      />
    </>
  );
}
