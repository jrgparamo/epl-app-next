import { useState, useEffect } from "react";

export function useLeagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeagues = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/leagues");

      if (!response.ok) {
        throw new Error("Failed to fetch leagues");
      }

      const data = await response.json();
      setLeagues(data);
    } catch (err) {
      console.error("Error fetching leagues:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createLeague = async (name, description) => {
    setError(null);

    try {
      const response = await fetch("/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create league");
      }

      const newLeague = await response.json();
      setLeagues((prev) => [...prev, newLeague]);
      return newLeague;
    } catch (err) {
      console.error("Error creating league:", err);
      setError(err.message);
      throw err;
    }
  };

  const joinLeague = async (joinCode) => {
    setError(null);

    try {
      const response = await fetch("/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ joinCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join league");
      }

      const joinedLeague = await response.json();
      setLeagues((prev) => [...prev, joinedLeague]);
      return joinedLeague;
    } catch (err) {
      console.error("Error joining league:", err);
      setError(err.message);
      throw err;
    }
  };

  const deleteLeague = async (leagueId) => {
    setError(null);

    try {
      const response = await fetch(`/api/leagues?leagueId=${leagueId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete league");
      }

      // Remove the league from local state
      setLeagues((prev) => prev.filter((league) => league.id !== leagueId));
      return true;
    } catch (err) {
      console.error("Error deleting league:", err);
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  return {
    leagues,
    loading,
    error,
    createLeague,
    joinLeague,
    deleteLeague,
    refetchLeagues: fetchLeagues,
  };
}

export function useLeagueLeaderboard(leagueId) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeagueLeaderboard = async () => {
      if (!leagueId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/leagues/${leagueId}/leaderboard`);

        if (!response.ok) {
          throw new Error("Failed to fetch league leaderboard");
        }

        const data = await response.json();
        setLeaderboard(data.leaderboard);
        setLeague(data.league);
      } catch (err) {
        console.error("Error fetching league leaderboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueLeaderboard();
  }, [leagueId]);

  return {
    leaderboard,
    league,
    loading,
    error,
    refetchLeaderboard: () => {
      const fetchLeagueLeaderboard = async () => {
        if (!leagueId) return;

        setLoading(true);
        setError(null);

        try {
          const response = await fetch(`/api/leagues/${leagueId}/leaderboard`);

          if (!response.ok) {
            throw new Error("Failed to fetch league leaderboard");
          }

          const data = await response.json();
          setLeaderboard(data.leaderboard);
          setLeague(data.league);
        } catch (err) {
          console.error("Error fetching league leaderboard:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchLeagueLeaderboard();
    },
  };
}
