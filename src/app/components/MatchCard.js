"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import {
  getTeamLogo,
  getMatchStatusText,
  getScoreDisplay,
  isMatchFinished,
  hasMatchStarted,
} from "../../lib/utils";

export default function MatchCard({
  match,
  scorePrediction,
  onScorePrediction,
}) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  // Load score prediction when component mounts or scorePrediction changes
  useEffect(() => {
    if (scorePrediction) {
      setHomeScore(scorePrediction.home?.toString() || "");
      setAwayScore(scorePrediction.away?.toString() || "");
    }
  }, [scorePrediction]);

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

  // Get background color based on prediction correctness
  const getPredictionBackgroundColor = () => {
    if (!isMatchFinished(match.status) || !scorePrediction) {
      return "bg-gray-600 bg-opacity-20 border-gray-600"; // Default
    }

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

      // Check if prediction is correct
      const isResultCorrect = checkPredictionCorrect(match, derivedPrediction);
      const isScoreCorrect = checkScorePredictionCorrect(
        match,
        scorePrediction
      );

      if (isScoreCorrect) {
        return "bg-green-600 bg-opacity-30 border-green-500"; // Exact score correct
      } else if (isResultCorrect) {
        return "bg-green-600 bg-opacity-20 border-green-600"; // Result correct
      } else {
        return "bg-red-600 bg-opacity-20 border-red-600"; // Incorrect
      }
    }

    return "bg-gray-600 bg-opacity-20 border-gray-600"; // Default
  };

  // Get text color based on prediction correctness
  const getPredictionTextColor = () => {
    if (!isMatchFinished(match.status) || !scorePrediction) {
      return "text-gray-400"; // Default
    }

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

      // Check if prediction is correct
      const isResultCorrect = checkPredictionCorrect(match, derivedPrediction);
      const isScoreCorrect = checkScorePredictionCorrect(
        match,
        scorePrediction
      );

      if (isScoreCorrect || isResultCorrect) {
        return "text-green-100"; // Lighter text for correct predictions
      } else {
        return "text-red-100"; // Lighter text for incorrect predictions
      }
    }

    return "text-gray-400"; // Default
  };

  const handleScoreChange = (team, value) => {
    if (!isAuthenticated) return;

    // Only allow numbers and empty string
    if (value !== "" && (isNaN(value) || value < 0 || value > 20)) return;

    let newHomeScore = homeScore;
    let newAwayScore = awayScore;

    if (team === "home") {
      setHomeScore(value);
      newHomeScore = value;
    } else {
      setAwayScore(value);
      newAwayScore = value;
    }

    // Save to localStorage when both scores are provided or when clearing both
    if (
      (newHomeScore !== "" && newAwayScore !== "") ||
      (newHomeScore === "" && newAwayScore === "")
    ) {
      const homeScoreNum = newHomeScore === "" ? null : parseInt(newHomeScore);
      const awayScoreNum = newAwayScore === "" ? null : parseInt(newAwayScore);
      onScorePrediction(match.id, homeScoreNum, awayScoreNum);
    }
  };

  const matchFinished = isMatchFinished(match.status);
  const matchStarted = hasMatchStarted(match.utcDate);
  const statusText = getMatchStatusText(match.status, match.utcDate);
  const score = getScoreDisplay(match.score, match.status);

  if (matchFinished) {
    return (
      <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:bg-[#353535] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Premier League</span>
          <span className="text-xs text-gray-400">{statusText}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 relative flex items-center justify-center flex-shrink-0">
              <Image
                src={getTeamLogo(match.homeTeam.name)}
                alt={`${match.homeTeam.name} logo`}
                width={40}
                height={40}
                className="max-w-full max-h-full object-contain"
                style={{ width: "auto", height: "auto" }}
                onError={(e) => {
                  e.target.src = "/team-logos/default.svg";
                }}
              />
            </div>
            <span className="text-white">
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-lg font-bold">
            <span className="text-white">{score.home}</span>
            <span className="text-gray-400">-</span>
            <span className="text-white">{score.away}</span>
          </div>

          <div className="flex flex-col items-center  ">
            <div className="w-10 h-10 relative flex items-center justify-center flex-shrink-0">
              <Image
                src={getTeamLogo(match.awayTeam.name)}
                alt={`${match.awayTeam.name} logo`}
                width={40}
                height={40}
                className="max-w-full max-h-full object-contain"
                style={{ width: "auto", height: "auto" }}
                onError={(e) => {
                  e.target.src = "/team-logos/default.svg";
                }}
              />
            </div>
            <span className="text-white text-center">
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
          </div>
        </div>

        {scorePrediction && isAuthenticated && (
          <div
            className={`mt-4 p-3 border rounded-lg ${getPredictionBackgroundColor()}`}
          >
            <div className={`text-center text-sm ${getPredictionTextColor()}`}>
              Your prediction: {scorePrediction.home} - {scorePrediction.away}
              {scorePrediction.home !== null &&
                scorePrediction.away !== null && (
                  <span className="ml-2">
                    (
                    {scorePrediction.home > scorePrediction.away
                      ? match.homeTeam.shortName || match.homeTeam.name
                      : scorePrediction.away > scorePrediction.home
                      ? match.awayTeam.shortName || match.awayTeam.name
                      : "Draw"}
                    )
                  </span>
                )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">{match.id}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:bg-[#353535] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">Premier League</span>
        <span className="text-xs text-gray-400">{statusText}</span>
      </div>

      {/* Team vs Team Layout */}
      <div className="flex items-center justify-between mb-4">
        {/* Home Team */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 relative flex items-center justify-center mb-2">
            <Image
              src={getTeamLogo(match.homeTeam.name)}
              alt={`${match.homeTeam.name} logo`}
              width={64}
              height={64}
              className="max-w-full max-h-full object-contain"
              style={{ width: "auto", height: "auto" }}
              onError={(e) => {
                e.target.src = "/team-logos/default.svg";
              }}
            />
          </div>
          <span className="text-sm text-white font-medium text-center">
            {match.homeTeam.shortName || match.homeTeam.name}
          </span>
        </div>

        {/* VS Section */}
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">VS</div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 relative flex items-center justify-center mb-2">
            <Image
              src={getTeamLogo(match.awayTeam.name)}
              alt={`${match.awayTeam.name} logo`}
              width={64}
              height={64}
              className="max-w-full max-h-full object-contain"
              style={{ width: "auto", height: "auto" }}
              onError={(e) => {
                e.target.src = "/team-logos/default.svg";
              }}
            />
          </div>
          <span className="text-sm text-white font-medium text-center">
            {match.awayTeam.shortName || match.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Score Prediction Section */}
      {isAuthenticated && !matchStarted && (
        <div className="mt-4 p-3 bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg">
          <div className="text-center text-sm text-blue-400 mb-3">
            Predict the score
          </div>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">
                {match.homeTeam.shortName || match.homeTeam.name}
              </span>
              <input
                type="number"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => handleScoreChange("home", e.target.value)}
                className={`w-16 h-10 text-center bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${
                  homeScore !== "" ? "border-blue-500" : "border-gray-600"
                }`}
                placeholder="0"
              />
            </div>
            <span className="text-gray-400 text-lg">-</span>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">
                {match.awayTeam.shortName || match.awayTeam.name}
              </span>
              <input
                type="number"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => handleScoreChange("away", e.target.value)}
                className={`w-16 h-10 text-center bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${
                  awayScore !== "" ? "border-blue-500" : "border-gray-600"
                }`}
                placeholder="0"
              />
            </div>
          </div>
          {homeScore !== "" && awayScore !== "" && (
            <div className="text-center text-xs text-blue-300 mt-2">
              ✓ Score prediction saved
            </div>
          )}
          {(homeScore !== "" || awayScore !== "") &&
            !(homeScore !== "" && awayScore !== "") && (
              <div className="text-center text-xs text-yellow-300 mt-2">
                Enter both scores to save prediction
              </div>
            )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-4 p-3 bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg">
          <div className="text-center">
            <button
              onClick={() => (window.location.href = "/")}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign in to predict scores
            </button>
          </div>
        </div>
      )}

      {matchStarted && (
        <div className="mt-4 p-3 bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg">
          <div className="text-center text-sm text-yellow-400">
            Match has started - predictions are locked
          </div>
        </div>
      )}

      {scorePrediction &&
        scorePrediction.home !== null &&
        scorePrediction.away !== null &&
        isAuthenticated &&
        !matchStarted && (
          <div className="mt-4 p-3 bg-green-600 bg-opacity-20 border border-green-600 rounded-lg">
            <div className="text-center text-sm text-green-400">
              ✓ Prediction saved: {scorePrediction.home} -{" "}
              {scorePrediction.away}
              {scorePrediction.home > scorePrediction.away && (
                <span className="ml-2">
                  ({match.homeTeam.shortName || match.homeTeam.name} win)
                </span>
              )}
              {scorePrediction.away > scorePrediction.home && (
                <span className="ml-2">
                  ({match.awayTeam.shortName || match.awayTeam.name} win)
                </span>
              )}
              {scorePrediction.home === scorePrediction.away && (
                <span className="ml-2">(Draw)</span>
              )}
            </div>
          </div>
        )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{match.id}</span>
      </div>
    </div>
  );
}
