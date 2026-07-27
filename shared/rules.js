// ---------- rules engine ----------
// Shared by the browser bundle and the Express server, so an insight rendered
// in the UI and one computed server-side can never drift apart.
//
// Each rule reads from logged data only. Nothing here prescribes; everything
// observes a pattern and offers an opt-out nudge, per the "observational not
// prescriptive" design principle.
//
// Every insight carries a `surface` ("home" | "training" | "progress") — the
// design shows a single collapsible TODAY'S INSIGHT banner per screen, so the
// UI picks the highest-priority insight for whichever surface it's on.

export function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export function epley1RM(weight, reps) {
    return Math.round(weight * (1 + reps / 30));
}

export function shiftISO(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

// Training volume for one set — weight moved. Bodyweight and timed work
// contributes 0, which is correct: this metric only compares loaded lifting
// against itself.
export function setVolume(s) {
    return (s.weight || 0) * (s.reps || 0);
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
                surface: "home",
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
        cursor = shiftISO(cursor, -1);
    }
    if (streak >= 3 && !alreadyShownToday("streak")) {
        results.push({
            id: "streak",
            surface: "home",
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
        const recentRpe = avgRpe(recent);
        const priorRpe = avgRpe(prior);
        const recentVol = volume(recent);
        const priorVol = volume(prior);
        if (recentRpe && priorRpe && recentRpe - priorRpe >= 0.75 && recentVol >= priorVol * 0.95) {
            results.push({
                id: "effort_reassurance",
                surface: "home",
                tone: "gentle",
                icon: "sparkles",
                title: "Training's felt harder lately",
                body: "Your effort ratings are up, but your volume hasn't dropped. That's a documented phase, not a sign you're regressing.",
                citation: "Perceived difficulty rising while output holds steady is a known, temporary pattern.",
            });
        }
    }

    // Rule 4: volume dip vs the trailing week (home surface)
    const yesterday = shiftISO(today, -1);
    if (dateSet.has(yesterday) && !alreadyShownToday("volume_dip")) {
        const window = byDate.filter((d) => d < yesterday && daysBetween(d, yesterday) <= 7);
        if (window.length >= 3) {
            const dayVolume = (d) => sets.filter((s) => s.date === d).reduce((sum, s) => sum + setVolume(s), 0);
            const avg = window.reduce((sum, d) => sum + dayVolume(d), 0) / window.length;
            const pct = avg > 0 ? Math.round(((avg - dayVolume(yesterday)) / avg) * 100) : 0;
            if (pct >= 12) {
                results.push({
                    id: "volume_dip",
                    surface: "home",
                    tone: "gentle",
                    icon: "flame",
                    title: `Yesterday's training volume was ${pct}% below your weekly average`,
                    body: "One lighter day is noise, not a trend. Showing up today is what keeps it that way.",
                    citation: "Single-session dips predict very little; the weekly rolling average is the signal.",
                });
            }
        }
    }

    // Rule 5: sustained high effort (training surface). Purely observational —
    // it reports what the RPE column says and leaves the call to the lifter.
    if (sessions.length >= 3 && !alreadyShownToday("high_effort")) {
        const recentRpe = avgRpe(sessions.slice(-3));
        if (recentRpe && recentRpe >= 8.75) {
            results.push({
                id: "high_effort",
                surface: "training",
                tone: "gentle",
                icon: "sparkles",
                title: `Your last three sessions averaged RPE ${recentRpe.toFixed(1)}`,
                body: "That's sustained near-maximal effort. Lifters who back the load off ~10% for a session at this point usually come back stronger than those who push through.",
                citation: "Extended training near RPE 9+ raises fatigue faster than it raises adaptation.",
            });
        }
    }

    // Rule 6: divergence between lifts (progress surface) — one lift climbing
    // while another sits flat is the single most actionable pattern in the data
    if (!alreadyShownToday("lift_divergence")) {
        const trends = exerciseTrends(sets);
        const climbing = trends.filter((t) => t.pct >= 8).sort((a, b) => b.pct - a.pct)[0];
        const flat = trends.filter((t) => t.pct < 2 && t.name !== climbing?.name).sort((a, b) => a.pct - b.pct)[0];
        if (climbing && flat) {
            results.push({
                id: "lift_divergence",
                surface: "progress",
                tone: "gentle",
                icon: "sparkles",
                title: `${climbing.name} is up ${climbing.pct}% while ${flat.name} has held flat`,
                body: "Uneven progress across lifts is normal. Adding a set of volume to the flat lift tends to move it sooner than adding weight does.",
                citation: "Stalled lifts respond to accumulated volume more reliably than to load increases.",
            });
        }
    }

    return results;
}

// Highest-priority insight for a given screen, or null. Positive tones win
// ties so a good week never gets buried under a nudge.
export function insightForSurface(insights, surface) {
    const scoped = insights.filter((i) => i.surface === surface);
    if (scoped.length === 0) return null;
    return scoped.sort((a, b) => (b.tone === "positive") - (a.tone === "positive"))[0];
}

// ---------- internals ----------
function avgRpe(group) {
    const vals = group.flat().map((s) => s.rpe).filter(Boolean);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function volume(group) {
    return group.flat().reduce((sum, s) => sum + s.weight * s.reps, 0);
}

// Per-exercise estimated-1RM trend: first vs last session, only for lifts with
// enough history that the comparison means something.
function exerciseTrends(sets) {
    const byExercise = new Map();
    sets.forEach((s) => {
        const key = s.exerciseName || s.exercise;
        if (!key) return;
        if (!byExercise.has(key)) byExercise.set(key, new Map());
        const days = byExercise.get(key);
        const best = Math.max(days.get(s.date) || 0, epley1RM(s.weight, s.reps));
        days.set(s.date, best);
    });

    const trends = [];
    byExercise.forEach((days, name) => {
        const points = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
        if (points.length < 4 || !points[0]) return;
        trends.push({ name, pct: Math.round(((points[points.length - 1] - points[0]) / points[0]) * 100) });
    });
    return trends;
}
