"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import ScoreModal from "./ScoreModal";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTeam, setModalTeam] = useState(null);
  const [modalTeamType, setModalTeamType] = useState(null);

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

  const openScoreModal = (team, teamType) => {
    if (!isAuthenticated) return;
    setModalTeam(team);
    setModalTeamType(teamType);
    setModalOpen(true);
  };

  const handleScoreSelect = (score) => {
    let newHomeScore = homeScore;

    if (modalTeamType === "home") {
      setHomeScore(score.toString());
      newHomeScore = score.toString();
    } else {
      setAwayScore(score.toString());
    }

    // Check if we should open modal for the other team
    if (modalTeamType === "home" && awayScore === "") {
      // Home score was just set, now open modal for away team
      setTimeout(() => {
        setModalTeam(match.awayTeam);
        setModalTeamType("away");
        setModalOpen(true);
      }, 300);
    } else if (modalTeamType === "away" && homeScore === "") {
      // Away score was just set, now open modal for home team
      setTimeout(() => {
        setModalTeam(match.homeTeam);
        setModalTeamType("home");
        setModalOpen(true);
      }, 300);
    }

    // Save prediction when both scores are available
    if (modalTeamType === "home" && awayScore !== "") {
      onScorePrediction(match.id, score, parseInt(awayScore));
    } else if (modalTeamType === "away" && newHomeScore !== "") {
      onScorePrediction(match.id, parseInt(newHomeScore), score);
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

        {/* Score Modal */}
        <ScoreModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          team={modalTeam}
          currentScore={
            modalTeamType === "home"
              ? parseInt(homeScore) || null
              : parseInt(awayScore) || null
          }
          onScoreSelect={handleScoreSelect}
          matchInfo={match}
        />
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
              <button
                onClick={() => openScoreModal(match.homeTeam, "home")}
                className={`w-16 h-12 text-center bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 hover:bg-gray-600 transition-all duration-200 transform active:scale-95 touch-manipulation ${
                  homeScore !== ""
                    ? "border-blue-500 bg-blue-600 bg-opacity-20"
                    : "border-gray-600"
                }`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  minHeight: "48px",
                }}
              >
                {homeScore || "?"}
              </button>
            </div>
            <span className="text-gray-400 text-lg">-</span>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">
                {match.awayTeam.shortName || match.awayTeam.name}
              </span>
              <button
                onClick={() => openScoreModal(match.awayTeam, "away")}
                className={`w-16 h-12 text-center bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 hover:bg-gray-600 transition-all duration-200 transform active:scale-95 touch-manipulation ${
                  awayScore !== ""
                    ? "border-blue-500 bg-blue-600 bg-opacity-20"
                    : "border-gray-600"
                }`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  minHeight: "48px",
                }}
              >
                {awayScore || "?"}
              </button>
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
                Tap to set {homeScore === "" ? "home" : "away"} team score
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

      {/* Score Modal */}
      <ScoreModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        team={modalTeam}
        currentScore={
          modalTeamType === "home"
            ? parseInt(homeScore) || null
            : parseInt(awayScore) || null
        }
        onScoreSelect={handleScoreSelect}
        matchInfo={match}
      />
    </div>
  );
}
