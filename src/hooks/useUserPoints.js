import { useState, useEffect, useCallback } from "react";

export function useUserPoints(user) {
  const [points, setPoints] = useState(0);
  const [pointsData, setPointsData] = useState({
    total_points: 0,
    matches_predicted: 0,
    correct_predictions: 0,
    last_updated: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPoints = useCallback(async () => {
    if (!user?.id) {
      setPoints(0);
      setPointsData({
        total_points: 0,
        matches_predicted: 0,
        correct_predictions: 0,
        last_updated: null,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/points", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPoints(data.total_points || 0);
      setPointsData(data);
    } catch (err) {
      console.error("Error fetching user points:", err);
      setError(err.message);

      // Fallback to localStorage for backwards compatibility
      if (user?.email) {
        const savedTotal = localStorage.getItem(
          `total_correct_predictions_${user.email}`
        );
        if (savedTotal) {
          const fallbackPoints = parseInt(savedTotal, 10) || 0;
          setPoints(fallbackPoints);
          setPointsData({
            total_points: fallbackPoints,
            matches_predicted: 0,
            correct_predictions: 0,
            last_updated: null,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch points when user changes
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // Refetch points periodically (every 5 minutes)
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(fetchPoints, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPoints, user]);

  const refetchPoints = useCallback(() => {
    fetchPoints();
  }, [fetchPoints]);

  return {
    points,
    pointsData,
    loading,
    error,
    refetchPoints,
  };
}
