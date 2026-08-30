import MatchCard from "./MatchCard";
import { Separator } from "@/components/ui/separator";
import { formatMatchDate } from "../../lib/utils";

export default function MatchList({
  matches,
  scorePredictions,
  onScorePrediction,
  matchday,
  currentMatchday,
}) {
  // Group matches by date
  const groupedMatches = matches.reduce((groups, match) => {
    const date = formatMatchDate(match.utcDate);
    if (!groups[date]) groups[date] = [];
    groups[date].push(match);
    return groups;
  }, {});

  // Sort dates by actual UTC time
  const dates = Object.keys(groupedMatches).sort((a, b) => {
    return (
      new Date(groupedMatches[a][0].utcDate) -
      new Date(groupedMatches[b][0].utcDate)
    );
  });

  return (
    <div className="space-y-4">
      {dates.map((date) => {
        const dayMatches = groupedMatches[date];
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {date}
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="space-y-2">
              {dayMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  scorePrediction={scorePredictions[match.id]}
                  onScorePrediction={onScorePrediction}
                  matchday={matchday}
                  currentMatchday={currentMatchday}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
