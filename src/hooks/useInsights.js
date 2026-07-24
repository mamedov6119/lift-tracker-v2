import {useCallback, useState} from "react";
import {saveJSON} from "../lib/persistence.js";
import {todayISO} from "../lib/rules.js";

export function useInsights() {
    const [muted, setMuted] = useState(false);
    const [insightLog, setInsightLog] = useState({});
    const [dismissed, setDismissed] = useState({});

    const dismissInsight = useCallback((id) => {
        setDismissed((current) => ({...current, [id + todayISO()]: true}));
    }, []);

    const toggleMute = useCallback(() => {
        setMuted((current) => {
            const next = !current;
            saveJSON("app-state", {muted: next, insightLog});
            return next;
        });
    }, [insightLog]);

    return {
        muted,
        setMuted,
        insightLog,
        setInsightLog,
        dismissed,
        setDismissed,
        dismissInsight,
        toggleMute,
    };
}
