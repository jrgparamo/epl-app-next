"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getTeamLogo } from "../../lib/utils";

// Team color mappings
const TEAM_COLORS = {
  "Arsenal FC": "#DC143C",
  Arsenal: "#DC143C",
  "Aston Villa FC": "#7B003A",
  "Aston Villa": "#7B003A",
  "AFC Bournemouth": "#DA020E",
  Bournemouth: "#DA020E",
  "Brentford FC": "#E30613",
  Brentford: "#E30613",
  "Brighton & Hove Albion FC": "#0057B8",
  Brighton: "#0057B8",
  "Burnley FC": "#6C1D45",
  Burnley: "#6C1D45",
  "Chelsea FC": "#034694",
  Chelsea: "#034694",
  "Crystal Palace FC": "#1B458F",
  "Crystal Palace": "#1B458F",
  "Everton FC": "#003399",
  Everton: "#003399",
  "Nottingham Forest FC": "#DD0000",
  "Nottingham Forest": "#DD0000",
  "Fulham FC": "#000000",
  Fulham: "#000000",
  "Leeds United FC": "#FFFFFF",
  "Leeds United": "#FFFFFF",
  "Leicester City FC": "#003090",
  "Leicester City": "#003090",
  "Liverpool FC": "#C8102E",
  Liverpool: "#C8102E",
  "Manchester City FC": "#6CABDD",
  "Manchester City": "#6CABDD",
  "Manchester United FC": "#DA020E",
  "Manchester United": "#DA020E",
  "Newcastle United FC": "#241F20",
  "Newcastle United": "#241F20",
  "Sunderland AFC": "#EB172B",
  Sunderland: "#EB172B",
  "Tottenham Hotspur FC": "#132257",
  Tottenham: "#132257",
  "West Ham United FC": "#7A263A",
  "West Ham United": "#7A263A",
  "Wolverhampton Wanderers FC": "#FDB913",
  "Wolverhampton Wanderers": "#FDB913",
  Wolves: "#FDB913",
};

const getTeamColor = (teamName) => {
  return TEAM_COLORS[teamName] || "#666666";
};

const getContrastColor = (hexColor) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance using standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use a more conservative threshold for better readability
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
};

