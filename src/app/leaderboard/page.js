"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import LeagueManager from "../components/LeagueManager";
import LeagueLeaderboard from "../components/LeagueLeaderboard";
import GlobalLeaderboard from "../components/GlobalLeaderboard";
import { useAuth } from "../components/AuthProvider";
import { usePoints } from "../components/PointsProvider";

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { points } = usePoints();

  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState(true);

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
      <Header predictions={points} />

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
            /* Global Leaderboard — site-wide ranking across all leagues */
            <GlobalLeaderboard />
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
