import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dumbbell, Flame, TrendingUp, Bell, BellOff, Plus, X, Settings as SettingsIcon,
  Trophy, ChevronRight, Trash2, Home, ListChecks, Sparkles, Loader2,
} from "lucide-react";

// ---------- design tokens (Midnight Teal) ----------
const T = {
  bg: "#0B1420",
  surface: "#121F30",
  surface2: "#1A2A3E",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  teal: "#1D9E75",
  tealLight: "#5DCAA5",
  tealDim: "rgba(29,158,117,0.16)",
  amber: "#D89A3E",
  amberDim: "rgba(216,154,62,0.16)",
  textPrimary: "#E8ECF2",
  textSecondary: "#8FA0B3",
  textMuted: "#5C6B7D",
};

const EXERCISES = ["Squat", "Bench press", "Deadlift", "Overhead press", "Barbell row", "Pull-up"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function epley1RM(weight, reps) {
  return Math.round(weight * (1 + reps / 30));
}

// ---------- rules engine ----------
// Each rule reads from logged data only. Nothing here prescribes; everything
// observes a pattern and offers an opt-out nudge, per the "observational not
// prescriptive" design principle.
function evaluateRules(sets, insightLog) {
  const results = [];
  const today = todayISO();
  const byDate = [...new Set(sets.map((s) => s.date))].sort();
  const lastDate = byDate[byDate.length - 1];

  const alreadyShownToday = (ruleId) => insightLog[ruleId] === today;

  // Rule 1: early missed-session nudge (fires at day 2-3, not later —
  // the research point is catching it small, not scolding after a long gap)
  if (lastDate) {
    const gap = daysBetween(lastDate, today);
    if ((gap === 2 || gap === 3) && !alreadyShownToday("missed_session")) {
      results.push({
        id: "missed_session",
        tone: "gentle",
        icon: "flame",
        title: `${gap} days since your last session`,
        body: "Catching a short gap early tends to matter more than any single workout. A quick 20-minute session keeps the thread going.",
        citation: "People who respond quickly to small breaks are more likely to stay consistent long-term.",
      });
    }
  }

  // Rule 2: streak reinforcement (positive-only, never a countdown to failure)
  let streak = 0;
  let cursor = today;
  const dateSet = new Set(byDate);
  while (dateSet.has(cursor)) {
    streak += 1;
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  if (streak >= 3 && !alreadyShownToday("streak")) {
    results.push({
      id: "streak",
      tone: "positive",
      icon: "trophy",
      title: `${streak}-day logging streak`,
      body: "Consistency of logging is linked to better outcomes than precision of logging — showing up counts more than a perfect entry.",
      citation: "Logging consistency predicts adherence better than logging accuracy.",
    });
  }

  // Rule 3: effort-vs-progress reassurance (targets the self-efficacy dip
  // that tends to show up once training gets genuinely difficult)
  const sessions = byDate.map((d) => sets.filter((s) => s.date === d));
  if (sessions.length >= 6) {
    const recent = sessions.slice(-3);
    const prior = sessions.slice(-6, -3);
    const avgRpe = (group) => {
      const vals = group.flat().map((s) => s.rpe).filter(Boolean);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const vol = (group) => group.flat().reduce((sum, s) => sum + s.weight * s.reps, 0);
    const recentRpe = avgRpe(recent);
    const priorRpe = avgRpe(prior);
    const recentVol = vol(recent);
    const priorVol = vol(prior);
    if (recentRpe && priorRpe && recentRpe - priorRpe >= 0.75 && recentVol >= priorVol * 0.95) {
      results.push({
        id: "effort_reassurance",
        tone: "gentle",
        icon: "sparkles",
        title: "Training's felt harder lately",
        body: "Your effort ratings are up, but your volume hasn't dropped. That's a documented phase, not a sign you're regressing.",
        citation: "Perceived difficulty rising while output holds steady is a known, temporary pattern.",
      });
    }
  }

  return results;
}

// ---------- storage helpers ----------
async function loadJSON(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveJSON(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch {
    // best-effort; UI already reflects the change in local state
  }
}

// ---------- small UI atoms ----------
function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 16,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function IconCircle({ children, tone = "teal" }) {
  const bg = tone === "amber" ? T.amberDim : T.tealDim;
  const fg = tone === "amber" ? T.amber : T.tealLight;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 12, background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

const ICONS = { flame: Flame, trophy: Trophy, sparkles: Sparkles };

function InsightCard({ insight, onDismiss }) {
  const Icon = ICONS[insight.icon] || Sparkles;
  return (
    <Card style={{ display: "flex", gap: 12 }}>
      <IconCircle tone={insight.tone === "positive" ? "amber" : "teal"}>
        <Icon size={18} />
      </IconCircle>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: T.textPrimary }}>{insight.title}</p>
          <button
            onClick={() => onDismiss(insight.id)}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 2, flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: T.textSecondary }}>{insight.body}</p>
        <p style={{ margin: "8px 0 0", fontSize: 11, lineHeight: 1.5, color: T.textMuted, fontStyle: "italic" }}>
          {insight.citation}
        </p>
      </div>
    </Card>
  );
}

// ---------- weekly rhythm strip (signature element) ----------
function WeeklyRhythm({ sets }) {
  const dateSet = new Set(sets.map((s) => s.date));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ iso, logged: dateSet.has(iso), label: d.toLocaleDateString(undefined, { weekday: "narrow" }) });
  }
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
      {days.map((d) => (
        <div key={d.iso} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
          <div style={{
            width: "100%", aspectRatio: "1", maxWidth: 36, borderRadius: 10,
            background: d.logged ? T.teal : "transparent",
            border: d.logged ? "none" : `1.5px solid ${T.borderStrong}`,
          }} />
          <span style={{ fontSize: 11, color: T.textMuted }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- tabs ----------
function DashboardTab({ sets, insights, onDismiss, onNavigate }) {
  const dateSet = new Set(sets.map((s) => s.date));
  let streak = 0, cursor = todayISO();
  while (dateSet.has(cursor)) {
    streak += 1;
    const d = new Date(cursor); d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekVol = sets.filter((s) => new Date(s.date) >= weekAgo).reduce((a, s) => a + s.weight * s.reps, 0);

  const prByExercise = {};
  sets.forEach((s) => {
    const e1 = epley1RM(s.weight, s.reps);
    if (!prByExercise[s.exercise] || e1 > prByExercise[s.exercise]) prByExercise[s.exercise] = e1;
  });
  const topPR = Object.entries(prByExercise).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: T.textSecondary, fontWeight: 500 }}>This week</p>
        <WeeklyRhythm sets={sets} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconCircle tone="amber"><Flame size={18} /></IconCircle>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>{streak}</p>
            <p style={{ margin: 0, fontSize: 12, color: T.textSecondary }}>day streak</p>
          </div>
        </Card>
        <Card style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconCircle tone="teal"><TrendingUp size={18} /></IconCircle>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>{thisWeekVol.toLocaleString()}</p>
            <p style={{ margin: 0, fontSize: 12, color: T.textSecondary }}>kg volume</p>
          </div>
        </Card>
      </div>

      {topPR && (
        <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IconCircle tone="amber"><Trophy size={18} /></IconCircle>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: T.textSecondary }}>Best estimated 1RM</p>
            <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 500, color: T.textPrimary }}>
              {topPR[0]} — <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{topPR[1]}kg</span>
            </p>
          </div>
        </Card>
      )}

      {insights.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 10px" }}>
            <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, fontWeight: 500 }}>Insights</p>
            <button
              onClick={() => onNavigate("insights")}
              style={{ background: "none", border: "none", color: T.tealLight, fontSize: 12, display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <InsightCard insight={insights[0]} onDismiss={onDismiss} />
        </div>
      )}

      {sets.length === 0 && (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <Dumbbell size={28} color={T.textMuted} style={{ marginBottom: 10 }} />
          <p style={{ margin: 0, color: T.textSecondary, fontSize: 14 }}>No sets logged yet.</p>
          <p style={{ margin: "4px 0 0", color: T.textMuted, fontSize: 13 }}>Log your first set to see your rhythm build up here.</p>
        </Card>
      )}
    </div>
  );
}

