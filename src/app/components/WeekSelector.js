export default function WeekSelector({ currentWeek, onWeekChange, getWeekStatus }) {
  const weeks = [1, 2, 3, 4, 5];

  const getWeekButtonStyle = (week) => {
    const status = getWeekStatus(week);
    const isSelected = currentWeek === week;
    
    if (isSelected) {
      return 'bg-green-600 text-white shadow-lg';
    }
    
    if (status === 'completed') {
      return 'bg-gray-600 text-gray-300 hover:bg-gray-500';
    }
    
    if (status === 'current') {
      return 'bg-blue-600 text-white hover:bg-blue-500';
    }
    
    // upcoming
    return 'bg-gray-700 text-gray-300 hover:bg-gray-600';
  };

  const getWeekLabel = (week) => {
    const status = getWeekStatus(week);
    if (status === 'completed') return `Week ${week} ✓`;
    if (status === 'current') return `Week ${week} ●`;
    return `Week ${week}`;
  };

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {weeks.map((week) => (
          <button
            key={week}
            onClick={() => onWeekChange(week)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${getWeekButtonStyle(week)}`}
          >
            {getWeekLabel(week)}
          </button>
        ))}
      </div>
    </div>
  );
}
