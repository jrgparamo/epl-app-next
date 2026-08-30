import { useState, useEffect } from "react";

// Picks for a whole matchday are fetched once and reused across every match card
// tapped in that matchday. Past matchdays are immutable so they are cached and
// served without refetching. The current matchday changes live (locks lift,
// results land) so it always refetches — but the last good payload is retained
// so an offline reopen can fall back to stale data instead of failing.
const cache = new Map();

export function useLeaguePicks(matchday, cacheable = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchday) {
      setData(null);
      return;
    }

    const cacheKey = String(matchday);
    if (cacheable && cache.has(cacheKey)) {
      setData(cache.get(cacheKey));
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/predictions/league-picks?matchday=${encodeURIComponent(matchday)}`,
        );
        if (!res.ok) throw new Error("Failed to load league picks");
        const json = await res.json();
        cache.set(cacheKey, json);
        if (!cancelled) setData(json);
      } catch (err) {
        // Offline / failed refetch: serve the last good payload if we have one.
        const stale = cache.get(cacheKey);
        if (!cancelled) {
          if (stale) {
            setData(stale);
            setError(null);
          } else {
            setError(err.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [matchday, cacheable]);

  return { data, loading, error };
}