function LogTab({ sets, onAdd, onDelete }) {
  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState(7);

  const todaysSets = sets.filter((s) => s.date === todayISO()).slice().reverse();

  const submit = () => {
    if (!weight || !reps) return;
    onAdd({
      id: crypto.randomUUID(),
      date: todayISO(),
      exercise,
      weight: Number(weight),
      reps: Number(reps),
      rpe: Number(rpe),
    });
    setWeight("");
    setReps("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 500, color: T.textSecondary }}>Log a set</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            style={inputStyle}
          >
            {EXERCISES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="number" inputMode="decimal" placeholder="Weight (kg)" value={weight}
              onChange={(e) => setWeight(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="number" inputMode="numeric" placeholder="Reps" value={reps}
              onChange={(e) => setReps(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: T.textSecondary }}>Effort (RPE)</label>
              <span style={{ fontSize: 12, color: T.tealLight, fontFamily: "'JetBrains Mono', monospace" }}>{rpe}</span>
            </div>
            <input type="range" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)}
              style={{ width: "100%", accentColor: T.teal }} />
          </div>
          <button onClick={submit} style={primaryBtn}>
            <Plus size={16} /> Add set
          </button>
        </div>
      </Card>

      <div>
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500, color: T.textSecondary }}>Today</p>
        {todaysSets.length === 0 ? (
          <p style={{ fontSize: 13, color: T.textMuted }}>Nothing logged yet today.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todaysSets.map((s) => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px",
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: T.textPrimary, fontWeight: 500 }}>{s.exercise}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.weight}kg × {s.reps} · RPE {s.rpe}
                  </p>
                </div>
                <button onClick={() => onDelete(s.id)} aria-label="Delete set"
                  style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InsightsTab({ insights, onDismiss, muted }) {
  if (muted) {
    return (
      <Card style={{ textAlign: "center", padding: 28 }}>
        <BellOff size={28} color={T.textMuted} style={{ marginBottom: 10 }} />
        <p style={{ margin: 0, color: T.textSecondary, fontSize: 14 }}>Nudges are muted.</p>
        <p style={{ margin: "4px 0 0", color: T.textMuted, fontSize: 13 }}>Turn them back on in Settings any time.</p>
      </Card>
    );
  }
  if (insights.length === 0) {
    return (
      <Card style={{ textAlign: "center", padding: 28 }}>
        <Sparkles size={28} color={T.textMuted} style={{ marginBottom: 10 }} />
        <p style={{ margin: 0, color: T.textSecondary, fontSize: 14 }}>Nothing to flag right now.</p>
        <p style={{ margin: "4px 0 0", color: T.textMuted, fontSize: 13 }}>Insights show up here when your logged data matches a known pattern.</p>
      </Card>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {insights.map((i) => <InsightCard key={i.id} insight={i} onDismiss={onDismiss} />)}
    </div>
  );
}

function SettingsTab({ muted, onToggleMute, onReset }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <IconCircle>{muted ? <BellOff size={18} /> : <Bell size={18} />}</IconCircle>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: T.textPrimary, fontWeight: 500 }}>Nudges</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSecondary }}>Research-based patterns from your own data</p>
          </div>
        </div>
        <Toggle checked={!muted} onChange={() => onToggleMute()} />
      </Card>

      <Card>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: T.textPrimary, fontWeight: 500 }}>About this prototype</p>
        <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>
          Data is stored locally to this app and never leaves your device. Insights are generated by a small rules
          engine that checks your logs against published behavior-change findings — nothing here is medical or
          coaching advice.
        </p>
      </Card>

      <button onClick={onReset} style={{ ...secondaryBtn, color: "#E58A8A" }}>
        Reset all data
      </button>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
        background: checked ? T.teal : T.surface2, position: "relative", flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 21 : 3, width: 20, height: 20,
        borderRadius: "50%", background: "#fff", transition: "left 0.15s",
      }} />
    </button>
  );
}

