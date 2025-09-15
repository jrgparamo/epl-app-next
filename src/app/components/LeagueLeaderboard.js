"use client";

import { useLeagueLeaderboard } from "../../hooks/useLeagues";

export default function LeagueLeaderboard({ leagueId }) {
  const { leaderboard, league, loading, error } =
    useLeagueLeaderboard(leagueId);

  if (!leagueId) {
    return (
      <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
        <div className="text-center py-8">
          <p className="text-[#b3b3b3] mb-2">
            Select a league to view leaderboard
          </p>
          <p className="text-sm text-[#888]">
            Choose from your leagues above to see how you stack up!
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">Failed to load league leaderboard</p>
          <p className="text-sm text-[#b3b3b3]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
      {/* League Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">{league?.name}</h2>
          <div className="text-sm text-[#b3b3b3]">
            {league?.memberCount} / {league?.maxMembers} members
          </div>
        </div>

        {league?.description && (
          <p className="text-[#b3b3b3] mb-3">{league.description}</p>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-[#888]">League Code: {league?.joinCode}</span>
          <button
            onClick={() => navigator.clipboard.writeText(league?.joinCode)}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
          >
            Copy Code
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-4">Leaderboard</h3>

        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#b3b3b3] mb-2">
              No predictions yet in this league
            </p>
            <p className="text-sm text-[#888]">
              Be the first to make predictions and climb the leaderboard!
            </p>
          </div>
        ) : (
          leaderboard.map((player) => (
            <div
              key={player.user_id}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                player.isCurrentUser
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
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{player.display_name}</span>
                    {player.isAdmin && (
                      <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  {!player.isCurrentUser && (
                    <div className="text-sm text-[#b3b3b3]">{player.email}</div>
                  )}
                  <div className="text-xs text-[#888]">
                    Joined {new Date(player.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-[#00c851]">
                  {player.points}
                </div>
                <div className="text-sm text-[#b3b3b3]">points</div>
                <div className="text-xs text-[#888]">
                  {player.correct_predictions}/{player.matches_predicted}{" "}
                  correct
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg">
        <p className="text-sm text-[#b3b3b3] text-center">
          Rankings are updated after each matchday. Keep making predictions to
          climb your league leaderboard!
        </p>
      </div>
    </div>
  );
}
