import { useState, useEffect, useCallback } from "react";

// Season Total updates at most once per completed match, so a short client-side
// cache keeps the badge instant and avoids hitting /api/points on every page.
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes — matches the app's other caches.
const cacheKey = (userId) => `user_points_cache_${userId}`;

const EMPTY_SUMMARY = {
  total_points: 0,
  predicted_matches: 0,
  correct_predictions: 0,
  finished_matches: 0,
  last_updated: null,
};

function readCache(userId) {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.fetchedAt !== "number" || !parsed.data) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(userId, data) {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(
      cacheKey(userId),
      JSON.stringify({ data, fetchedAt: Date.now() }),
    );
  } catch {
    // localStorage unavailable (SSR, private browsing quota) — safe to ignore.
  }
}

export function useUserPoints(user) {
  const userId = user?.id;
  const [pointsData, setPointsData] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Seed synchronously from the cached DB response so the badge never flashes 0.
  useEffect(() => {
    if (!userId) {
      setPointsData(EMPTY_SUMMARY);
      return;
    }
    const cached = readCache(userId);
    if (cached?.data) setPointsData(cached.data);
  }, [userId]);

  const fetchPoints = useCallback(
    async ({ force = false } = {}) => {
      if (!userId) return;

      const cached = readCache(userId);
      const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
      // Serve fresh cache without touching the network (stale-while-revalidate).
      if (isFresh && !force) {
        setPointsData(cached.data);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/points", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const summary = {
          total_points: data.total_points ?? 0,
          predicted_matches: data.predicted_matches ?? 0,
          correct_predictions: data.correct_predictions ?? 0,
          finished_matches: data.finished_matches ?? 0,
          last_updated: data.last_updated ?? null,
        };
        setPointsData(summary);
        writeCache(userId, summary);
      } catch (err) {
        console.error("Error fetching user points:", err);
        setError(err.message);
        // Keep showing the last cached value on error rather than dropping to 0.
        if (cached?.data) setPointsData(cached.data);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  // Revalidate on mount and when the tab regains focus; both are gated by the
  // TTL inside fetchPoints, so they won't spam the network.
  useEffect(() => {
    fetchPoints();
    if (!userId) return;

    const onFocus = () => fetchPoints();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchPoints, userId]);

  const refetchPoints = useCallback(
    () => fetchPoints({ force: true }),
    [fetchPoints],
  );

  return {
    points: pointsData.total_points || 0,
    pointsData,
    loading,
    error,
    refetchPoints,
  };
}
