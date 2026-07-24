import {useCallback, useState} from "react";
import {saveJSON} from "../lib/persistence.js";

export function useWorkouts() {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);

    const addSet = useCallback((set) => {
        setSets((current) => {
            const next = [...current, set];
            saveJSON("workouts", next);
            return next;
        });
    }, []);

    const deleteSet = useCallback((id) => {
        setSets((current) => {
            const next = current.filter((set) => set.id !== id);
            saveJSON("workouts", next);
            return next;
        });
    }, []);

    return {
        sets,
        setSets,
        loading,
        setLoading,
        addSet,
        deleteSet,
    };
}
