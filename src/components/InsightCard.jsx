import {Flame, Trophy, Sparkles, X} from "lucide-react";
import {Card} from "./ui/Card.jsx";
import {IconCircle} from "./ui/IconCircle.jsx";
import T from "../theme.js";
import React from "react";

const ICONS = { flame: Flame, trophy: Trophy, sparkles: Sparkles };

export function InsightCard({insight, onDismiss}) {
    const Icon = ICONS[insight.icon] || Sparkles;
    return (
        <Card style={{display: "flex", gap: 12}}>
            <IconCircle tone={insight.tone === "positive" ? "amber" : "teal"}>
                <Icon size={18}/>
            </IconCircle>
            <div style={{flex: 1, minWidth: 0}}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8}}>
                    <p style={{margin: 0, fontWeight: 500, fontSize: 14, color: T.textPrimary}}>{insight.title}</p>
                    <button
                        onClick={() => onDismiss(insight.id)}
                        aria-label="Dismiss"
                        style={{
                            background: "none",
                            border: "none",
                            color: T.textMuted,
                            cursor: "pointer",
                            padding: 2,
                            flexShrink: 0
                        }}
                    >
                        <X size={16}/>
                    </button>
                </div>
                <p style={{margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: T.textSecondary}}>{insight.body}</p>
                <p style={{margin: "8px 0 0", fontSize: 11, lineHeight: 1.5, color: T.textMuted, fontStyle: "italic"}}>
                    {insight.citation}
                </p>
            </div>
        </Card>
    );
}