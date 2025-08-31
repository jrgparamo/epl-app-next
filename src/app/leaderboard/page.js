"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { useAuth } from "../components/AuthProvider";
import { useCorrectPredictions } from "../../hooks/useCorrectPredictions";

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { totalCorrectPredictions } = useCorrectPredictions(user, [], {});

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

  // Mock leaderboard data - in a real app this would come from your API
  const mockLeaderboard = [
    { rank: 1, name: "Jorge", email: "jorge@example.com", predictions: 25 },
    { rank: 2, name: "Ricardo", email: "ricardo@example.com", predictions: 23 },
    { rank: 3, name: "Eric", email: "eric@example.com", predictions: 20 },
    { rank: 4, name: "Rob", email: "rob@example.com", predictions: 18 },
    { rank: 5, name: "Ray", email: "ray@example.com", predictions: 15 },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header predictions={totalCorrectPredictions} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-6">
          <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

            <div className="space-y-3">
              {mockLeaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    user?.email === player.email
                      ? "bg-[#00c851] bg-opacity-20 border border-[#00c851] border-opacity-30"
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
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-[#b3b3b3]">
                        {player.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#00c851]">
                      {player.predictions}
                    </div>
                    <div className="text-sm text-[#b3b3b3]">correct</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-sm text-[#b3b3b3] text-center">
                Rankings are updated after each matchday. Keep making
                predictions to climb the leaderboard!
              </p>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation
        activeTab="leaderboard"
        onTabChange={handleNavigationChange}
      />
    </div>
  );
}
