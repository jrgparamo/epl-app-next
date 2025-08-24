"use client";

import Image from "next/image";

export default function MatchCard({ match, prediction, onPrediction }) {
  const handlePrediction = (predictionType) => {
    onPrediction(match.id, predictionType);
  };

  if (match.status === "finished") {
    return (
      <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:bg-[#353535] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">{match.league}</span>
          <span className="text-xs text-gray-400">{match.time}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className=" relative flex-shrink-0">
              <Image
                src={match.homeTeam.logo}
                alt={`${match.homeTeam.name} logo`}
                width={32}
                height={32}
                className=""
              />
            </div>
            <span className="text-white">{match.homeTeam.name}</span>
          </div>

          <div className="flex items-center space-x-4 text-lg font-bold">
            <span className="text-white">{match.homeScore}</span>
            <span className="text-gray-400">-</span>
            <span className="text-white">{match.awayScore}</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-white">{match.awayTeam.name}</span>
            <div className=" relative flex-shrink-0">
              <Image
                src={match.awayTeam.logo}
                alt={`${match.awayTeam.name} logo`}
                width={32}
                height={32}
                className=""
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:bg-[#353535] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">{match.league}</span>
        <span className="text-xs text-gray-400">{match.time}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Home Team */}
        <div className="text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Image
                src={match.homeTeam.logo}
                alt={`${match.homeTeam.name} logo`}
                width={64}
                height={64}
                className=""
              />
            </div>
            <span className="text-sm text-white font-medium">
              {match.homeTeam.name}
            </span>
          </div>

          <button
            onClick={() => handlePrediction("home")}
            className={`w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              prediction === "home"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            W {match.homeProbability}%
          </button>

          <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">Win probability</div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${match.homeProbability}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* VS Section */}
        <div className="text-center">
          <div className="text-gray-400 text-sm font-medium mb-4">VS</div>
          <button
            onClick={() => handlePrediction("draw")}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              prediction === "draw"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Draw {100 - match.homeProbability - match.awayProbability}%
          </button>
        </div>

        {/* Away Team */}
        <div className="text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Image
                src={match.awayTeam.logo}
                alt={`${match.awayTeam.name} logo`}
                width={64}
                height={64}
                className=""
              />
            </div>
            <span className="text-sm text-white font-medium">
              {match.awayTeam.name}
            </span>
          </div>

          <button
            onClick={() => handlePrediction("away")}
            className={`w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              prediction === "away"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            W {match.awayProbability}%
          </button>

          <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">Win probability</div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${match.awayProbability}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {prediction && (
        <div className="mt-4 p-3 bg-green-600 bg-opacity-20 border border-green-600 rounded-lg">
          <div className="text-center text-sm text-green-400">
            ✓ Prediction saved:{" "}
            {prediction === "home"
              ? match.homeTeam.name
              : prediction === "away"
              ? match.awayTeam.name
              : "Draw"}{" "}
            to win
          </div>
        </div>
      )}
    </div>
  );
}
