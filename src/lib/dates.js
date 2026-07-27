// Calendar maths for the Home month grid and the Training week strip.
// Everything is done on local dates so "today" matches the lifter's clock.

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toISO(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function fromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, days) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function todayISO() {
  return toISO(new Date());
}

export function monthOf(iso) {
  return iso.slice(0, 7);
}

export function formatLong(iso) {
  return fromISO(iso).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

// Month + day only. Kept separate rather than stripping the weekday off
// formatLong with a regex, which breaks in any non-Latin locale.
export function formatShort(iso) {
  return fromISO(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatMonthRange(month) {
  const start = fromISO(`${month}-01`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

// Six-week grid starting on Monday, with leading/trailing days from the
// neighbouring months dimmed — matches the design's calendar.
export function buildMonthGrid(month) {
  const first = fromISO(`${month}-01`);
  const lead = (first.getDay() + 6) % 7;
  const cells = [];
  const cursor = new Date(first);
  cursor.setDate(cursor.getDate() - lead);
  const weeks = Math.ceil((lead + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7);
  for (let i = 0; i < weeks * 7; i++) {
    const iso = toISO(cursor);
    cells.push({ iso, day: cursor.getDate(), outside: monthOf(iso) !== month });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

// Monday-anchored week containing `iso`.
export function buildWeek(iso) {
  const monday = addDays(iso, -((fromISO(iso).getDay() + 6) % 7));
  return WEEKDAYS.map((label, i) => {
    const dayISO = addDays(monday, i);
    return { iso: dayISO, label, day: fromISO(dayISO).getDate() };
  });
}
