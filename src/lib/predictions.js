class PredictionsService {
  constructor() {
    this.localKey = "user_predictions";
    this.syncKey = "last_sync";
    this.syncInterval = 300000; // 5 minutes
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

  // Save prediction with optimistic updates
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
      return prediction;
    } catch (error) {
      console.error("Failed to sync prediction to database:", error);
      // Could implement retry logic here
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
}

export const predictionsService = new PredictionsService();
