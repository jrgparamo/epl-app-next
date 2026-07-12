"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  RiUser3Line,
  RiFootballLine,
  RiBarChartLine,
  RiShieldLine,
} from "@remixicon/react";
import { useAuth, adminCacheKey } from "./AuthProvider";

/**
 * Read the cached admin flag from localStorage synchronously.
 * Returns null when no cache exists (first visit or SSR).
 */
function readAdminCache(userId) {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(adminCacheKey(userId));
    return raw !== null ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const BottomNavigation = ({ activeTab = "matches", onTabChange }) => {
  const { user, loading } = useAuth();

  // Seed from localStorage synchronously so the tab count is stable on first
  // paint. Falls back to false when no cache exists (true cold first visit).
  const [isAdmin, setIsAdmin] = useState(() => readAdminCache(user?.id) ?? false);

  useEffect(() => {
    if (loading) return;
    // Session resolved — authoritative value from the session, keep in sync.
    setIsAdmin(user?.isAdmin ?? false);
  }, [user?.isAdmin, loading]);

  const baseTabs = [
    { id: "account", label: "Account", icon: RiUser3Line },
    { id: "matches", label: "Matches", icon: RiFootballLine },
    { id: "leaderboard", label: "Standings", icon: RiBarChartLine },
  ];

  const adminTab = { id: "admin", label: "Admin", icon: RiShieldLine };
  const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[env(safe-area-inset-bottom)] pb-3">
      <nav className="bg-card/95 border border-border rounded-2xl shadow-lg backdrop-blur-sm max-w-md mx-auto">
        <div className="flex items-center justify-around py-2 px-2">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange?.(id)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 touch-manipulation",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive ? "text-primary" : ""
                  )}
                />
                <span className="text-[10px] font-medium truncate leading-tight">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavigation;
