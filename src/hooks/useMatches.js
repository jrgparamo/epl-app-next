"use client";

import { useState, useEffect } from "react";
import { getFixturesByMatchday, getCurrentMatchday } from "../lib/api";

export function useMatches() {
  const [currentWeek, setCurrentWeek] = useState(null);
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load current matchday and initial matches
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const matchday = await getCurrentMatchday();
        setCurrentMatchday(matchday);
        setCurrentWeek(matchday);

        const matchesData = await getFixturesByMatchday(matchday);
        setMatches(matchesData);
        setInitialLoadComplete(true);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError(
          "Failed to load matches. Please check your API key configuration."
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load matches when week changes (after initial load)
  useEffect(() => {
    if (!initialLoadComplete || !currentWeek) return;

    const loadMatches = async () => {
      try {
        setLoading(true);
        const matchesData = await getFixturesByMatchday(currentWeek);
        setMatches(matchesData);
      } catch (err) {
        console.error("Error loading matches:", err);
        setError("Failed to load matches for this matchday.");
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [currentWeek, initialLoadComplete]);

  const handleWeekChange = (week) => {
    setCurrentWeek(week);
    setError(null);
  };

  return {
    currentWeek,
    currentMatchday,
    matches,
    loading,
    error,
    initialLoadComplete,
    handleWeekChange,
  };
}
