# Enhanced Predictions Service with Retry Logic

## Current Behavior Summary

When database sync fails during prediction saving:

### ✅ What Works Well:

- **Immediate UI Response**: Prediction appears instantly (optimistic update)
- **Local Storage**: Prediction saved to localStorage immediately
- **Error Handling**: User gets clear feedback about sync failure
- **Data Persistence**: Prediction won't be lost locally
- **Dual Backup**: Saved in both service localStorage and legacy format

### ❌ What's Missing:

- **No Automatic Retry**: Failed syncs aren't retried automatically
- **No Background Sync**: No periodic sync of failed predictions
- **Cross-Device Issues**: Unsynced predictions won't appear on other devices

## Proposed Enhancements

### 1. Retry Queue System

```javascript
// Add to predictions.js
class PredictionsService {
  constructor() {
    this.localKey = "user_predictions";
    this.syncKey = "last_sync";
    this.retryQueueKey = "retry_queue"; // NEW
    this.syncInterval = 300000; // 5 minutes
    this.retryInterval = 60000; // 1 minute retry
  }

  // Enhanced save with retry queue
  async savePrediction(userId, matchId, homeScore, awayScore, confidence = 1) {
    // ... existing local save logic ...

    try {
      await this.saveToDatabase(
        userId,
        matchId,
        homeScore,
        awayScore,
        confidence
      );
      // Remove from retry queue if successful
      this.removeFromRetryQueue(userId, matchId);
    } catch (error) {
      // Add to retry queue for later
      this.addToRetryQueue(userId, matchId, {
        homeScore,
        awayScore,
        confidence,
      });
      throw error;
    }
  }

  // Retry failed syncs
  async processRetryQueue(userId) {
    const retryQueue = this.getRetryQueue(userId);

    for (const [matchId, prediction] of Object.entries(retryQueue)) {
      try {
        await this.saveToDatabase(
          userId,
          matchId,
          prediction.homeScore,
          prediction.awayScore,
          prediction.confidence
        );
        this.removeFromRetryQueue(userId, matchId);
      } catch (error) {
        console.error(`Retry failed for match ${matchId}:`, error);
      }
    }
  }
}
```

### 2. Background Sync Timer

```javascript
// Add to page.js
useEffect(() => {
  if (!user?.id) return;

  const syncInterval = setInterval(async () => {
    try {
      await predictionsService.processRetryQueue(user.id);
    } catch (error) {
      console.error("Background sync failed:", error);
    }
  }, 60000); // Every minute

  return () => clearInterval(syncInterval);
}, [user]);
```

### 3. Connection Status Detection

```javascript
// Add online/offline detection
useEffect(() => {
  const handleOnline = () => {
    if (user?.id) {
      predictionsService.processRetryQueue(user.id);
    }
  };

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}, [user]);
```

## Implementation Priority

### High Priority (Immediate Benefits):

1. **Retry Queue**: Store failed syncs for later retry
2. **Background Sync**: Periodic retry of failed syncs
3. **Online Detection**: Retry when connection restored

### Medium Priority (Nice to Have):

1. **Exponential Backoff**: Increase retry intervals on repeated failures
2. **Conflict Resolution**: Handle data conflicts between devices
3. **Sync Status Indicator**: Show sync progress to users

### Low Priority (Advanced Features):

1. **Batch Sync**: Sync multiple predictions efficiently
2. **Compression**: Reduce network usage for large datasets
3. **Analytics**: Track sync success rates

## Quick Fix Implementation

Would you like me to implement a basic retry system? It would:

1. ✅ Store failed syncs in a retry queue
2. ✅ Attempt to sync them every minute
3. ✅ Retry when internet connection is restored
4. ✅ Remove successfully synced items from queue
5. ✅ Show improved sync status to users

This would ensure your predictions eventually sync to the database even if the initial attempt fails.
