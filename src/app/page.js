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
import { usePoints } from "./components/PointsProvider";
import { useMatches } from "../hooks/useMatches";
import { usePredictions } from "../hooks/usePredictions";
import { useCorrectPredictions } from "../hooks/useCorrectPredictions";
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

  const { correctPredictions } = useCorrectPredictions(
    user,
    matches,
    scorePredictions,
  );

  // Season Total comes from the shared, DB-backed points source (see PointsProvider).
  const { points: displayPoints } = usePoints();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header predictions={0} />
        <main className="max-w-md mx-auto px-4 py-8">
          <LoadingSpinner text="Loading..." />
        </main>
      </div>
    );
  }

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header predictions={displayPoints} />
        <main className="max-w-md mx-auto px-4 py-8">
          <LoadingSpinner text="Loading matches..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header predictions={displayPoints} />
        <main className="max-w-md mx-auto px-4 py-6">
          <ErrorDisplay error={error} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header predictions={displayPoints} />

      <main className="max-w-md mx-auto px-3 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <WeekSelector
          currentWeek={currentWeek}
          onWeekChange={handleWeekChange}
          currentMatchday={currentMatchday}
          totalWeeks={38}
        />

        <div className="space-y-2 mb-4">
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
      </main>

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
