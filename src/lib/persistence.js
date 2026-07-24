// ---------- storage helpers ----------
export async function loadJSON(key, fallback) {
    try {
        const res = await window.storage.get(key, false);
        return res ? JSON.parse(res.value) : fallback;
    } catch {
        return fallback;
    }
}

export async function saveJSON(key, value) {
    try {
        await window.storage.set(key, JSON.stringify(value), false);
    } catch {
        // best-effort; UI already reflects the change in local state
    }
}