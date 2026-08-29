import { useState, useEffect } from "react";

// Past-matchday comparisons are immutable, so cache those responses per
// user+matchday and skip the refetch when the same combo is reopened. The
// current matchday changes live (locks, results), so it is never cached.
const cache = new Map();

export function useMemberPicks(userId, matchday, cacheable = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !matchday) {
      setData(null);
      return;
    }

    const cacheKey = `${userId}:${matchday}`;
    if (cacheable) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setData(cached);
        setError(null);
        setLoading(false);
        return;
      }
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
        if (cacheable) cache.set(cacheKey, json);
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
  }, [userId, matchday, cacheable]);

  return { data, loading, error };
}
