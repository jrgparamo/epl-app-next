import { useState, useEffect } from "react";
import { useAuth } from "../app/components/AuthProvider";

export function useProfileSync() {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const syncProfile = async () => {
      if (!user || syncing) return;

      setSyncing(true);
      try {
        // Check if profile exists and sync it
        const response = await fetch("/api/profile/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            displayName:
              user.user_metadata?.display_name || user.email?.split("@")[0],
          }),
        });

        if (!response.ok) {
          console.warn("Profile sync failed:", await response.text());
        }
      } catch (error) {
        console.warn("Profile sync error:", error);
      } finally {
        setSyncing(false);
      }
    };

    syncProfile();
  }, [user, syncing]);

  return { syncing };
}
