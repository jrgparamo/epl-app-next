"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import LeagueManager from "../components/LeagueManager";
import LeagueLeaderboard from "../components/LeagueLeaderboard";
import { useAuth } from "../components/AuthProvider";
import { useCorrectPredictions } from "../../hooks/useCorrectPredictions";
import { useLeaderboard } from "../../hooks/useLeaderboard";

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { totalCorrectPredictions } = useCorrectPredictions(user, [], {});
  // const {
  //   leaderboard,
  //   loading: leaderboardLoading,
  //   error: leaderboardError,
  // } = useLeaderboard();

  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleNavigationChange = (tabId) => {
    switch (tabId) {
      case "matches":
        router.push("/");
        break;
      case "account":
        router.push("/account");
        break;
      case "leaderboard":
        // Already on leaderboard page, do nothing or scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      default:
        break;
    }
  };

  const handleLeagueSelect = (leagueId) => {
    setSelectedLeagueId(leagueId);
    setShowGlobalLeaderboard(false);
  };

  const showGlobal = () => {
    setSelectedLeagueId(null);
    setShowGlobalLeaderboard(true);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header predictions={0} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </main>
      </div>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header predictions={totalCorrectPredictions} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={showGlobal}
              className={`hidden px-4 py-2 rounded-lg transition-colors ${
                showGlobalLeaderboard
                  ? "bg-[#00c851] text-white"
                  : "bg-[#2d2d2d] text-[#b3b3b3] hover:bg-[#404040]"
              }`}
            >
              Global Leaderboard
            </button>
            <button
              onClick={() => setShowGlobalLeaderboard(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !showGlobalLeaderboard
                  ? "bg-[#00c851] text-white"
                  : "bg-[#2d2d2d] text-[#b3b3b3] hover:bg-[#404040]"
              }`}
            >
              League Leaderboards
            </button>
          </div>

          {showGlobalLeaderboard ? (
            /* Global Leaderboard */
            <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
              <h1 className="text-2xl font-bold mb-6">Global Leaderboard</h1>

              <div className="space-y-3">
                {leaderboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : leaderboardError ? (
                  <div className="text-center py-8">
                    <p className="text-red-400 mb-4">
                      Failed to load leaderboard
                    </p>
                    <p className="text-sm text-[#b3b3b3]">{leaderboardError}</p>
                  </div>
                ) : (
                  leaderboard.map((player) => (
                    <div
                      key={player.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        player.isCurrentUser || user?.id === player.user_id
                          ? "bg-opacity-20 border border-[#00c851] border-opacity-30"
                          : "bg-[#1a1a1a] hover:bg-[#404040] hover:bg-opacity-30"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            player.rank === 1
                              ? "bg-yellow-500 text-black"
                              : player.rank === 2
                              ? "bg-gray-400 text-black"
                              : player.rank === 3
                              ? "bg-orange-400 text-black"
                              : "bg-[#404040] text-white"
                          }`}
                        >
                          {player.rank}
                        </div>
                        <div>
                          <div className="font-medium">
                            {player.display_name}
                          </div>
                          {!player.isCurrentUser && (
                            <div className="text-sm text-[#b3b3b3]">
                              {player.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#00c851]">
                          {player.predictions}
                        </div>
                        <div className="text-sm text-[#b3b3b3]">correct</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-[#b3b3b3] text-center">
                  Rankings are updated after each matchday. Keep making
                  predictions to climb the leaderboard!
                </p>
              </div>
            </div>
          ) : (
            /* League Management and Leaderboards */
            <>
              <LeagueManager
                onLeagueSelect={handleLeagueSelect}
                selectedLeagueId={selectedLeagueId}
              />
              <LeagueLeaderboard leagueId={selectedLeagueId} />
            </>
          )}
        </div>
      </main>

      <BottomNavigation
        activeTab="leaderboard"
        onTabChange={handleNavigationChange}
      />
    </div>
  );
}
