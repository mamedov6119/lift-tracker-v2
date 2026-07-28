// Thin fetch wrapper around the Express API. In dev, Vite proxies /api to
// localhost:3001 (see vite.config.js); in production the same server serves
// both, so the relative base works either way.
const BASE = "/api";

// Raised on 401 so callers can tell "signed out" apart from a real failure.
export class UnauthorizedError extends Error {
  constructor(message = "not signed in") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    // The session lives in an httpOnly cookie; same-origin is the default but
    // being explicit documents that every call is authenticated this way.
    credentials: "same-origin",
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    if (res.status === 401) throw new UnauthorizedError(detail.error);
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
  signup: (credentials) => request("/auth/signup", { method: "POST", body: credentials }),
  login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    request("/auth/password", { method: "POST", body: { currentPassword, newPassword } }),

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
