"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import MatchList from "./components/MatchList";
import WeekSelector from "./components/WeekSelector";
import BottomNavigation from "./components/BottomNavigation";
import SignInModal from "./components/SignInModal";
import { CacheIndicator } from "./components/CacheDebug";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { PredictionStats } from "./components/PredictionStats";
import { SyncStatusIndicator } from "./components/SyncStatusIndicator";
import { MatchdayHeader } from "./components/MatchdayHeader";
import { EmptyState } from "./components/EmptyState";
import { useAuth } from "./components/AuthProvider";
import { useMatches } from "../hooks/useMatches";
import { usePredictions } from "../hooks/usePredictions";
import { useCorrectPredictions } from "../hooks/useCorrectPredictions";
import { useUserPoints } from "../hooks/useUserPoints";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Show sign-in modal if user is not authenticated (after auth loading is complete)
  useEffect(() => {
    if (!authLoading && !user) {
      setShowSignInModal(true);
    }
  }, [user, authLoading]);

  const handleSignInSuccess = () => {
    setShowSignInModal(false);
  };

  const handleNavigationChange = (tabId) => {
    switch (tabId) {
      case "account":
        router.push("/account");
        break;
      case "leaderboard":
        router.push("/leaderboard");
        break;
      case "admin":
        router.push("/admin");
        break;
      case "matches":
        // Already on matches page, do nothing or scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      default:
        break;
    }
  };

  const {
    currentWeek,
    currentMatchday,
    matches,
    loading,
    error,
    handleWeekChange,
  } = useMatches();

  const {
    scorePredictions,
    syncError,
    retryQueueCount,
    handleScorePrediction,
    forceSyncPredictions,
  } = usePredictions(user);

  const { correctPredictions, totalCorrectPredictions } = useCorrectPredictions(
    user,
    matches,
    scorePredictions
  );

  // Use database-stored points (preferred) with fallback to local calculation
  const { points: databasePoints, loading: pointsLoading } =
    useUserPoints(user);
  const displayPoints =
    databasePoints !== undefined ? databasePoints : totalCorrectPredictions;

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header predictions={0} />
        <main className="container mx-auto px-4 py-8">
          <LoadingSpinner text="Loading..." />
        </main>
      </div>
    );
  }

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header predictions={displayPoints} />
        <main className="container mx-auto px-4 py-8">
          <LoadingSpinner text="Loading Premier League matches..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <Header predictions={displayPoints} />
        <main className="container mx-auto px-4 py-8">
          <ErrorDisplay error={error} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header predictions={displayPoints} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WeekSelector
          currentWeek={currentWeek}
          onWeekChange={handleWeekChange}
          currentMatchday={currentMatchday}
          totalWeeks={38}
        />

        <div className="mb-6">
          <MatchdayHeader
            currentWeek={currentWeek}
            currentMatchday={currentMatchday}
            loading={loading}
            matches={matches}
          />

          <PredictionStats
            user={user}
            correctPredictions={correctPredictions}
          />

          <SyncStatusIndicator
            syncError={syncError}
            retryQueueCount={retryQueueCount}
            isOnline={isOnline}
            user={user}
            forceSyncPredictions={forceSyncPredictions}
          />
        </div>

        {loading && <LoadingSpinner />}

        {!loading && matches.length > 0 && (
          <MatchList
            matches={matches}
            scorePredictions={scorePredictions}
            onScorePrediction={handleScorePrediction}
          />
        )}

        {!loading && matches.length === 0 && <EmptyState />}

        <div className="mt-8 text-center">
          <div className="text-xs text-gray-500">
            Premier League prediction app powered by Football Data API
          </div>
        </div>
      </main>

      {/* Cache indicator for development and debugging */}
      {process.env.NODE_ENV === "development" && <CacheIndicator />}

      <BottomNavigation
        activeTab="matches"
        onTabChange={handleNavigationChange}
      />

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSignInSuccess={handleSignInSuccess}
      />
    </div>
  );
}
