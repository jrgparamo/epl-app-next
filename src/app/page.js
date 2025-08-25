"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import MatchList from "./components/MatchList";
import WeekSelector from "./components/WeekSelector";
import { useAuth } from "./hooks/useAuth";
import { getFixturesByMatchday, getCurrentMatchday } from "../lib/api";

export default function Home() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(null);
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState({});
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

  // Load saved predictions from localStorage
  useEffect(() => {
    if (user) {
      const savedPredictions = localStorage.getItem(
        `predictions_${user.email}`
      );
      if (savedPredictions) {
        setPredictions(JSON.parse(savedPredictions));
      }
    }
  }, [user]);

  const handleWeekChange = (week) => {
    setCurrentWeek(week);
    setError(null);
  };

  const handlePrediction = (matchId, prediction) => {
    if (!user) return;

    const newPredictions = {
      ...predictions,
      [matchId]: prediction,
    };

    setPredictions(newPredictions);
    localStorage.setItem(
      `predictions_${user.email}`,
      JSON.stringify(newPredictions)
    );
  };

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading Premier League matches...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Make sure you have set up your Football Data API key in your
                environment variables.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <WeekSelector
          currentWeek={currentWeek}
          onWeekChange={handleWeekChange}
          currentMatchday={currentMatchday}
          totalWeeks={38}
        />

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Matchday {currentWeek}
              {currentWeek < currentMatchday && (
                <span className="ml-2 text-sm bg-gray-600 px-2 py-1 rounded">
                  Completed
                </span>
              )}
              {currentWeek > currentMatchday && (
                <span className="ml-2 text-sm bg-blue-600 px-2 py-1 rounded">
                  Upcoming
                </span>
              )}
              {currentWeek === currentMatchday && (
                <span className="ml-2 text-sm bg-green-600 px-2 py-1 rounded">
                  Current
                </span>
              )}
            </h2>
            <div className="text-sm text-gray-400">
              {loading && "Loading..."}
              {!loading && matches.length > 0 && `${matches.length} matches`}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <MatchList
            matches={matches}
            predictions={predictions}
            onPrediction={handlePrediction}
          />
        )}

        {!loading && matches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              No matches available
            </div>
            <div className="text-gray-500 text-sm">
              Check back later or select a different matchday
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <div className="text-xs text-gray-500">
            Premier League prediction app powered by Football Data API
          </div>
        </div>
      </main>
    </div>
  );
}
