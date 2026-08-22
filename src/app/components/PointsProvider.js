"use client";

import { createContext, useContext } from "react";
import { useAuth } from "./AuthProvider";
import { useUserPoints } from "../../hooks/useUserPoints";

// Shares a single Season Total (DB-backed points) across every page so the
// Header badge is identical on matches, account, and leaderboard.
const PointsContext = createContext(null);

export default function PointsProvider({ children }) {
  const { user } = useAuth();
  const value = useUserPoints(user);
  return (
    <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (ctx === null) {
    return {
      points: 0,
      pointsData: null,
      loading: false,
      error: null,
      refetchPoints: () => {},
    };
  }
  return ctx;
}
