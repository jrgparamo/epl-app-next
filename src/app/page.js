"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import MatchList from "./components/MatchList";
import WeekSelector from "./components/WeekSelector";
import { CacheIndicator } from "./components/CacheDebug";
import { useAuth } from "./components/AuthProvider";
import { getFixturesByMatchday, getCurrentMatchday } from "../lib/api";
import { predictionsService } from "../lib/predictions";

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
  const [syncError, setSyncError] = useState(null);
  const [retryQueueCount, setRetryQueueCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // Handle user logout cleanup
  useEffect(() => {
    if (!user) {
      // Clear predictions state when user logs out
      setScorePredictions({});
      setCorrectPredictions(0);
      setTotalCorrectPredictions(0);
      setSyncError(null);
      setRetryQueueCount(0);
    } else if (user?.id) {
      // Clear service's local data for previous user when switching users
      // This ensures clean state when logging in as different user
      // The service will handle loading the correct user's data
      setSyncError(null);

      // Update retry queue count when user changes
      const status = predictionsService.getRetryQueueStatus(user.id);
      setRetryQueueCount(status.count);
    }
  }, [user]);

  // Online/offline detection and background sync
  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setSyncError(null);

      if (user?.id) {
        console.log("Connection restored, processing retry queue...");
        try {
          const result = await predictionsService.processRetryQueue(user.id);
          if (result.success > 0) {
            const status = predictionsService.getRetryQueueStatus(user.id);
            setRetryQueueCount(status.count);
            console.log(
              `Successfully synced ${result.success} queued predictions`
            );
          }
        } catch (error) {
          console.error(
            "Failed to process retry queue on reconnection:",
            error
          );
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncError(
        "No internet connection. Predictions will be saved locally and synced when connection is restored."
      );
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  // Background sync timer
  useEffect(() => {
    if (!user?.id) return;

    const syncInterval = setInterval(async () => {
      try {
        const status = predictionsService.getRetryQueueStatus(user.id);

        if (!status.isEmpty && navigator.onLine) {
          console.log("Background sync: Processing retry queue...");
          const result = await predictionsService.processRetryQueue(user.id);

          if (result.success > 0 || result.failed > 0) {
            const newStatus = predictionsService.getRetryQueueStatus(user.id);
            setRetryQueueCount(newStatus.count);

            if (result.success > 0) {
              console.log(
                `Background sync: Successfully synced ${result.success} predictions`
              );
              if (newStatus.isEmpty) {
                setSyncError(null); // Clear error when queue is empty
              }
            }
          }
        }
      } catch (error) {
        console.error("Background sync error:", error);
      }
    }, 60000); // Every minute

    return () => clearInterval(syncInterval);
  }, [user]);

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

  // Load saved predictions and correct prediction count
  useEffect(() => {
    const loadUserPredictions = async () => {
      if (!user?.id) return;

      try {
        // Load predictions using the service (handles local-first with DB sync)
        const predictions = await predictionsService.getPredictions(user.id);

        // Convert from service format to component format
        const formattedPredictions = {};
        Object.entries(predictions).forEach(([matchId, prediction]) => {
          formattedPredictions[matchId] = {
            home: prediction.home_score,
            away: prediction.away_score,
          };
        });

        setScorePredictions(formattedPredictions);

        // Check retry queue status
        const retryStatus = predictionsService.getRetryQueueStatus(user.id);
        setRetryQueueCount(retryStatus.count);

        if (retryStatus.count > 0) {
          setSyncError(
            `${retryStatus.count} prediction${
              retryStatus.count !== 1 ? "s" : ""
            } pending sync. Will retry automatically.`
          );
        }

        // Migrate existing localStorage data to the service if DB is empty
        if (Object.keys(predictions).length === 0) {
          await migrateLocalStorageToService();
        }

        // Load other localStorage data (these remain as is for now)
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
      } catch (error) {
        console.error("Error loading predictions:", error);
        setSyncError("Failed to sync predictions. Using local data only.");

        // Fallback to localStorage-only approach
        const savedScorePredictions = localStorage.getItem(
          `score_predictions_${user.email}`
        );
        if (savedScorePredictions) {
          setScorePredictions(JSON.parse(savedScorePredictions));
        }
      }
    };

    // Migration helper function
    const migrateLocalStorageToService = async () => {
      try {
        const savedScorePredictions = localStorage.getItem(
          `score_predictions_${user.email}`
        );

        if (savedScorePredictions) {
          const localPredictions = JSON.parse(savedScorePredictions);

          // Migrate each prediction to the service
          for (const [matchId, prediction] of Object.entries(
            localPredictions
          )) {
            if (prediction.home !== null && prediction.away !== null) {
              try {
                await predictionsService.savePrediction(
                  user.id,
                  matchId,
                  prediction.home,
                  prediction.away,
                  1 // default confidence
                );
              } catch (error) {
                console.error(
                  `Error migrating prediction for match ${matchId}:`,
                  error
                );
              }
            }
          }

          console.log(
            "Successfully migrated localStorage predictions to database"
          );
        }
      } catch (error) {
        console.error("Error during migration:", error);
      }
    };

    loadUserPredictions();
  }, [user]);

  const handleWeekChange = (week) => {
    setCurrentWeek(week);
    setError(null);
  };

  const handleScorePrediction = async (matchId, homeScore, awayScore) => {
    if (!user?.id) return;

    try {
      // Optimistic update for immediate UI feedback
      const newScorePredictions = {
        ...scorePredictions,
        [matchId]: { home: homeScore, away: awayScore },
      };
      setScorePredictions(newScorePredictions);

      // Save prediction using the service (handles both local storage and DB sync)
      await predictionsService.savePrediction(
        user.id,
        matchId,
        homeScore,
        awayScore,
        1 // default confidence
      );

      // Also keep the localStorage backup for compatibility
      localStorage.setItem(
        `score_predictions_${user.email}`,
        JSON.stringify(newScorePredictions)
      );

      // Clear any previous sync errors on successful save
      setSyncError(null);

      // Update retry queue count
      const status = predictionsService.getRetryQueueStatus(user.id);
      setRetryQueueCount(status.count);
    } catch (error) {
      console.error("Error saving prediction:", error);

      const errorMessage = isOnline
        ? "Failed to sync prediction to database. Saved locally and will retry automatically."
        : "No internet connection. Prediction saved locally and will sync when connection is restored.";

      setSyncError(errorMessage);

      // Update retry queue count
      const status = predictionsService.getRetryQueueStatus(user.id);
      setRetryQueueCount(status.count);

      // Fallback to localStorage-only approach if service fails
      const newScorePredictions = {
        ...scorePredictions,
        [matchId]: { home: homeScore, away: awayScore },
      };
      setScorePredictions(newScorePredictions);
      localStorage.setItem(
        `score_predictions_${user.email}`,
        JSON.stringify(newScorePredictions)
      );
    }
  };

  // Delete a prediction (available for future use)
  // const deletePrediction = async (matchId) => {
  //   if (!user?.id) return;

  //   try {
  //     // Optimistic update for immediate UI feedback
  //     const newScorePredictions = { ...scorePredictions };
  //     delete newScorePredictions[matchId];
  //     setScorePredictions(newScorePredictions);

  //     // Delete prediction using the service
  //     await predictionsService.deletePrediction(user.id, matchId);

  //     // Update localStorage backup
  //     localStorage.setItem(
  //       `score_predictions_${user.email}`,
  //       JSON.stringify(newScorePredictions)
  //     );
  //   } catch (error) {
  //     console.error("Error deleting prediction:", error);

  //     // Revert optimistic update on error
  //     setScorePredictions(scorePredictions);
  //   }
  // };

  // Force sync predictions from database (useful for refresh or data consistency)
  const forceSyncPredictions = async () => {
    if (!user?.id) return;

    try {
      console.log("Force syncing predictions...");

      // First process retry queue
      const retryResult = await predictionsService.processRetryQueue(user.id);
      console.log("Retry queue processed:", retryResult);

      // Then force sync from database
      const predictions = await predictionsService.forceSyncFromDatabase(
        user.id
      );

      // Convert from service format to component format
      const formattedPredictions = {};
      Object.entries(predictions).forEach(([matchId, prediction]) => {
        formattedPredictions[matchId] = {
          home: prediction.home_score,
          away: prediction.away_score,
        };
      });

      setScorePredictions(formattedPredictions);

      // Update localStorage backup
      localStorage.setItem(
        `score_predictions_${user.email}`,
        JSON.stringify(formattedPredictions)
      );

      // Update retry queue count
      const status = predictionsService.getRetryQueueStatus(user.id);
      setRetryQueueCount(status.count);

      if (status.isEmpty) {
        setSyncError(null);
      }

      console.log("Force sync completed successfully");
    } catch (error) {
      console.error("Error syncing predictions:", error);
    }
  }; // Check if a prediction is correct
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

          {/* Sync error indicator */}
          {syncError && (
            <div className="mt-2 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
              <div className="text-center text-yellow-400 text-sm">
                ⚠️ {syncError}
              </div>
              {retryQueueCount > 0 && (
                <div className="text-center text-yellow-300 text-xs mt-1">
                  {retryQueueCount} prediction{retryQueueCount !== 1 ? "s" : ""}{" "}
                  pending sync
                  {!isOnline && " (waiting for internet connection)"}
                </div>
              )}
            </div>
          )}

          {/* Connection status indicator */}
          {!isOnline && (
            <div className="mt-2 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
              <div className="text-center text-red-400 text-sm">
                🔌 No internet connection - predictions will sync when connected
              </div>
            </div>
          )}

          {/* Debug sync button (for testing) */}
          {user && retryQueueCount > 0 && (
            <div className="mt-2 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
              <div className="text-center">
                <button
                  onClick={forceSyncPredictions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  🔄 Force Sync Now ({retryQueueCount} pending)
                </button>
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
