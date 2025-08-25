export default function WeekSelector({
  currentWeek,
  onWeekChange,
  totalWeeks = 38,
  currentMatchday = 1,
}) {
  // Generate array of weeks based on current matchday and surrounding weeks
  const getVisibleWeeks = () => {
    const start = Math.max(1, currentMatchday - 2);
    const end = Math.min(totalWeeks, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const weeks = getVisibleWeeks();

  const getWeekButtonStyle = (week) => {
    const isSelected = currentWeek === week;
    const isPast = week < currentMatchday;
    const isCurrent = week === currentMatchday;

    if (isSelected) {
      return "bg-green-600 text-white shadow-lg";
    }

    if (isPast) {
      return "bg-gray-600 text-gray-300 hover:bg-gray-500";
    }

    if (isCurrent) {
      return "bg-blue-600 text-white hover:bg-blue-500";
    }

    // upcoming
    return "bg-gray-700 text-gray-300 hover:bg-gray-600";
  };

  const getWeekLabel = (week) => {
    const isPast = week < currentMatchday;
    const isCurrent = week === currentMatchday;

    if (isPast) return `MD ${week} ✓`;
    if (isCurrent) return `MD ${week} ●`;
    return `MD ${week}`;
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-white">Matchday Selection</h2>
        <span className="text-sm text-gray-400">
          Current: MD {currentMatchday}
        </span>
      </div>
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {currentMatchday > 3 && (
          <button
            onClick={() => onWeekChange(Math.max(1, currentMatchday - 5))}
            className="px-3 py-2 rounded-lg text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            ←
          </button>
        )}

        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => onWeekChange(week)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${getWeekButtonStyle(
              week
            )}`}
          >
            {getWeekLabel(week)}
          </button>
        ))}

        {currentMatchday < totalWeeks - 2 && (
          <button
            onClick={() =>
              onWeekChange(Math.min(totalWeeks, currentMatchday + 5))
            }
            className="px-3 py-2 rounded-lg text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
