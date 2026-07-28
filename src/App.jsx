import { useCallback, useMemo, useState } from "react";
import T from "./theme.js";
import { api } from "./lib/api.js";
import { todayISO } from "./lib/dates.js";
import { insightForSurface } from "./lib/rules.js";
import { useLiftData } from "./hooks/useLiftData.js";
import BottomNav from "./components/BottomNav.jsx";
import LogSetSheet from "./components/LogSetSheet.jsx";
import AddExerciseSheet from "./components/AddExerciseSheet.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import { useAuth } from "./hooks/useAuth.js";
import HomeTab from "./tabs/HomeTab.jsx";
import TrainingTab from "./tabs/TrainingTab.jsx";
import ProgressTab from "./tabs/ProgressTab.jsx";
import AccountTab from "./tabs/AccountTab.jsx";

export default function LiftTracker() {
  const [tab, setTab] = useState("home");
  const [date, setDate] = useState(todayISO);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [logging, setLogging] = useState(null);
  const [adding, setAdding] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  const { user, checking, login, signup, logout, onSessionLost } = useAuth();
  // Keyed on the account id so switching users tears the whole tree down
  // rather than briefly showing the previous account's data.
  const data = useLiftData(date, user?.id, onSessionLost);
  const {
    profile, plan, session, summary, insights, advisorQueue,
    loading, error, togglePlanItem, completeAll, addPlanItem, removePlanItem,
    logSet, reviewAdvisorCard, dismissInsight, updateProfile, reload,
  } = data;

  const signOut = useCallback(async () => {
    await logout();
    setTab("home");
    setSplashDone(true);
  }, [logout]);

  // One banner per screen, picked from the same server-evaluated rule set.
  const bySurface = useMemo(() => ({
    home: insightForSurface(insights, "home"),
    training: insightForSurface(insights, "training"),
    progress: insightForSurface(insights, "progress"),
  }), [insights]);

  const selectDate = useCallback((next) => {
    setDate(next);
    setAdvisorOpen(false);
  }, []);

  const changeTab = useCallback((next) => {
    setTab(next);
    setAdvisorOpen(false);
  }, []);

  const submitSet = useCallback(async (set) => {
    await logSet(set, logging);
    setLogging(null);
  }, [logSet, logging]);

  const resetAll = useCallback(async () => {
    await api.resetData();
    setDate(todayISO());
    await reload();
  }, [reload]);

  // The splash covers the session check, so there's no flash of the sign-in
  // screen for someone who is already signed in.
  if (!user) {
    return (
      <>
        {!checking && <AuthScreen onLogin={login} onSignup={signup} />}
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </>
    );
  }

  return (
    <div style={shell}>
      <div style={column}>
        <main data-scroll style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", paddingBottom: 8 }}>
          {loading ? (
            <div style={centered}>
              <div style={spinner} className="spin" />
              <p style={{ color: T.textSecondary, fontSize: 13 }}>Loading your data…</p>
            </div>
          ) : error ? (
            <div style={centered}>
              <p style={{ color: T.accent, fontSize: 14, fontWeight: 600, margin: 0 }}>Can't reach the server</p>
              <p style={{ color: T.textSecondary, fontSize: 13, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
                {error}
                <br />
                Start it with <code style={code}>npm run server</code>.
              </p>
              <button type="button" onClick={reload} style={retryBtn}>Retry</button>
            </div>
          ) : (
            <>
              {tab === "home" && (
                <HomeTab
                  date={date}
                  onSelectDate={selectDate}
                  summary={summary}
                  plan={plan}
                  unit={profile?.unit}
                  insight={bySurface.home}
                  onDismissInsight={dismissInsight}
                  onTogglePlanItem={togglePlanItem}
                  onLogPlanItem={setLogging}
                  onRemovePlanItem={removePlanItem}
                  onAddExercise={() => setAdding(true)}
                />
              )}
              {tab === "training" && (
                <TrainingTab
                  date={date}
                  onSelectDate={selectDate}
                  summary={summary}
                  session={session}
                  plan={plan}
                  insight={bySurface.training}
                  onDismissInsight={dismissInsight}
                  onTogglePlanItem={togglePlanItem}
                  onLogPlanItem={setLogging}
                  onRemovePlanItem={removePlanItem}
                  onCompleteAll={completeAll}
                  onAddExercise={() => setAdding(true)}
                  advisorOpen={advisorOpen}
                  onOpenAdvisor={() => setAdvisorOpen(true)}
                  onCloseAdvisor={() => setAdvisorOpen(false)}
                  advisorQueue={advisorQueue}
                  onReviewCard={reviewAdvisorCard}
                />
              )}
              {tab === "progress" && (
                <ProgressTab insight={bySurface.progress} onDismissInsight={dismissInsight} />
              )}
              {tab === "account" && (
                <AccountTab
                  profile={profile}
                  summary={summary}
                  onUpdateProfile={updateProfile}
                  onReset={resetAll}
                  account={user}
                  onSignOut={signOut}
                />
              )}
            </>
          )}
        </main>

        <BottomNav active={tab} onChange={changeTab} />
      </div>

      {logging && (
        <LogSetSheet
          exercise={logging}
          date={date}
          unit={profile?.unit}
          onSubmit={submitSet}
          onClose={() => setLogging(null)}
        />
      )}

      {adding && (
        <AddExerciseSheet
          date={date}
          planExerciseIds={plan.map((i) => i.exerciseId)}
          onAdd={addPlanItem}
          onClose={() => setAdding(false)}
        />
      )}

      {/* Sits over a fully-mounted app, so the 3.1s lift doubles as cover for
          the first data fetch instead of adding time on top of it. */}
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
    </div>
  );
}

// The design is a phone mock; on the web that becomes a centred column that
// goes full-bleed on small screens and stays readable on a desktop monitor.
const shell = {
  minHeight: "100dvh", background: T.bg, display: "flex", justifyContent: "center",
};
const column = {
  width: "100%", maxWidth: 480, minHeight: "100dvh", maxHeight: "100dvh",
  display: "flex", flexDirection: "column", background: T.bg, color: T.text,
  fontFamily: T.font, overflow: "hidden",
};
const centered = {
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: 12, padding: 32,
};
const spinner = {
  width: 22, height: 22, borderRadius: "50%",
  border: `2px solid ${T.raised}`, borderTopColor: T.accent,
};
const code = {
  background: T.card, padding: "2px 6px", borderRadius: 6, fontSize: 12,
};
const retryBtn = {
  marginTop: 4, padding: "10px 20px", borderRadius: 20, background: "#fff",
  color: "#000", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
};
