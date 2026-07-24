// ---------- weekly rhythm strip (signature element) ----------
import T from "../theme.js";
import React from "react";

export function WeeklyRhythm({sets}) {
    const dateSet = new Set(sets.map((s) => s.date));
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        days.push({iso, logged: dateSet.has(iso), label: d.toLocaleDateString(undefined, {weekday: "narrow"})});
    }
    return (
        <div style={{display: "flex", gap: 8, justifyContent: "space-between"}}>
            {days.map((d) => (
                <div key={d.iso}
                     style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1}}>
                    <div style={{
                        width: "100%", aspectRatio: "1", maxWidth: 36, borderRadius: 10,
                        background: d.logged ? T.teal : "transparent",
                        border: d.logged ? "none" : `1.5px solid ${T.borderStrong}`,
                    }}/>
                    <span style={{fontSize: 11, color: T.textMuted}}>{d.label}</span>
                </div>
            ))}
        </div>
    );
}