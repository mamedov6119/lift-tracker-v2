// ---------- tabs ----------
import {epley1RM, todayISO} from "../lib/rules.js";
import {Card} from "../components/ui/Card.jsx";
import T from "../theme.js";
import {WeeklyRhythm} from "../components/WeeklyRhythm.jsx";
import {IconCircle} from "../components/ui/IconCircle.jsx";
import {ChevronRight, Dumbbell, Flame, TrendingUp, Trophy} from "lucide-react";
import {InsightCard} from "../components/InsightCard.jsx";
import React from "react";

export function DashboardTab({sets, insights, onDismiss, onNavigate}) {
    const dateSet = new Set(sets.map((s) => s.date));
    let streak = 0, cursor = todayISO();
    while (dateSet.has(cursor)) {
        streak += 1;
        const d = new Date(cursor);
        d.setDate(d.getDate() - 1);
        cursor = d.toISOString().slice(0, 10);
    }
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekVol = sets.filter((s) => new Date(s.date) >= weekAgo).reduce((a, s) => a + s.weight * s.reps, 0);

    const prByExercise = {};
    sets.forEach((s) => {
        const e1 = epley1RM(s.weight, s.reps);
        if (!prByExercise[s.exercise] || e1 > prByExercise[s.exercise]) prByExercise[s.exercise] = e1;
    });
    const topPR = Object.entries(prByExercise).sort((a, b) => b[1] - a[1])[0];

    return (
        <div style={{display: "flex", flexDirection: "column", gap: 14}}>
            <Card>
                <p style={{margin: "0 0 12px", fontSize: 13, color: T.textSecondary, fontWeight: 500}}>This week</p>
                <WeeklyRhythm sets={sets}/>
            </Card>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                <Card style={{display: "flex", alignItems: "center", gap: 10}}>
                    <IconCircle tone="amber"><Flame size={18}/></IconCircle>
                    <div>
                        <p style={{
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 700,
                            color: T.textPrimary,
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>{streak}</p>
                        <p style={{margin: 0, fontSize: 12, color: T.textSecondary}}>day streak</p>
                    </div>
                </Card>
                <Card style={{display: "flex", alignItems: "center", gap: 10}}>
                    <IconCircle tone="teal"><TrendingUp size={18}/></IconCircle>
                    <div>
                        <p style={{
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 700,
                            color: T.textPrimary,
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>{thisWeekVol.toLocaleString()}</p>
                        <p style={{margin: 0, fontSize: 12, color: T.textSecondary}}>kg volume</p>
                    </div>
                </Card>
            </div>

            {topPR && (
                <Card style={{display: "flex", alignItems: "center", gap: 12}}>
                    <IconCircle tone="amber"><Trophy size={18}/></IconCircle>
                    <div>
                        <p style={{margin: 0, fontSize: 13, color: T.textSecondary}}>Best estimated 1RM</p>
                        <p style={{margin: "2px 0 0", fontSize: 15, fontWeight: 500, color: T.textPrimary}}>
                            {topPR[0]} — <span style={{fontFamily: "'JetBrains Mono', monospace"}}>{topPR[1]}kg</span>
                        </p>
                    </div>
                </Card>
            )}

            {insights.length > 0 && (
                <div>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        margin: "4px 0 10px"
                    }}>
                        <p style={{margin: 0, fontSize: 13, color: T.textSecondary, fontWeight: 500}}>Insights</p>
                        <button
                            onClick={() => onNavigate("insights")}
                            style={{
                                background: "none",
                                border: "none",
                                color: T.tealLight,
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                cursor: "pointer"
                            }}
                        >
                            View all <ChevronRight size={14}/>
                        </button>
                    </div>
                    <InsightCard insight={insights[0]} onDismiss={onDismiss}/>
                </div>
            )}

            {sets.length === 0 && (
                <Card style={{textAlign: "center", padding: 28}}>
                    <Dumbbell size={28} color={T.textMuted} style={{marginBottom: 10}}/>
                    <p style={{margin: 0, color: T.textSecondary, fontSize: 14}}>No sets logged yet.</p>
                    <p style={{margin: "4px 0 0", color: T.textMuted, fontSize: 13}}>Log your first set to see your
                        rhythm build up here.</p>
                </Card>
            )}
        </div>
    );
}