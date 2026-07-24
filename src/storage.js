// Drop-in replacement for the Claude-artifact-only `window.storage` API.
// Same method shapes (get/set/delete/list), backed by real localStorage,
// so App.jsx didn't need to change at all to go from prototype to deployed app.
const PREFIX = "lift-tracker:";

function read(key) {
  const raw = localStorage.getItem(PREFIX + key);
  if (raw === null) return null;
  return { key, value: raw, shared: false };
}

export const storage = {
  async get(key) {
    return read(key);
  },
  async set(key, value) {
    localStorage.setItem(PREFIX + key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    const existed = localStorage.getItem(PREFIX + key) !== null;
    localStorage.removeItem(PREFIX + key);
    return { key, deleted: existed, shared: false };
  },
  async list(prefix = "") {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX + prefix))
      .map((k) => k.slice(PREFIX.length));
    return { keys, prefix, shared: false };
  },
};

if (typeof window !== "undefined" && !window.storage) {
  window.storage = storage;
}
