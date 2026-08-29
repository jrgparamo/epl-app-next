import { useState, useEffect } from "react";

export function useMemberPicks(userId, matchday) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !matchday) {
      setData(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/predictions/compare?matchday=${matchday}&userId=${encodeURIComponent(userId)}`,
        );
        if (!res.ok) throw new Error("Failed to load predictions");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, matchday]);

  return { data, loading, error };
}
