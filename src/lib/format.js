// Display formatting for the three ways an exercise can be measured.

// 45 → "45s", 65 → "1:05", 3600 → "60:00"
export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  return `${mins}:${String(total % 60).padStart(2, "0")}`;
}

// One progress-chart value, rendered in its own unit. `unit` is the weight
// unit ("lb"/"kg") for weight-metric exercises and ignored otherwise.
export function formatMetricValue(value, metric, unit = "lb") {
  if (metric === "time") return formatDuration(value);
  if (metric === "reps") return `${value} reps`;
  return `${Math.round(value).toLocaleString()} ${unit}`;
}

// Split form, for layouts that style the unit differently from the number.
export function splitMetricValue(value, metric, unit = "lb") {
  if (metric === "time") return { value: formatDuration(value), unit: "" };
  if (metric === "reps") return { value: String(value), unit: " reps" };
  return { value: Math.round(value).toLocaleString(), unit: ` ${unit}` };
}

// Total weight moved. Compact above 10k so it still fits a stat tile.
export function formatVolume(volume, unit = "lb") {
  const total = Math.round(volume || 0);
  if (total >= 10000) return `${(total / 1000).toFixed(1)}k ${unit}`;
  return `${total.toLocaleString()} ${unit}`;
}

export function formatMinutes(minutes) {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60} min` : `${minutes} min`;
}
