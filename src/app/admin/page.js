"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import ProtectedRoute from "../components/ProtectedRoute";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { hasMatchStarted, isMatchFinished } from "@/lib/utils";

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const router = useRouter();
  const { user } = useAuth();

  const handleNavigationChange = (tabId) => {
    switch (tabId) {
      case "matches":
        router.push("/");
        break;
      case "leaderboard":
        router.push("/leaderboard");
        break;
      case "account":
        router.push("/account");
        break;
      case "admin":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      default:
        break;
    }
  };
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPredictions, setUserPredictions] = useState({});
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/admin/check", {
          credentials: "same-origin",
        });
        const data = await response.json();
        setIsAdmin(data.isAdmin);
        if (!data.isAdmin) {
          setError("Access denied. Admin privileges required.");
        }
      } catch {
        setError("Failed to verify admin status");
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        const response = await fetch("/api/admin/users", {
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  // Fetch matches for prediction editing
  useEffect(() => {
    const fetchMatches = async () => {
      if (!isAdmin) return;

      try {
        const response = await fetch("/api/matches", {
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch matches");
        const data = await response.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      }
    };

    fetchMatches();
  }, [isAdmin]);

  // Fetch user predictions when user is selected
  const fetchUserPredictions = async (userId) => {
    try {
      const response = await fetch(`/api/predictions?userId=${userId}`, {
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Failed to fetch predictions");
      const data = await response.json();

      // Convert array to object for easier lookup
      const predictionsMap = {};
      data.forEach((prediction) => {
        predictionsMap[prediction.match_id] = prediction;
      });

      setUserPredictions(predictionsMap);
    } catch (err) {
      console.error("Failed to fetch user predictions:", err);
      setUserPredictions({});
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    fetchUserPredictions(userId);
  };

  const handlePredictionUpdate = async (matchId, homeScore, awayScore) => {
    if (!selectedUser) return;

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          matchId,
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
        }),
      });

      if (!response.ok) throw new Error("Failed to update prediction");

      // Refresh predictions
      fetchUserPredictions(selectedUser);
    } catch (err) {
      console.error("Failed to update prediction:", err);
      alert("Failed to update prediction: " + err.message);
    }
  };

  const handlePredictionDelete = async (matchId) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `/api/predictions?userId=${selectedUser}&matchId=${matchId}`,
        { method: "DELETE", credentials: "same-origin" },
      );

      if (!response.ok) throw new Error("Failed to delete prediction");

      // Refresh predictions
      fetchUserPredictions(selectedUser);
    } catch (err) {
      console.error("Failed to delete prediction:", err);
      alert("Failed to delete prediction: " + err.message);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header predictions={0} />
        <div className="container mx-auto px-4 pt-24">
          <ErrorDisplay error={error} />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header predictions={0} />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p>Admin privileges required to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header predictions={0} />
        <div className="container mx-auto px-4 pt-24">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header predictions={0} />
      <div className="container mx-auto px-4 pt-24 pb-20">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Users ({users.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedUser === user.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-medium">
                      {user.display_name ||
                        user.email?.split("@")[0] ||
                        "Anonymous"}
                    </div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Predictions */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <UserPredictionsManager
                userId={selectedUser}
                userName={
                  users.find((u) => u.id === selectedUser)?.display_name ||
                  users
                    .find((u) => u.id === selectedUser)
                    ?.email?.split("@")[0] ||
                  "Anonymous"
                }
                predictions={userPredictions}
                matches={matches}
                onPredictionUpdate={handlePredictionUpdate}
                onPredictionDelete={handlePredictionDelete}
              />
            ) : (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-center text-gray-400">
                  <h2 className="text-xl font-semibold mb-2">
                    Prediction Manager
                  </h2>
                  <p>Select a user to view and edit their predictions</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {user?.isAdmin && (
          <div className="mt-8">
            <MatchResultsManager />
          </div>
        )}
      </div>
      <BottomNavigation
        activeTab="admin"
        onTabChange={handleNavigationChange}
      />
    </div>
  );
}

function UserPredictionsManager({
  userName,
  predictions,
  matches,
  onPredictionUpdate,
  onPredictionDelete,
}) {
  const [editingMatch, setEditingMatch] = useState(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const startEdit = (matchId) => {
    const prediction = predictions[matchId];
    setEditingMatch(matchId);
    setHomeScore(prediction?.home_score?.toString() || "");
    setAwayScore(prediction?.away_score?.toString() || "");
  };

  const cancelEdit = () => {
    setEditingMatch(null);
    setHomeScore("");
    setAwayScore("");
  };

  const saveEdit = () => {
    if (editingMatch && homeScore !== "" && awayScore !== "") {
      onPredictionUpdate(editingMatch, homeScore, awayScore);
      cancelEdit();
    }
  };

  const handleDelete = (matchId) => {
    if (confirm("Are you sure you want to delete this prediction?")) {
      onPredictionDelete(matchId);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Predictions for {userName}</h2>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {matches.map((match) => {
          const prediction = predictions[match.id];
          const isEditing = editingMatch === match.id;

          return (
            <div
              key={match.id}
              className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">
                  Matchday {match.matchday}
                </div>
                <div className="font-medium">
                  {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(match.utcDate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-16 px-2 py-1 bg-gray-600 rounded text-center"
                      placeholder="H"
                      min="0"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-16 px-2 py-1 bg-gray-600 rounded text-center"
                      placeholder="A"
                      min="0"
                    />
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    {prediction ? (
                      <div className="text-center">
                        <div className="font-mono text-lg">
                          {prediction.home_score} - {prediction.away_score}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">No prediction</div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(match.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        {prediction ? "Edit" : "Add"}
                      </button>
                      {prediction && (
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Admin entry of final results. Prisma is the source of truth for finished
// matches, so this fills the gap when the football-data API leaves a played
// match stuck at TIMED with no score.
function MatchResultsManager() {
  const [matchday, setMatchday] = useState(1);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = async (md) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/matches?matchday=${md}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to load matches");
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      setMessage(err.message);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(matchday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (match, home, away) => {
    setSavingId(match.id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/match-result", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          matchday: match.matchday,
          homeScore: parseInt(home),
          awayScore: parseInt(away),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save result");
      setMessage(
        `Saved ${match.homeTeam.shortName} ${home}-${away} ${match.awayTeam.shortName} · ${data.pointsAwarded} pts awarded`,
      );
      await load(matchday);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-1">Match Results</h2>
      <p className="text-sm text-gray-400 mb-4">
        Enter or override a final score. Saved results are the source of truth
        and recompute points immediately.
      </p>

      <div className="flex items-center space-x-2 mb-4">
        <label className="text-sm text-gray-400">Matchday</label>
        <input
          type="number"
          min="1"
          max="38"
          value={matchday}
          onChange={(e) => setMatchday(Number(e.target.value))}
          className="w-20 px-2 py-1 bg-gray-600 rounded text-center"
        />
        <button
          onClick={() => load(matchday)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Load
        </button>
      </div>

      {message && <div className="text-sm mb-4 text-yellow-300">{message}</div>}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-3 max-h-[32rem] overflow-y-auto">
          {matches.map((match) => (
            <MatchResultRow
              key={match.id}
              match={match}
              saving={savingId === match.id}
              onSave={handleSave}
            />
          ))}
          {matches.length === 0 && (
            <div className="text-gray-500 text-sm">
              No matches for this matchday.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchResultRow({ match, saving, onSave }) {
  const finished = isMatchFinished(match.status);
  const started = hasMatchStarted(match.utcDate);
  const stuck = started && !finished;
  const ft = match.score?.fullTime || {};
  const [home, setHome] = useState(ft.home != null ? String(ft.home) : "");
  const [away, setAway] = useState(ft.away != null ? String(ft.away) : "");
  const canSave = home !== "" && away !== "" && !saving;

  return (
    <div
      className={`bg-gray-700 rounded-lg p-4 flex items-center justify-between ${
        stuck ? "ring-1 ring-yellow-500/60" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-400 mb-1">
          {new Date(match.utcDate).toLocaleString()} ·{" "}
          {finished ? "Finished" : stuck ? "Stuck — no result" : match.status}
        </div>
        <div className="font-medium truncate">
          {match.homeTeam.shortName} vs {match.awayTeam.shortName}
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <input
          type="number"
          min="0"
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-14 px-2 py-1 bg-gray-600 rounded text-center"
          placeholder="H"
        />
        <span>-</span>
        <input
          type="number"
          min="0"
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-14 px-2 py-1 bg-gray-600 rounded text-center"
          placeholder="A"
        />
        <button
          disabled={!canSave}
          onClick={() => onSave(match, home, away)}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
