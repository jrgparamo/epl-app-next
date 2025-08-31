"use client";

import { useState, useEffect, useCallback } from "react";

export function useCorrectPredictions(user, matches, scorePredictions) {
  const [correctPredictions, setCorrectPredictions] = useState(0);
  const [totalCorrectPredictions, setTotalCorrectPredictions] = useState(0);

  // Load saved correct prediction counts
  useEffect(() => {
    if (!user?.id) return;

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
  }, [user]);

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

  return {
    correctPredictions,
    totalCorrectPredictions,
  };
}
