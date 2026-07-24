import {Card} from "../components/ui/Card.jsx";
import {BellOff, Sparkles} from "lucide-react";
import T from "../theme.js";
import {InsightCard} from "../components/InsightCard.jsx";
import React from "react";

export function InsightsTab({insights, onDismiss, muted}) {
    if (muted) {
        return (
            <Card style={{textAlign: "center", padding: 28}}>
                <BellOff size={28} color={T.textMuted} style={{marginBottom: 10}}/>
                <p style={{margin: 0, color: T.textSecondary, fontSize: 14}}>Nudges are muted.</p>
                <p style={{margin: "4px 0 0", color: T.textMuted, fontSize: 13}}>Turn them back on in Settings any
                    time.</p>
            </Card>
        );
    }
    if (insights.length === 0) {
        return (
            <Card style={{textAlign: "center", padding: 28}}>
                <Sparkles size={28} color={T.textMuted} style={{marginBottom: 10}}/>
                <p style={{margin: 0, color: T.textSecondary, fontSize: 14}}>Nothing to flag right now.</p>
                <p style={{margin: "4px 0 0", color: T.textMuted, fontSize: 13}}>Insights show up here when your logged
                    data matches a known pattern.</p>
            </Card>
        );
    }
    return (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            {insights.map((i) => <InsightCard key={i.id} insight={i} onDismiss={onDismiss}/>)}
        </div>
    );
}