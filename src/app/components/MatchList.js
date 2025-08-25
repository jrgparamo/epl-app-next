import MatchCard from "./MatchCard";

export default function MatchList({ matches, predictions, onPrediction }) {
    // Group matches by date
    const groupedMatches = matches.reduce((groups, match) => {
        const date = match.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(match);
        return groups;
    }, {});

    // Get unique dates and sort them
    const dates = Object.keys(groupedMatches).sort(
        (a, b) => new Date(a) - new Date(b)
    );

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
                                    prediction={predictions[match.id]}
                                    onPrediction={onPrediction}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
