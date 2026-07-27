// Thin fetch wrapper around the Express API. In dev, Vite proxies /api to
// localhost:3001 (see vite.config.js); in production the same server serves
// both, so the relative base works either way.
const BASE = "/api";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `${method} ${path} failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

const qs = (params) => {
  const search = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v != null && v !== "")
  ).toString();
  return search ? `?${search}` : "";
};

export const api = {
  getProfile: () => request("/profile"),
  updateProfile: (patch) => request("/profile", { method: "PATCH", body: patch }),

  getExercises: () => request("/exercises"),
  createExercise: (exercise) => request("/exercises", { method: "POST", body: exercise }),

  getPlan: (date) => request(`/plan${qs({ date })}`),
  addPlanItem: (item) => request("/plan", { method: "POST", body: item }),
  setPlanItemCompleted: (id, completed) => request(`/plan/${id}`, { method: "PATCH", body: { completed } }),
  deletePlanItem: (id) => request(`/plan/${id}`, { method: "DELETE" }),
  completeAllPlanItems: (date) => request("/plan/complete-all", { method: "POST", body: { date } }),

  getSets: (params) => request(`/sets${qs(params)}`),
  addSet: (set) => request("/sets", { method: "POST", body: set }),
  deleteSet: (id) => request(`/sets/${id}`, { method: "DELETE" }),

  getSummary: (month) => request(`/summary${qs({ month })}`),
  getSession: (date) => request(`/session${qs({ date })}`),
  getTrackedExercises: () => request("/progress"),
  getProgress: (exerciseId) => request(`/progress/${exerciseId}`),

  getInsights: (date) => request(`/insights${qs({ date })}`),
  dismissInsight: (id, date) => request(`/insights/${id}/dismiss`, { method: "POST", body: { date } }),

  resetData: () => request("/data", { method: "DELETE" }),

  getAdvisorQueue: (date) => request(`/advisor${qs({ date })}`),
  reviewAdvisorCard: (exerciseId, accepted, date) =>
    request("/advisor", { method: "POST", body: { exerciseId, accepted, date } }),
};
