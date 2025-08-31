"use client";

import { useState, useEffect } from "react";
import { predictionsService } from "../lib/predictions";
import { useNetworkStatus } from "./useNetworkStatus";

export function usePredictions(user) {
  const [scorePredictions, setScorePredictions] = useState({});
  const [syncError, setSyncError] = useState(null);
  const [retryQueueCount, setRetryQueueCount] = useState(0);
  const isOnline = useNetworkStatus();

  // Handle user logout cleanup
  useEffect(() => {
    if (!user) {
      // Clear predictions state when user logs out
      setScorePredictions({});
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
    const handleOnline = async () => {
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
      setSyncError(
        "No internet connection. Predictions will be saved locally and synced when connection is restored."
      );
    };

    if (isOnline) {
      handleOnline();
    } else {
      handleOffline();
    }
  }, [isOnline, user]);

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

  // Load saved predictions
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
  };

  return {
    scorePredictions,
    syncError,
    retryQueueCount,
    handleScorePrediction,
    forceSyncPredictions,
  };
}
