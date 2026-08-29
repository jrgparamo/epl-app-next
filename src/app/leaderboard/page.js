"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import LeagueSelector from "../components/LeagueSelector";
import LeagueLeaderboard from "../components/LeagueLeaderboard";
import GlobalLeaderboard from "../components/GlobalLeaderboard";
import MemberPicksModal from "../components/MemberPicksModal";
import WeekSelector from "../components/WeekSelector";
import { useAuth } from "../components/AuthProvider";
import { usePoints } from "../components/PointsProvider";
import { getCurrentMatchday } from "@/lib/api";
import { LEAGUE_LEADERBOARDS_ENABLED } from "@/lib/features";

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { points } = usePoints();

  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentMatchday, setCurrentMatchday] = useState(null);
  const [selectedMatchday, setSelectedMatchday] = useState(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Reuses the client-cached matchday shared with the matches view (no new
  // request when already loaded). `selectedMatchday === null` means the Overall
  // (season) ranking; picking a matchday reranks to that week only.
  useEffect(() => {
    let cancelled = false;
    getCurrentMatchday()
      .then((md) => {
        if (!cancelled && md) {
          setCurrentMatchday(md);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const availableMatchdays = currentMatchday ? currentMatchday : 0;
  // Only past matchdays are immutable and safe to cache client-side.
  const leaderboardCacheable =
    selectedMatchday != null &&
    currentMatchday != null &&
    selectedMatchday < currentMatchday;
  // The modal always compares a concrete matchday; fall back to current when
  // the leaderboard is on Overall.
  const modalMatchday = selectedMatchday ?? currentMatchday;

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
          {/* League Leaderboards tab hidden until multi-league support returns */}
          {LEAGUE_LEADERBOARDS_ENABLED && (
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
          )}

          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={() => setSelectedMatchday(null)}
                className={`h-9 px-4 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                  selectedMatchday === null
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/70"
                }`}
              >
                Overall
              </button>
              <p className="text-xs text-muted-foreground">
                {selectedMatchday === null
                  ? "Season standings"
                  : `Ranked by Matchday ${selectedMatchday}`}
              </p>
            </div>
            {availableMatchdays >= 1 ? (
              <WeekSelector
                currentWeek={selectedMatchday}
                onWeekChange={setSelectedMatchday}
                totalWeeks={availableMatchdays}
                currentMatchday={currentMatchday}
              />
            ) : null}
          </div>

          {LEAGUE_LEADERBOARDS_ENABLED && !showGlobalLeaderboard ? (
            /* League selection and standings */
            <>
              <LeagueSelector
                onLeagueSelect={handleLeagueSelect}
                selectedLeagueId={selectedLeagueId}
              />
              <LeagueLeaderboard
                leagueId={selectedLeagueId}
                onUserSelect={setSelectedMember}
                matchday={selectedMatchday}
                cacheable={leaderboardCacheable}
              />
            </>
          ) : (
            /* Global Leaderboard — site-wide ranking across all leagues */
            <GlobalLeaderboard
              onUserSelect={setSelectedMember}
              matchday={selectedMatchday}
              cacheable={leaderboardCacheable}
            />
          )}
        </div>
      </main>

      <MemberPicksModal
        isOpen={!!selectedMember}
        userId={selectedMember?.user_id}
        displayName={selectedMember?.display_name}
        matchday={modalMatchday}
        currentMatchday={currentMatchday}
        onClose={() => setSelectedMember(null)}
      />

      <BottomNavigation
        activeTab="leaderboard"
        onTabChange={handleNavigationChange}
      />
    </div>
  );
}
