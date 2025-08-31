export function MatchdayHeader({
  currentWeek,
  currentMatchday,
  loading,
  matches,
}) {
  const getMatchdayStatus = () => {
    if (currentWeek < currentMatchday) {
      return (
        <span className="ml-2 text-sm bg-gray-600 px-2 py-1 rounded">
          Completed
        </span>
      );
    }
    if (currentWeek > currentMatchday) {
      return (
        <span className="ml-2 text-sm bg-blue-600 px-2 py-1 rounded">
          Upcoming
        </span>
      );
    }
    return (
      <span className="ml-2 text-sm bg-green-600 px-2 py-1 rounded">
        Current
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">
        Matchday {currentWeek}
        {getMatchdayStatus()}
      </h2>
      <div className="text-sm text-gray-400">
        {loading && "Loading..."}
        {!loading && matches.length > 0 && `${matches.length} matches`}
      </div>
    </div>
  );
}
