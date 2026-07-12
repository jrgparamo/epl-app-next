"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import LeagueManager from "../components/LeagueManager";
import LeagueLeaderboard from "../components/LeagueLeaderboard";
import { useAuth } from "../components/AuthProvider";
import { useCorrectPredictions } from "../../hooks/useCorrectPredictions";

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { totalCorrectPredictions } = useCorrectPredictions(user, [], {});

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
      case "admin":
        router.push("/admin");
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
              className={`px-4 py-2 rounded-lg transition-colors ${
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
            /* Global Leaderboard — coming soon */
            <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
              <h1 className="text-2xl font-bold mb-6">Global Leaderboard</h1>
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="text-5xl">🏆</div>
                <p className="text-lg font-semibold text-white">Coming soon</p>
                <p className="text-sm text-[#b3b3b3] text-center max-w-xs">
                  A site-wide ranking across all players is on the way.
                  In the meantime, create or join a league to compete with friends.
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
