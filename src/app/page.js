"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import MatchList from "./components/MatchList";
import WeekSelector from "./components/WeekSelector";
import { CacheIndicator } from "./components/CacheDebug";
import { useAuth } from "./hooks/useAuth";
import { getFixturesByMatchday, getCurrentMatchday } from "../lib/api";

export default function Home() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(null);
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scorePredictions, setScorePredictions] = useState({});
  const [correctPredictions, setCorrectPredictions] = useState(0);
  const [totalCorrectPredictions, setTotalCorrectPredictions] = useState(0);
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

  // Load saved predictions and correct prediction count from localStorage
  useEffect(() => {
    if (user) {
      const savedScorePredictions = localStorage.getItem(
        `score_predictions_${user.email}`
      );
      if (savedScorePredictions) {
        setScorePredictions(JSON.parse(savedScorePredictions));
      }

      const savedCorrectCount = localStorage.getItem(
        `correct_predictions_${user.email}`
      );
      if (savedCorrectCount) {
        setCorrectPredictions(parseInt(savedCorrectCount, 10));
      }

      // Load total correct predictions from localStorage
      const savedTotalCorrect = localStorage.getItem(
        `total_correct_predictions_${user.email}`
      );
      if (savedTotalCorrect) {
        setTotalCorrectPredictions(parseInt(savedTotalCorrect, 10));
      } else {
        // One-time migration: calculate initial total for existing users
        setTotalCorrectPredictions(0);
        localStorage.setItem(`total_correct_predictions_${user.email}`, "0");
        // Clear processed matches to allow recalculation
        localStorage.removeItem(`processed_matches_${user.email}`);
      }
    }
  }, [user]);

  const handleWeekChange = (week) => {
    setCurrentWeek(week);
    setError(null);
  };

  const handleScorePrediction = (matchId, homeScore, awayScore) => {
    if (!user) return;

    const newScorePredictions = {
      ...scorePredictions,
      [matchId]: { home: homeScore, away: awayScore },
    };

    setScorePredictions(newScorePredictions);
    localStorage.setItem(
      `score_predictions_${user.email}`,
      JSON.stringify(newScorePredictions)
    );
  };

  // Check if a prediction is correct
  const checkPredictionCorrect = (match, userPrediction) => {
    if (!match.score || !match.score.fullTime) return false;

    const { fullTime } = match.score;
    const homeScore = fullTime.home;
    const awayScore = fullTime.away;

    // If it's a draw
    if (homeScore === awayScore) {
      return userPrediction === "draw";
    }

    // Home win
    if (homeScore > awayScore) {
      return userPrediction === "home";
    }

    // Away win
    return userPrediction === "away";
  };

  // Check if a score prediction is correct
  const checkScorePredictionCorrect = (match, scorePrediction) => {
    if (!match.score || !match.score.fullTime || !scorePrediction) return false;
    if (scorePrediction.home === null || scorePrediction.away === null)
      return false;

    const { fullTime } = match.score;
    return (
      fullTime.home === scorePrediction.home &&
      fullTime.away === scorePrediction.away
    );
  };

  // Update total correct predictions when matches finish
  const updateTotalCorrectPredictions = useCallback(
    (match, points) => {
      if (!user) return;

      // Get the key to track processed matches
      const processedKey = `processed_matches_${user.email}`;
      const processedMatches = JSON.parse(
        localStorage.getItem(processedKey) || "{}"
      );

      // Check if this match has already been processed
      if (processedMatches[match.id]) {
        return; // Already processed, don't add points again
      }

      // Mark this match as processed
      processedMatches[match.id] = true;
      localStorage.setItem(processedKey, JSON.stringify(processedMatches));

      // Update total correct predictions
      const currentTotal = parseInt(
        localStorage.getItem(`total_correct_predictions_${user.email}`) || "0",
        10
      );
      const newTotal = currentTotal + points;

      setTotalCorrectPredictions(newTotal);
      localStorage.setItem(
        `total_correct_predictions_${user.email}`,
        newTotal.toString()
      );
    },
    [user]
  );

  // Update correct predictions count when matches change or predictions are updated
  useEffect(() => {
    if (!user || !matches.length) return;

    let newCorrectCount = 0;

    matches.forEach((match) => {
      // Only check finished matches
      if (match.status === "FINISHED" && scorePredictions[match.id]) {
        const scorePrediction = scorePredictions[match.id];

        if (scorePrediction.home !== null && scorePrediction.away !== null) {
          // Derive the result prediction from score prediction
          let derivedPrediction;
          if (scorePrediction.home > scorePrediction.away) {
            derivedPrediction = "home";
          } else if (scorePrediction.away > scorePrediction.home) {
            derivedPrediction = "away";
          } else {
            derivedPrediction = "draw";
          }

          let pointsEarned = 0;

          // Check result prediction (1 point)
          if (checkPredictionCorrect(match, derivedPrediction)) {
            newCorrectCount++;
            pointsEarned++;
          }

          // Check exact score prediction (additional 2 points)
          if (checkScorePredictionCorrect(match, scorePrediction)) {
            newCorrectCount += 2;
            pointsEarned += 2;
          }

          // Update total correct predictions for finished matches
          if (pointsEarned > 0) {
            updateTotalCorrectPredictions(match, pointsEarned);
          }
        }
      }
    });

    setCorrectPredictions(newCorrectCount);
    localStorage.setItem(
      `correct_predictions_${user.email}`,
      newCorrectCount.toString()
    );
  }, [matches, scorePredictions, user, updateTotalCorrectPredictions]);

  // This useEffect is no longer needed since we update total incrementally

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header predictions={totalCorrectPredictions} />
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
        <Header predictions={totalCorrectPredictions} />
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
      <Header predictions={totalCorrectPredictions} />

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

          {/* Correct predictions counter */}
          {user && (
            <div className="mt-2 p-3 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
              <div className="text-center text-green-400">
                Correct Predictions:{" "}
                <span className="font-bold">{correctPredictions}</span>
              </div>
              <div className="text-xs text-green-300 text-center mt-1">
                1 point for correct result or 3 points for exact score
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <MatchList
            matches={matches}
            scorePredictions={scorePredictions}
            onScorePrediction={handleScorePrediction}
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

      {/* Cache indicator for development and debugging */}
      <CacheIndicator />
    </div>
  );
}
