import { useEffect, useState } from "react";
import { api, UnauthorizedError } from "../lib/api.js";

// Progress screen: the chip row of trackable lifts, plus the series for
// whichever one is selected.
export function useProgress() {
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getTrackedExercises()
      .then((list) => {
        setExercises(list);
        setSelected((current) => current || list[0]?.id || null);
        if (list.length === 0) setLoading(false);
      })
      .catch((err) => { if (!(err instanceof UnauthorizedError)) setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selected) return;
    let stale = false;
    setLoading(true);
    api.getProgress(selected)
      .then((data) => { if (!stale) { setDetail(data); setError(null); } })
      .catch((err) => { if (!stale && !(err instanceof UnauthorizedError)) setError(err.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [selected]);

  return { exercises, selected, setSelected, detail, loading, error };
}
