"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import ScoreModal from "./ScoreModal";
import { cn } from "@/lib/utils";
import {
  getTeamLogo,
  getMatchStatusText,
  getScoreDisplay,
  isMatchFinished,
  hasMatchStarted,
} from "../../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function TeamLogo({ name, size = 40 }) {
  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={getTeamLogo(name)}
        alt={`${name} logo`}
        fill
        className="object-contain"
        onError={(e) => {
          e.target.src = "/team-logos/default.svg";
        }}
      />
    </div>
  );
}

function getPredictionResult(match, scorePrediction) {
  if (!isMatchFinished(match.status) || !scorePrediction) return null;
  if (scorePrediction.home === null || scorePrediction.away === null)
    return null;

  const { fullTime } = match.score;
  const isExactScore =
    fullTime.home === scorePrediction.home &&
    fullTime.away === scorePrediction.away;

  let derivedPrediction;
  if (scorePrediction.home > scorePrediction.away) derivedPrediction = "home";
  else if (scorePrediction.away > scorePrediction.home)
    derivedPrediction = "away";
  else derivedPrediction = "draw";

  let actualResult;
  if (fullTime.home > fullTime.away) actualResult = "home";
  else if (fullTime.away > fullTime.home) actualResult = "away";
  else actualResult = "draw";

  const isResultCorrect = derivedPrediction === actualResult;

  if (isExactScore) return "exact";
  if (isResultCorrect) return "result";
  return "wrong";
}

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

  useEffect(() => {
    if (scorePrediction) {
      setHomeScore(scorePrediction.home?.toString() || "");
      setAwayScore(scorePrediction.away?.toString() || "");
    }
  }, [scorePrediction]);

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

    if (modalTeamType === "home" && awayScore === "") {
      setTimeout(() => {
        setModalTeam(match.awayTeam);
        setModalTeamType("away");
        setModalOpen(true);
      }, 300);
    } else if (modalTeamType === "away" && homeScore === "") {
      setTimeout(() => {
        setModalTeam(match.homeTeam);
        setModalTeamType("home");
        setModalOpen(true);
      }, 300);
    }

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
  const predictionResult = getPredictionResult(match, scorePrediction);

  const homeShort = match.homeTeam.shortName || match.homeTeam.name;
  const awayShort = match.awayTeam.shortName || match.awayTeam.name;

  return (
    <Card
      className={cn(
        "border transition-colors",
        predictionResult === "exact" &&
          "border-prediction-correct bg-prediction-correct/10",
        predictionResult === "result" &&
          "border-prediction-correct/50 bg-prediction-correct/5",
        predictionResult === "wrong" &&
          "border-prediction-wrong/50 bg-prediction-wrong/5",
      )}
    >
      <CardContent className="px-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">Premier League</span>
          <div className="flex items-center gap-1.5">
            {(match.status === "IN_PLAY" || match.status === "PAUSED") && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                LIVE
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{statusText}</span>
          </div>
        </div>

        {/* Match row */}
        {matchFinished ? (
          /* Finished: compact inline layout */
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamLogo name={match.homeTeam.name} size={32} />
              <span className="text-sm font-semibold truncate">
                {homeShort}
              </span>
            </div>
            <div className="flex items-center gap-2 px-2 shrink-0">
              <span className="text-lg font-bold tabular-nums">
                {score.home}
              </span>
              <span className="text-muted-foreground text-sm">–</span>
              <span className="text-lg font-bold tabular-nums">
                {score.away}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-semibold truncate text-right">
                {awayShort}
              </span>
              <TeamLogo name={match.awayTeam.name} size={32} />
            </div>
          </div>
        ) : (
          /* Upcoming/Live: larger logos, VS divider */
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <TeamLogo name={match.homeTeam.name} size={48} />
              <span className="text-sm font-semibold text-center truncate w-full">
                {homeShort}
              </span>
            </div>
            <span className="text-muted-foreground font-medium text-sm shrink-0">
              vs
            </span>
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <TeamLogo name={match.awayTeam.name} size={48} />
              <span className="text-sm font-semibold text-center truncate w-full">
                {awayShort}
              </span>
            </div>
          </div>
        )}

        {/* Prediction result badge */}
        {predictionResult && scorePrediction && isAuthenticated && (
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Your pick: {scorePrediction.home} – {scorePrediction.away}
            </span>
            {predictionResult === "exact" && (
              <Badge className="bg-prediction-correct/20 text-prediction-correct border-prediction-correct/30 border text-xs">
                Exact ✓
              </Badge>
            )}
            {predictionResult === "result" && (
              <Badge className="bg-prediction-correct/10 text-prediction-correct border-prediction-correct/20 border text-xs">
                Result ✓
              </Badge>
            )}
            {predictionResult === "wrong" && (
              <Badge className="bg-prediction-wrong/10 text-prediction-wrong border-prediction-wrong/20 border text-xs">
                Wrong ✗
              </Badge>
            )}
          </div>
        )}

        {/* No pick made — finished match, authenticated */}
        {matchFinished &&
          isAuthenticated &&
          (!scorePrediction ||
            scorePrediction.home === null ||
            scorePrediction.away === null) && (
            <div className="mt-2.5">
              <span className="text-xs text-muted-foreground">
                No pick made
              </span>
            </div>
          )}

        {/* Prediction input — upcoming matches, authenticated */}
        {isAuthenticated && !matchStarted && !matchFinished && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {homeShort}
                </span>
                <Button
                  variant={homeScore !== "" ? "default" : "outline"}
                  size="sm"
                  className="w-14 h-11 text-base font-semibold touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  onClick={() => openScoreModal(match.homeTeam, "home")}
                >
                  {homeScore !== "" ? homeScore : "?"}
                </Button>
              </div>
              <span className="text-muted-foreground text-sm mt-4">–</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {awayShort}
                </span>
                <Button
                  variant={awayScore !== "" ? "default" : "outline"}
                  size="sm"
                  className="w-14 h-11 text-base font-semibold touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  onClick={() => openScoreModal(match.awayTeam, "away")}
                >
                  {awayScore !== "" ? awayScore : "?"}
                </Button>
              </div>
            </div>
            {homeScore !== "" && awayScore !== "" && (
              <p className="text-center text-xs text-prediction-correct mt-1.5">
                Prediction saved
              </p>
            )}
            {(homeScore !== "" || awayScore !== "") &&
              !(homeScore !== "" && awayScore !== "") && (
                <p className="text-center text-xs text-muted-foreground mt-1.5">
                  Tap to set {homeScore === "" ? "home" : "away"} score
                </p>
              )}
          </div>
        )}

        {/* Unauthenticated nudge */}
        {!isAuthenticated && !matchFinished && (
          <div className="mt-3 pt-3 border-t border-border text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => (window.location.href = "/")}
            >
              Sign in to predict
            </Button>
          </div>
        )}

        {/* Match started — locked */}
        {matchStarted && !matchFinished && isAuthenticated && (
          <div className="mt-3 pt-3 border-t border-border text-center">
            {scorePrediction &&
              scorePrediction.home !== null &&
              scorePrediction.away !== null && (
                <p className="text-xs text-muted-foreground mb-1">
                  Your pick: {scorePrediction.home} – {scorePrediction.away}
                </p>
              )}
            <span className="text-xs text-muted-foreground">
              Match started — predictions locked
            </span>
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
