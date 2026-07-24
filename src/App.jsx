import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Loader2} from "lucide-react";
import T from "./theme.js";
import {evaluateRules, todayISO} from "./lib/rules.js";
import {loadJSON, saveJSON} from "./lib/persistence.js";
import {DashboardTab} from "./tabs/DashboardTab.jsx";
import {LogTab} from "./tabs/LogTab.jsx";
import {InsightsTab} from "./tabs/InsightsTab.jsx";
import {SettingsTab} from "./tabs/SettingsTab.jsx";
import {useWorkouts} from "./hooks/useWorkouts.js";
import {useInsights} from "./hooks/useInsights.js";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import {NAV_ITEMS} from "./components/NavItems.js";

// ---------- root ----------
export default function LiftTracker() {
  const [tab, setTab] = useState("dashboard");
  const {sets, setSets, loading, setLoading, addSet, deleteSet} = useWorkouts();
  const {
    muted,
    setMuted,
    dismissed,
    setDismissed,
    toggleMute,
    insightLog,
    setInsightLog,
    dismissInsight,
  } = useInsights();

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

  const resetData = useCallback(() => {
    setSets([]);
    setInsightLog({});
    setDismissed({});
    saveJSON("workouts", []);
    saveJSON("app-state", { muted, insightLog: {} });
  }, [muted]);

  return (
    <div style={{
      background: T.bg, height: "100dvh", maxHeight: 844, borderRadius: 20, overflow: "hidden",
      fontFamily: "'Manrope', sans-serif", display: "flex", flexDirection: "column",
      width: "100%", maxWidth: 420, margin: "0 auto", border: `1px solid ${T.border}`,
    }}>
      <Header/>

      <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 10 }}>
            <Loader2 size={22} color={T.textMuted} className="spin" />
            <p style={{ color: T.textMuted, fontSize: 13 }}>Loading your data…</p>
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

      <BottomNav
          nav={NAV_ITEMS.map(n => n.id === "insights" ? { ...n, badge: insights.length } : n)}
          activeTab={tab}
          onChange={setTab}
      />
    </div>
  );
}