export default function ScoreModal({
  isOpen,
  onClose,
  team,
  currentScore,
  onScoreSelect,
  matchInfo,
}) {
  const [selectedScore, setSelectedScore] = useState(null);
  const [showExtended, setShowExtended] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedScore(currentScore);
      setShowExtended(false); // Always start with compact view
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      // Add escape key listener
      const handleEscapeKey = (event) => {
        if (event.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscapeKey);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isOpen, currentScore, onClose]);

  if (!isOpen) return null;

  const teamColor = getTeamColor(team.name);
  const textColor = getContrastColor(teamColor);
  const isLightTheme = textColor === "#000000";

  const handleScoreSelect = (score) => {
    setSelectedScore(score);

    // Add haptic feedback on mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Close modal with a slight delay for better UX
    setTimeout(() => {
      onScoreSelect(score);
      onClose();
    }, 150);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
        style={{ backgroundColor: teamColor }}
      >
        {/* Header */}
        <div className="p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold hover:scale-110 transition-transform border"
            style={{
              backgroundColor: isLightTheme
                ? "rgba(255,255,255,0.8)"
                : "rgba(0,0,0,0.7)",
              borderColor: isLightTheme
                ? "rgba(0,0,0,0.2)"
                : "rgba(255,255,255,0.3)",
              color: isLightTheme ? "#000000" : "#FFFFFF",
            }}
          >
            ×
          </button>

          <div className="w-16 h-16 mx-auto mb-4 relative flex items-center justify-center">
            <Image
              src={getTeamLogo(team.name)}
              alt={`${team.name} logo`}
              width={64}
              height={64}
              className="max-w-full max-h-full object-contain"
              style={{
                width: "auto",
                height: "auto",
                filter: isLightTheme ? "none" : "",
              }}
              onError={(e) => {
                e.target.src = "/team-logos/default.svg";
              }}
            />
          </div>

          <h2 className="text-xl font-bold mb-2" style={{ color: textColor }}>
            {team.shortName || team.name}
          </h2>
          <p className="text-sm opacity-80" style={{ color: textColor }}>
            Select score for {team.shortName || team.name}
          </p>
        </div>

        {/* Score Grid */}
        <div className="p-6 pt-0" style={{ backgroundColor: teamColor }}>
          <div className="grid grid-cols-3 gap-3">
            {/* Numbers 0-8 */}
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleScoreSelect(i)}
                className={`
                  w-full h-14 sm:h-12 rounded-lg font-bold text-lg transition-all duration-200 transform active:scale-95 touch-manipulation border-2
                  ${
                    selectedScore === i
                      ? "bg-white bg-opacity-95 scale-105 shadow-lg border-gray-400"
                      : "bg-white bg-opacity-80 hover:bg-opacity-90 active:bg-opacity-95 hover:shadow-md border-gray-300 hover:border-gray-400"
                  }
                `}
                style={{
                  color: "#000000", // Always black text
                  minHeight: "48px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {i}
              </button>
            ))}

            {/* Empty cell when not extended */}
            {!showExtended && <div></div>}

            {/* Number 9 button */}
            <button
              key={9}
              onClick={() => handleScoreSelect(9)}
              className={`
                w-full h-14 sm:h-12 rounded-lg font-bold text-lg transition-all duration-200 transform active:scale-95 touch-manipulation border-2
                ${
                  selectedScore === 9
                    ? "bg-white bg-opacity-95 scale-105 shadow-lg border-gray-400"
                    : "bg-white bg-opacity-80 hover:bg-opacity-90 active:bg-opacity-95 hover:shadow-md border-gray-300 hover:border-gray-400"
                }
              `}
              style={{
                color: "#000000", // Always black text
                minHeight: "48px",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              9
            </button>

            {/* Plus button to show more numbers */}
            {!showExtended && (
              <button
                onClick={() => setShowExtended(true)}
                className="w-full h-14 sm:h-12 rounded-lg font-bold text-lg transition-all duration-200 transform active:scale-95 touch-manipulation border-2 bg-blue-500 bg-opacity-80 hover:bg-opacity-90 active:bg-opacity-95 hover:shadow-md border-blue-400 hover:border-blue-500"
                style={{
                  color: "#FFFFFF",
                  minHeight: "48px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                +
              </button>
            )}

            {/* Additional numbers 10-15 when extended */}
            {showExtended &&
              Array.from({ length: 6 }, (_, i) => (
                <button
                  key={i + 10}
                  onClick={() => handleScoreSelect(i + 10)}
                  className={`
                  w-full h-14 sm:h-12 rounded-lg font-bold text-lg transition-all duration-200 transform active:scale-95 touch-manipulation border-2
                  ${
                    selectedScore === i + 10
                      ? "bg-white bg-opacity-95 scale-105 shadow-lg border-gray-400"
                      : "bg-white bg-opacity-80 hover:bg-opacity-90 active:bg-opacity-95 hover:shadow-md border-gray-300 hover:border-gray-400"
                  }
                `}
                  style={{
                    color: "#000000", // Always black text
                    minHeight: "48px",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {i + 10}
                </button>
              ))}

            {/* Collapse button when extended */}
            {showExtended && (
              <button
                onClick={() => setShowExtended(false)}
                className="w-full h-14 sm:h-12 rounded-lg font-bold text-lg transition-all duration-200 transform active:scale-95 touch-manipulation border-2 bg-gray-500 bg-opacity-80 hover:bg-opacity-90 active:bg-opacity-95 hover:shadow-md border-gray-400 hover:border-gray-500"
                style={{
                  color: "#FFFFFF",
                  minHeight: "48px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                −
              </button>
            )}
          </div>

          {/* Match Info */}
          <div
            className="mt-6 p-3 rounded-lg text-center text-sm border"
            style={{
              backgroundColor: isLightTheme
                ? "rgba(255,255,255,0.3)"
                : "rgba(0,0,0,0.3)",
              borderColor: isLightTheme
                ? "rgba(0,0,0,0.2)"
                : "rgba(255,255,255,0.2)",
              color: textColor,
            }}
          >
            <div className="font-medium">
              {matchInfo.homeTeam.shortName || matchInfo.homeTeam.name} vs{" "}
              {matchInfo.awayTeam.shortName || matchInfo.awayTeam.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
