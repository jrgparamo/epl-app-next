"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  RiWifiOffLine,
  RiAlertLine,
  RiRefreshLine,
} from "@remixicon/react";

export function SyncStatusIndicator({
  syncError,
  retryQueueCount,
  isOnline,
  user,
  forceSyncPredictions,
}) {
  return (
    <div className="space-y-2">
      {/* Offline banner */}
      {!isOnline && (
        <Alert variant="destructive" className="py-2">
          <RiWifiOffLine className="h-4 w-4" />
          <AlertDescription className="text-xs">
            No internet connection — predictions will sync when connected
          </AlertDescription>
        </Alert>
      )}

      {/* Sync error */}
      {syncError && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10 py-2">
          <RiAlertLine className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-xs text-yellow-400">
            {syncError}
            {retryQueueCount > 0 && (
              <span className="ml-1">
                ({retryQueueCount} pending
                {!isOnline && ", waiting for connection"})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Force sync button */}
      {user && retryQueueCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10"
          onClick={forceSyncPredictions}
        >
          <RiRefreshLine className="h-3.5 w-3.5" />
          Force Sync ({retryQueueCount} pending)
        </Button>
      )}
    </div>
  );
}
