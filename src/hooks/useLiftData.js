import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { monthOf } from "../lib/dates.js";

// Everything the Home and Training screens need for one selected date, plus
// the write actions that touch it. The server is the source of truth, so each
// mutation re-reads the slices it can affect rather than patching local state
// — the rules engine and the calorie totals are derived server-side.
export function useLiftData(date) {
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState([]);
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [advisorQueue, setAdvisorQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const month = monthOf(date);

  const load = useCallback(async () => {
    try {
      const [p, pl, s, sum, ins, adv] = await Promise.all([
        api.getProfile(),
        api.getPlan(date),
        api.getSession(date),
        api.getSummary(month),
        api.getInsights(date),
        api.getAdvisorQueue(date),
      ]);
      setProfile(p);
      setPlan(pl);
      setSession(s);
      setSummary(sum);
      setInsights(ins);
      setAdvisorQueue(adv);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date, month]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshDerived = useCallback(async () => {
    const [s, sum, ins] = await Promise.all([
      api.getSession(date),
      api.getSummary(month),
      api.getInsights(date),
    ]);
    setSession(s);
    setSummary(sum);
    setInsights(ins);
  }, [date, month]);

  const togglePlanItem = useCallback(async (item) => {
    const updated = await api.setPlanItemCompleted(item.id, !item.completed);
    setPlan((current) => current.map((i) => (i.id === updated.id ? updated : i)));
    await refreshDerived();
  }, [refreshDerived]);

  const completeAll = useCallback(async () => {
    setPlan(await api.completeAllPlanItems(date));
    await refreshDerived();
  }, [date, refreshDerived]);

  // Adding straight from the catalog, rather than through the Advisor deck.
  // Refreshes the advisor queue too, so a lift you just planned stops being
  // offered as a suggestion.
  const addPlanItem = useCallback(async (item) => {
    const created = await api.addPlanItem({ ...item, date });
    setPlan((current) => [...current, created]);
    setAdvisorQueue(await api.getAdvisorQueue(date));
    await refreshDerived();
    return created;
  }, [date, refreshDerived]);

  const removePlanItem = useCallback(async (item) => {
    await api.deletePlanItem(item.id);
    setPlan((current) => current.filter((i) => i.id !== item.id));
    setAdvisorQueue(await api.getAdvisorQueue(date));
    await refreshDerived();
  }, [date, refreshDerived]);

  // Logging a set is also what checks the plan item off — one action, not two.
  const logSet = useCallback(async (set, planItem) => {
    await api.addSet(set);
    if (planItem && !planItem.completed) {
      const updated = await api.setPlanItemCompleted(planItem.id, true);
      setPlan((current) => current.map((i) => (i.id === updated.id ? updated : i)));
    }
    await refreshDerived();
  }, [refreshDerived]);

  const reviewAdvisorCard = useCallback(async (exercise, accepted) => {
    setAdvisorQueue((current) => current.filter((e) => e.id !== exercise.id));
    const { planItem } = await api.reviewAdvisorCard(exercise.id, accepted, date);
    if (planItem) setPlan((current) => [...current, planItem]);
  }, [date]);

  const dismissInsight = useCallback(async (id) => {
    setInsights((current) => current.filter((i) => i.id !== id));
    await api.dismissInsight(id, date);
  }, [date]);

  const updateProfile = useCallback(async (patch) => {
    const updated = await api.updateProfile(patch);
    setProfile(updated);
    setInsights(await api.getInsights(date));
  }, [date]);

  return {
    profile, plan, session, summary, insights, advisorQueue,
    loading, error,
    togglePlanItem, completeAll, addPlanItem, removePlanItem, logSet,
    reviewAdvisorCard, dismissInsight, updateProfile, reload: load,
  };
}
