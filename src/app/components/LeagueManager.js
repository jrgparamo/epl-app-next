"use client";

import { useState } from "react";
import { useLeagues } from "../../hooks/useLeagues";
import QRCodeModal from "./QRCodeModal";

export default function LeagueManager({ onLeagueSelect, selectedLeagueId }) {
  const { leagues, loading, error, createLeague, joinLeague, deleteLeague } =
    useLeagues();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [joinCode, setJoinCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    joinCode: "",
    leagueName: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    leagueId: "",
    leagueName: "",
  });

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const newLeague = await createLeague(
        createForm.name,
        createForm.description
      );
      setCreateForm({ name: "", description: "" });
      setShowCreateForm(false);
      // Auto-select the newly created league
      onLeagueSelect(newLeague.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const joinedLeague = await joinLeague(joinCode.trim());
      setJoinCode("");
      setShowJoinForm(false);
      // Auto-select the newly joined league
      onLeagueSelect(joinedLeague.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyJoinCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy join code:", err);
    }
  };

  const showQRCode = (code, name) => {
    setQrModal({
      isOpen: true,
      joinCode: code,
      leagueName: name,
    });
  };

  const showDeleteConfirmation = (leagueId, leagueName) => {
    setDeleteModal({
      isOpen: true,
      leagueId: leagueId,
      leagueName: leagueName,
    });
  };

  const handleDeleteLeague = async () => {
    if (!deleteModal.leagueId) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await deleteLeague(deleteModal.leagueId);

      // If the deleted league was selected, deselect it
      if (selectedLeagueId === deleteModal.leagueId) {
        onLeagueSelect(null);
      }

      setDeleteModal({ isOpen: false, leagueId: "", leagueName: "" });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Your Leagues</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowJoinForm(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Join League
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 py-1 bg-[#00c851] hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
          >
            Create League
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{actionError}</p>
        </div>
      )}

      {/* Create League Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#404040] rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Create New League</h3>
          <form onSubmit={handleCreateLeague} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                League Name
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#404040] rounded-lg text-white placeholder-gray-400 focus:border-[#00c851] focus:outline-none"
                placeholder="Enter league name"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#404040] rounded-lg text-white placeholder-gray-400 focus:border-[#00c851] focus:outline-none"
                placeholder="Describe your league"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={actionLoading || !createForm.name.trim()}
                className="px-4 py-2 bg-[#00c851] hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {actionLoading ? "Creating..." : "Create League"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ name: "", description: "" });
                  setActionError(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join League Form */}
      {showJoinForm && (
        <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#404040] rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Join League</h3>
          <form onSubmit={handleJoinLeague} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Join Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-[#2d2d2d] border border-[#404040] rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter 6-character join code"
                maxLength={6}
                required
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={actionLoading || !joinCode.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {actionLoading ? "Joining..." : "Join League"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowJoinForm(false);
                  setJoinCode("");
                  setActionError(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leagues List */}
      {leagues.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#b3b3b3] mb-4">
            You haven&apos;t joined any leagues yet
          </p>
          <p className="text-sm text-[#888]">
            Create a league or join one with a code to start competing!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map((league) => (
            <div
              key={league.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedLeagueId === league.id
                  ? "bg-opacity-20 border-[#00c851] border-opacity-50"
                  : "bg-[#1a1a1a] border-[#404040] hover:border-[#606060]"
              }`}
              onClick={() => onLeagueSelect(league.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{league.name}</h3>
                <div className="flex items-center space-x-2">
                  {league.isAdmin && (
                    <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
                      Admin
                    </span>
                  )}
                  {league.isCreator && (
                    <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">
                      Creator
                    </span>
                  )}
                </div>
              </div>

              {league.description && (
                <p className="text-sm text-[#b3b3b3] mb-3">
                  {league.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#888]">
                  Joined {new Date(league.joinedAt).toLocaleDateString()}
                </span>

                {(league.isCreator || league.isAdmin) && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[#b3b3b3]">
                      Code: {league.joinCode}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyJoinCode(league.joinCode);
                      }}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showQRCode(league.joinCode, league.name);
                      }}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                    >
                      QR
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(league.id, league.name);
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() =>
          setQrModal({ isOpen: false, joinCode: "", leagueName: "" })
        }
        joinCode={qrModal.joinCode}
        leagueName={qrModal.leagueName}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-400">Delete League</h3>
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    leagueId: "",
                    leagueName: "",
                  })
                }
                className="text-[#b3b3b3] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[#b3b3b3]">
                Are you sure you want to delete the league{" "}
                <span className="font-semibold text-white">
                  &quot;{deleteModal.leagueName}&quot;
                </span>
                ?
              </p>

              <p className="text-sm text-red-400">
                This action cannot be undone. All members will be removed and
                the league data will be permanently deleted.
              </p>

              {actionError && (
                <div className="p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{actionError}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={handleDeleteLeague}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {actionLoading ? "Deleting..." : "Delete League"}
                </button>
                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: false,
                      leagueId: "",
                      leagueName: "",
                    })
                  }
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
