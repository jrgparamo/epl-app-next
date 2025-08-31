export function SyncStatusIndicator({
  syncError,
  retryQueueCount,
  isOnline,
  user,
  forceSyncPredictions,
}) {
  return (
    <>
      {/* Sync error indicator */}
      {syncError && (
        <div className="mt-2 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
          <div className="text-center text-yellow-400 text-sm">
            ⚠️ {syncError}
          </div>
          {retryQueueCount > 0 && (
            <div className="text-center text-yellow-300 text-xs mt-1">
              {retryQueueCount} prediction{retryQueueCount !== 1 ? "s" : ""}{" "}
              pending sync
              {!isOnline && " (waiting for internet connection)"}
            </div>
          )}
        </div>
      )}

      {/* Connection status indicator */}
      {!isOnline && (
        <div className="mt-2 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
          <div className="text-center text-red-400 text-sm">
            🔌 No internet connection - predictions will sync when connected
          </div>
        </div>
      )}

      {/* Debug sync button (for testing) */}
      {user && retryQueueCount > 0 && (
        <div className="mt-2 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
          <div className="text-center">
            <button
              onClick={forceSyncPredictions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              🔄 Force Sync Now ({retryQueueCount} pending)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
