export default function WeekSelector({ currentWeek, onWeekChange }) {
  const weeks = [1, 2, 3, 4, 5, 6];

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => onWeekChange(week)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              currentWeek === week
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Week {week}
          </button>
        ))}
      </div>
    </div>
  );
}
