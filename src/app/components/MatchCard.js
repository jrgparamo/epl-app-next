"use client";

import Image from "next/image";
import { useAuth } from "../hooks/useAuth";
import { signIn } from "next-auth/react";
import {
  getTeamLogo,
  getMatchStatusText,
  getScoreDisplay,
  isMatchFinished,
  hasMatchStarted,
} from "../../lib/utils";

export default function MatchCard({ match, prediction, onPrediction }) {
  const { isAuthenticated, isLoading } = useAuth();

  const matchFinished = isMatchFinished(match.status);
  const matchStarted = hasMatchStarted(match.utcDate);
  const statusText = getMatchStatusText(match.status, match.utcDate);
  const score = getScoreDisplay(match.score, match.status);

  const handlePrediction = (predictionType) => {
    if (!isAuthenticated) return;
    onPrediction(match.id, predictionType);
  };

  const renderPredictionButton = (
    type,
    text,
    disabled = false,
    extraClasses = "mt-3"
  ) => {
    if (!isAuthenticated) {
      return (
        <button
          onClick={() => signIn("google")}
          className={`w-full ${extraClasses} py-2 px-3 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white`}
        >
          Sign in to predict
        </button>
      );
    }

    return (
      <button
        onClick={() => handlePrediction(type)}
        disabled={disabled || isLoading || matchStarted}
        className={`w-full ${extraClasses} py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
          prediction === type
            ? "bg-green-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        } ${
          disabled || isLoading || matchStarted
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {text}
      </button>
    );
  };

  if (matchFinished) {
    return (
      <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:bg-[#353535] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Premier League</span>
          <span className="text-xs text-gray-400">{statusText}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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

          <div className="flex items-center space-x-3">
            <span className="text-white">
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
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
          </div>
        </div>

        {prediction && isAuthenticated && (
          <div className="mt-4 p-3 bg-gray-600 bg-opacity-20 border border-gray-600 rounded-lg">
            <div className="text-center text-sm text-gray-400">
              Your prediction:{" "}
              {prediction === "home"
                ? match.homeTeam.shortName || match.homeTeam.name
                : prediction === "away"
                ? match.awayTeam.shortName || match.awayTeam.name
                : "Draw"}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:bg-[#353535] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">Premier League</span>
        <span className="text-xs text-gray-400">{statusText}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Home Team */}
        <div className="text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 relative flex items-center justify-center">
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
            <span className="text-sm text-white font-medium">
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
          </div>

          {renderPredictionButton("home", "Home Win")}
        </div>

        {/* VS Section */}
        <div className="text-center">
          <div className="text-gray-400 text-sm font-medium mb-4">VS</div>
          {renderPredictionButton("draw", "Draw", false, "")}
        </div>

        {/* Away Team */}
        <div className="text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 relative flex items-center justify-center">
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
            <span className="text-sm text-white font-medium">
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
          </div>

          {renderPredictionButton("away", "Away Win")}
        </div>
      </div>

      {matchStarted && (
        <div className="mt-4 p-3 bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg">
          <div className="text-center text-sm text-yellow-400">
            Match has started - predictions are locked
          </div>
        </div>
      )}

      {prediction && isAuthenticated && !matchStarted && (
        <div className="mt-4 p-3 bg-green-600 bg-opacity-20 border border-green-600 rounded-lg">
          <div className="text-center text-sm text-green-400">
            ✓ Prediction saved:{" "}
            {prediction === "home"
              ? match.homeTeam.shortName || match.homeTeam.name
              : prediction === "away"
              ? match.awayTeam.shortName || match.awayTeam.name
              : "Draw"}{" "}
            to win
          </div>
        </div>
      )}
    </div>
  );
}
