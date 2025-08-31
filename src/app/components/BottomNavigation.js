"use client";

const BottomNavigation = ({ activeTab = "matches", onTabChange }) => {
  const tabs = [
    {
      id: "account",
      label: "Account",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "matches",
      label: "Matches",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v8m-4-4h8"
          />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  const handleTabClick = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <nav className="bg-[#2d2d2d] border border-[#404040] rounded-2xl shadow-lg backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-around py-3 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[#113620a6] bg-opacity-20 text-[#00c851]"
                  : "text-[#b3b3b3] hover:text-white hover:bg-[#404040] hover:bg-opacity-50"
              }`}
            >
              <div className="mb-1">{tab.icon}</div>
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavigation;
