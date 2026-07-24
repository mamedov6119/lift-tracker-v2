import React, {useState} from "react";
import {todayISO} from "../lib/rules.js";
import {Card} from "../components/ui/Card.jsx";
import T from "../theme.js";
import {inputStyle, primaryBtn} from "../styles/shared.js";
import {Plus, Trash2} from "lucide-react";

const EXERCISES = ["Squat", "Bench press", "Deadlift", "Overhead press", "Barbell row", "Pull-up"];

export function LogTab({sets, onAdd, onDelete}) {
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
        <div style={{display: "flex", flexDirection: "column", gap: 14}}>
            <Card>
                <p style={{margin: "0 0 12px", fontSize: 13, fontWeight: 500, color: T.textSecondary}}>Log a set</p>
                <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                    <select
                        value={exercise}
                        onChange={(e) => setExercise(e.target.value)}
                        style={inputStyle}
                    >
                        {EXERCISES.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <div style={{display: "flex", gap: 10}}>
                        <input type="number" inputMode="decimal" placeholder="Weight (kg)" value={weight}
                               onChange={(e) => setWeight(e.target.value)} style={{...inputStyle, flex: 1}}/>
                        <input type="number" inputMode="numeric" placeholder="Reps" value={reps}
                               onChange={(e) => setReps(e.target.value)} style={{...inputStyle, flex: 1}}/>
                    </div>
                    <div>
                        <div style={{display: "flex", justifyContent: "space-between", marginBottom: 6}}>
                            <label style={{fontSize: 12, color: T.textSecondary}}>Effort (RPE)</label>
                            <span style={{
                                fontSize: 12,
                                color: T.tealLight,
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>{rpe}</span>
                        </div>
                        <input type="range" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)}
                               style={{width: "100%", accentColor: T.teal}}/>
                    </div>
                    <button onClick={submit} style={primaryBtn}>
                        <Plus size={16}/> Add set
                    </button>
                </div>
            </Card>

            <div>
                <p style={{margin: "0 0 10px", fontSize: 13, fontWeight: 500, color: T.textSecondary}}>Today</p>
                {todaysSets.length === 0 ? (
                    <p style={{fontSize: 13, color: T.textMuted}}>Nothing logged yet today.</p>
                ) : (
                    <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                        {todaysSets.map((s) => (
                            <div key={s.id} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                borderRadius: 12,
                                padding: "10px 14px",
                            }}>
                                <div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 14,
                                        color: T.textPrimary,
                                        fontWeight: 500
                                    }}>{s.exercise}</p>
                                    <p style={{
                                        margin: "2px 0 0",
                                        fontSize: 12,
                                        color: T.textSecondary,
                                        fontFamily: "'JetBrains Mono', monospace"
                                    }}>
                                        {s.weight}kg × {s.reps} · RPE {s.rpe}
                                    </p>
                                </div>
                                <button onClick={() => onDelete(s.id)} aria-label="Delete set"
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: T.textMuted,
                                            cursor: "pointer"
                                        }}>
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}