const inputStyle = {
  background: T.surface2,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: "10px 12px",
  color: T.textPrimary,
  fontSize: 14,
  outline: "none",
  fontFamily: "'Manrope', sans-serif",
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
};
const primaryBtn = {
  background: T.teal,
  color: "#04342C",
  border: "none",
  borderRadius: 10,
  padding: "11px 16px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontFamily: "'Manrope', sans-serif",
};
const secondaryBtn = {
  background: "transparent",
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: "11px 16px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  color: T.textSecondary,
  fontFamily: "'Manrope', sans-serif",
};

// ---------- root ----------
export default function LiftTracker() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [sets, setSets] = useState([]);
  const [muted, setMuted] = useState(false);
  const [insightLog, setInsightLog] = useState({});
  const [dismissed, setDismissed] = useState({});

  useEffect(() => {
    (async () => {
      const [storedSets, storedState] = await Promise.all([
        loadJSON("workouts", []),
        loadJSON("app-state", { muted: false, insightLog: {} }),
      ]);
      setSets(storedSets);
      setMuted(storedState.muted);
      setInsightLog(storedState.insightLog || {});
      setLoading(false);
    })();
  }, []);

  const insights = useMemo(() => {
    if (muted) return [];
    return evaluateRules(sets, insightLog).filter((i) => !dismissed[i.id + todayISO()]);
  }, [sets, insightLog, muted, dismissed]);

  // mark newly-surfaced insights as shown-today, so they don't re-fire
  // every render (mirrors the cooldown log the real cron job would keep)
  useEffect(() => {
    if (insights.length === 0) return;
    const next = { ...insightLog };
    let changed = false;
    insights.forEach((i) => {
      if (next[i.id] !== todayISO()) { next[i.id] = todayISO(); changed = true; }
    });
    if (changed) {
      setInsightLog(next);
      saveJSON("app-state", { muted, insightLog: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insights.length]);

  const addSet = useCallback((set) => {
    const next = [...sets, set];
    setSets(next);
    saveJSON("workouts", next);
  }, [sets]);

  const deleteSet = useCallback((id) => {
    const next = sets.filter((s) => s.id !== id);
    setSets(next);
    saveJSON("workouts", next);
  }, [sets]);

  const dismissInsight = useCallback((id) => {
    setDismissed((d) => ({ ...d, [id + todayISO()]: true }));
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    saveJSON("app-state", { muted: next, insightLog });
  }, [muted, insightLog]);

  const resetData = useCallback(() => {
    setSets([]);
    setInsightLog({});
    setDismissed({});
    saveJSON("workouts", []);
    saveJSON("app-state", { muted, insightLog: {} });
  }, [muted]);

  const NAV = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "log", label: "Log", icon: ListChecks },
    { id: "insights", label: "Insights", icon: Sparkles, badge: insights.length },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div style={{
      background: T.bg, minHeight: 480, borderRadius: 20, overflow: "hidden",
      fontFamily: "'Manrope', sans-serif", display: "flex", flexDirection: "column",
      maxWidth: 420, margin: "0 auto", border: `1px solid ${T.border}`,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        input::placeholder { color: ${T.textMuted}; }
        select option { background: ${T.surface2}; }
      `}</style>

      <div style={{ padding: "18px 18px 4px", display: "flex", alignItems: "center", gap: 10 }}>
        <IconCircle><Dumbbell size={18} /></IconCircle>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.textPrimary }}>Lift Tracker</p>
      </div>

      <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 10 }}>
            <Loader2 size={22} color={T.textMuted} className="spin" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ color: T.textMuted, fontSize: 13 }}>Loading your data…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab sets={sets} insights={insights} onDismiss={dismissInsight} onNavigate={setTab} />}
            {tab === "log" && <LogTab sets={sets} onAdd={addSet} onDelete={deleteSet} />}
            {tab === "insights" && <InsightsTab insights={insights} onDismiss={dismissInsight} muted={muted} />}
            {tab === "settings" && <SettingsTab muted={muted} onToggleMute={toggleMute} onReset={resetData} />}
          </>
        )}
      </div>

      <div style={{ display: "flex", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "10px 0 12px", position: "relative",
                color: active ? T.tealLight : T.textMuted,
              }}
            >
              <div style={{ position: "relative" }}>
                <Icon size={20} />
                {n.badge > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -8, background: T.amber, color: "#412402",
                    fontSize: 10, fontWeight: 700, borderRadius: 8, minWidth: 15, height: 15,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                  }}>{n.badge}</span>
                )}
              </div>
              <span style={{ fontSize: 11 }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
