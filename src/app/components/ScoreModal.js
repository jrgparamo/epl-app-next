"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getTeamLogo } from "../../lib/utils";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

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

const getTeamColor = (teamName) => TEAM_COLORS[teamName] || "#555555";

const getContrastColor = (hexColor) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
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
      setShowExtended(false);
    }
  }, [isOpen, currentScore]);

  if (!team) return null;

  const teamColor = getTeamColor(team.name);
  const textColor = getContrastColor(teamColor);
  const isLight = textColor === "#000000";

  const handleScoreSelect = (score) => {
    setSelectedScore(score);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => {
      onScoreSelect(score);
      onClose();
    }, 150);
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      showSwipeHandle={true}
    >
      <DrawerContent>
        {/* Team-colored header */}
        <div
          className="px-4 pt-4 pb-5 text-center"
          style={{ backgroundColor: teamColor }}
        >
          <div className="w-14 h-14 mx-auto mb-3 relative flex items-center justify-center">
            <Image
              src={getTeamLogo(team.name)}
              alt={`${team.name} logo`}
              width={56}
              height={56}
              className="max-w-full max-h-full object-contain"
              style={{ width: "auto", height: "auto" }}
              onError={(e) => { e.target.src = "/team-logos/default.svg"; }}
            />
          </div>
          <DrawerTitle
            className="text-lg font-bold"
            style={{ color: textColor }}
          >
            {team.shortName || team.name}
          </DrawerTitle>
          <DrawerDescription
            className="text-xs opacity-75 mt-0.5"
            style={{ color: textColor }}
          >
            {matchInfo.homeTeam.shortName || matchInfo.homeTeam.name} vs{" "}
            {matchInfo.awayTeam.shortName || matchInfo.awayTeam.name}
          </DrawerDescription>
        </div>

        {/* Score grid */}
        <div className="p-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 10 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleScoreSelect(i)}
                className={cn(
                  "h-14 rounded-xl font-bold text-lg transition-all duration-150 active:scale-95 touch-manipulation border-2",
                  selectedScore === i
                    ? "bg-primary text-primary-foreground border-primary scale-105 shadow-md"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                )}
                style={{ minHeight: "48px", WebkitTapHighlightColor: "transparent" }}
              >
                {i}
              </button>
            ))}

            {/* +/− toggle */}
            <button
              onClick={() => setShowExtended((v) => !v)}
              className={cn(
                "h-14 rounded-xl font-bold text-lg transition-all duration-150 active:scale-95 touch-manipulation border-2",
                showExtended
                  ? "bg-muted text-muted-foreground border-border"
                  : "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30"
              )}
              style={{ minHeight: "48px", WebkitTapHighlightColor: "transparent" }}
            >
              {showExtended ? "−" : "+"}
            </button>

            {/* Extended scores 10–15 */}
            {showExtended &&
              Array.from({ length: 6 }, (_, i) => (
                <button
                  key={i + 10}
                  onClick={() => handleScoreSelect(i + 10)}
                  className={cn(
                    "h-14 rounded-xl font-bold text-lg transition-all duration-150 active:scale-95 touch-manipulation border-2",
                    selectedScore === i + 10
                      ? "bg-primary text-primary-foreground border-primary scale-105 shadow-md"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                  )}
                  style={{ minHeight: "48px", WebkitTapHighlightColor: "transparent" }}
                >
                  {i + 10}
                </button>
              ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
