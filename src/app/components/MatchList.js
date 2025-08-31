import MatchCard from "./MatchCard";
import { formatMatchDate } from "../../lib/utils";

export default function MatchList({
  matches,
  scorePredictions,
  onScorePrediction,
}) {
  // Group matches by date
  const groupedMatches = matches.reduce((groups, match) => {
    // Use the formatted date from the API data
    const date = formatMatchDate(match.utcDate);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(match);
    return groups;
  }, {});

  // Get unique dates and sort them by the actual date
  const dates = Object.keys(groupedMatches).sort((a, b) => {
    // Get the first match from each group to compare actual dates
    const matchA = groupedMatches[a][0];
    const matchB = groupedMatches[b][0];
    return new Date(matchA.utcDate) - new Date(matchB.utcDate);
  });

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        const dayMatches = groupedMatches[date];

        return (
          <div key={date} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">
              {date}
            </h3>
            <div className="space-y-3">
              {dayMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  scorePrediction={scorePredictions[match.id]}
                  onScorePrediction={onScorePrediction}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
