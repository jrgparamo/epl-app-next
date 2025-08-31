class PredictionsService {
  constructor() {
    this.localKey = "user_predictions";
    this.syncKey = "last_sync";
    this.retryQueueKey = "retry_queue";
    this.syncInterval = 300000; // 5 minutes
    this.retryInterval = 60000; // 1 minute for background retry
  }

  // Get predictions with local-first approach
  async getPredictions(userId) {
    if (!userId) return {};

    try {
      // Try local storage first
      const local = this.getLocalPredictions(userId);
      const lastSync = localStorage.getItem(`${this.syncKey}_${userId}`);

      // If no recent sync or no local data, fetch from database
      if (
        !lastSync ||
        Date.now() - parseInt(lastSync) > this.syncInterval ||
        Object.keys(local).length === 0
      ) {
        const remote = await this.fetchFromDatabase(userId);
        this.setLocalPredictions(userId, remote);
        localStorage.setItem(
          `${this.syncKey}_${userId}`,
          Date.now().toString()
        );
        return remote;
      }

      return local;
    } catch (error) {
      console.error("Failed to get predictions:", error);
      return this.getLocalPredictions(userId);
    }
  }

  // Save prediction with enhanced retry logic
  async savePrediction(userId, matchId, homeScore, awayScore, confidence = 1) {
    if (
      !userId ||
      !matchId ||
      homeScore === undefined ||
      awayScore === undefined
    ) {
      throw new Error("Missing required prediction data");
    }

    const prediction = {
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      confidence,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update local storage immediately (optimistic update)
    const predictions = this.getLocalPredictions(userId);
    predictions[matchId] = prediction;
    this.setLocalPredictions(userId, predictions);

    // Sync to database in background
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
      return prediction;
    } catch (error) {
      console.error("Failed to sync prediction to database:", error);

      // Add to retry queue for later syncing
      this.addToRetryQueue(userId, matchId, {
        homeScore,
        awayScore,
        confidence,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  // Delete prediction
  async deletePrediction(userId, matchId) {
    if (!userId || !matchId) {
      throw new Error("Missing required data");
    }

    // Remove from local storage immediately
    const predictions = this.getLocalPredictions(userId);
    delete predictions[matchId];
    this.setLocalPredictions(userId, predictions);

    // Remove from retry queue if it exists
    this.removeFromRetryQueue(userId, matchId);

    // Sync to database
    try {
      await this.deleteFromDatabase(userId, matchId);
    } catch (error) {
      console.error("Failed to delete prediction from database:", error);
      throw error;
    }
  }

  // Local storage methods
  getLocalPredictions(userId) {
    try {
      const stored = localStorage.getItem(`${this.localKey}_${userId}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Failed to parse local predictions:", error);
      return {};
    }
  }

  setLocalPredictions(userId, predictions) {
    try {
      localStorage.setItem(
        `${this.localKey}_${userId}`,
        JSON.stringify(predictions)
      );
    } catch (error) {
      console.error("Failed to save local predictions:", error);
    }
  }

  // Retry queue management
  getRetryQueue(userId) {
    try {
      const stored = localStorage.getItem(`${this.retryQueueKey}_${userId}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Failed to parse retry queue:", error);
      return {};
    }
  }

  setRetryQueue(userId, queue) {
    try {
      localStorage.setItem(
        `${this.retryQueueKey}_${userId}`,
        JSON.stringify(queue)
      );
    } catch (error) {
      console.error("Failed to save retry queue:", error);
    }
  }

  addToRetryQueue(userId, matchId, predictionData) {
    const queue = this.getRetryQueue(userId);
    queue[matchId] = predictionData;
    this.setRetryQueue(userId, queue);
  }

  removeFromRetryQueue(userId, matchId) {
    const queue = this.getRetryQueue(userId);
    delete queue[matchId];
    this.setRetryQueue(userId, queue);
  }

  // Process retry queue - attempt to sync failed predictions
  async processRetryQueue(userId) {
    if (!userId) return { success: 0, failed: 0 };

    const queue = this.getRetryQueue(userId);
    const queueEntries = Object.entries(queue);

    if (queueEntries.length === 0) {
      return { success: 0, failed: 0 };
    }

    console.log(
      `Processing ${queueEntries.length} queued predictions for sync...`
    );

    let successCount = 0;
    let failedCount = 0;

    for (const [matchId, predictionData] of queueEntries) {
      try {
        await this.saveToDatabase(
          userId,
          matchId,
          predictionData.homeScore,
          predictionData.awayScore,
          predictionData.confidence
        );

        this.removeFromRetryQueue(userId, matchId);
        successCount++;
        console.log(
          `Successfully synced queued prediction for match ${matchId}`
        );
      } catch (error) {
        console.error(
          `Failed to sync queued prediction for match ${matchId}:`,
          error
        );
        failedCount++;
      }
    }

    console.log(
      `Retry queue processing complete: ${successCount} success, ${failedCount} failed`
    );
    return { success: successCount, failed: failedCount };
  }

  // Database methods
  async fetchFromDatabase(userId) {
    const response = await fetch(`/api/predictions?userId=${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch predictions from database");
    }
    const data = await response.json();

    // Convert array to object for easier lookup
    const predictions = {};
    data.forEach((prediction) => {
      predictions[prediction.match_id] = prediction;
    });

    return predictions;
  }

  async saveToDatabase(userId, matchId, homeScore, awayScore, confidence) {
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        matchId,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        confidence: parseInt(confidence),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save prediction");
    }

    return response.json();
  }

  async deleteFromDatabase(userId, matchId) {
    const response = await fetch(
      `/api/predictions?userId=${userId}&matchId=${matchId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete prediction");
    }

    return response.json();
  }

  // Clear all local data (useful for logout)
  clearLocalData(userId) {
    localStorage.removeItem(`${this.localKey}_${userId}`);
    localStorage.removeItem(`${this.syncKey}_${userId}`);
    localStorage.removeItem(`${this.retryQueueKey}_${userId}`);
  }

  // Force sync from database (useful for refresh)
  async forceSyncFromDatabase(userId) {
    if (!userId) return {};

    try {
      const remote = await this.fetchFromDatabase(userId);
      this.setLocalPredictions(userId, remote);
      localStorage.setItem(`${this.syncKey}_${userId}`, Date.now().toString());
      return remote;
    } catch (error) {
      console.error("Failed to force sync:", error);
      return this.getLocalPredictions(userId);
    }
  }

  // Get retry queue status for UI
  getRetryQueueStatus(userId) {
    if (!userId) return { count: 0, isEmpty: true };

    const queue = this.getRetryQueue(userId);
    const count = Object.keys(queue).length;

    return {
      count,
      isEmpty: count === 0,
      queue,
    };
  }
}

export const predictionsService = new PredictionsService();
