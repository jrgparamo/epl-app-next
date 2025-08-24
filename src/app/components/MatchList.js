import MatchCard from './MatchCard';

export default function MatchList({ matches, selectedLeague }) {
  // Filter matches by selected league
  const filteredMatches = selectedLeague === 'all' 
    ? matches 
    : matches.filter(match => {
        const leagueMap = {
          'premier-league': 'Premier League',
          'laliga': 'LaLiga',
          'bundesliga': 'Bundesliga'
        };
        return match.league === leagueMap[selectedLeague];
      });

  // Group matches by date
  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const date = match.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(match);
    return groups;
  }, {});

  // Define the order of dates
  const dateOrder = ['Friday, August 22', 'Yesterday', 'Today'];

  return (
    <div className="space-y-6">
      {dateOrder.map((date) => {
        const dayMatches = groupedMatches[date];
        if (!dayMatches || dayMatches.length === 0) return null;

        return (
          <div key={date} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">
              {date}
            </h3>
            <div className="space-y-3">
              {dayMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
