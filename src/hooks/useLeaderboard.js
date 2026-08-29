import { useState, useEffect } from "react";

// Past-matchday standings are immutable, so cache those responses and skip the
// refetch. Season (Overall) and the live current matchday always refetch.
const cache = new Map();

export function useLeaderboard(matchday = null, cacheable = false) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cacheKey = `lb:${matchday ?? "season"}`;

  const fetchLeaderboard = async ({ force = false } = {}) => {
    if (cacheable && !force) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setLeaderboard(cached);
        setError(null);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const url = matchday
        ? `/api/leaderboard?matchday=${matchday}`
        : "/api/leaderboard";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();
      if (cacheable) cache.set(cacheKey, data);
      setLeaderboard(data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchday, cacheable]);

  return {
    leaderboard,
    loading,
    error,
    refetchLeaderboard: () => fetchLeaderboard({ force: true }),
  };
}
