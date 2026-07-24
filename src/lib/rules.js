// ---------- rules engine ----------
// Each rule reads from logged data only. Nothing here prescribes; everything
// observes a pattern and offers an opt-out nudge, per the "observational not
// prescriptive" design principle.

export function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export function epley1RM(weight, reps) {
    return Math.round(weight * (1 + reps / 30));
}
export function evaluateRules(sets, insightLog) {
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