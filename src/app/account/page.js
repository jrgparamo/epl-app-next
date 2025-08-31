"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { useAuth } from "../components/AuthProvider";
import { useCorrectPredictions } from "../../hooks/useCorrectPredictions";

export default function AccountPage() {
  const { user, signOut, loading } = useAuth();
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
      case "leaderboard":
        router.push("/leaderboard");
        break;
      case "account":
        // Already on account page, do nothing or scroll to top
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

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header predictions={totalCorrectPredictions} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-6">
          <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-4">Account</h1>

            {user ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#b3b3b3] mb-1">
                    Email
                  </label>
                  <div className="text-lg">{user.email}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#b3b3b3] mb-1">
                    Total Correct Predictions
                  </label>
                  <div className="text-lg text-[#00c851]">
                    {totalCorrectPredictions}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#404040]">
                  <button
                    onClick={signOut}
                    className="bg-[#ff4444] hover:bg-[#ff6666] text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#b3b3b3] mb-4">You are not signed in</p>
                <Link
                  href="/"
                  className="bg-[#00c851] hover:bg-[#00a844] text-white px-6 py-2 rounded-lg transition-colors inline-block"
                >
                  Go to Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNavigation
        activeTab="account"
        onTabChange={handleNavigationChange}
      />
    </div>
  );
}
