"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { useAuth } from "../components/AuthProvider";
import { useCorrectPredictions } from "../../hooks/useCorrectPredictions";

export default function AccountPage() {
  const { user, signOut, loading, refreshUser } = useAuth();
  const router = useRouter();
  const { totalCorrectPredictions } = useCorrectPredictions(user, [], {});

  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Initialize display name directly from user auth data
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || "");
    }
  }, [user]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSaveDisplayName = async () => {
    setSaveLoading(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          displayName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update display name");
      }

      // The user object will be updated by Supabase auth automatically
      // Refresh the auth state to get updated metadata
      await refreshUser();

      setIsEditing(false);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(user?.user_metadata?.display_name || "");
    setIsEditing(false);
    setSaveError(null);
  };
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
                    Display Name
                  </label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        maxLength={50}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white placeholder-[#b3b3b3] focus:outline-none focus:border-[#00c851]"
                      />
                      {saveError && (
                        <div className="text-red-400 text-sm">{saveError}</div>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveDisplayName}
                          disabled={saveLoading}
                          className="bg-[#00c851] hover:bg-[#00a844] disabled:bg-[#404040] text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          {saveLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saveLoading}
                          className="bg-[#404040] hover:bg-[#555555] disabled:bg-[#333333] text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-lg">
                        {user?.user_metadata?.display_name || "Not set"}
                      </div>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#404040] hover:bg-[#555555] text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
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
