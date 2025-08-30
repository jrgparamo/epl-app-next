class APICache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map(); // Prevent duplicate requests
  }

  async get(key, fetcher, ttl = 1800000) {
    // Check if data exists and is valid
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request and store promise
    const requestPromise = this.executeRequest(key, fetcher, ttl);
    this.pendingRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  async executeRequest(key, fetcher, ttl) {
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        expiry: Date.now() + ttl,
        timestamp: Date.now(),
      });
      return data;
    } catch (error) {
      // Return stale data if available during errors
      const cached = this.cache.get(key);
      if (cached) {
        console.warn(`API error, serving stale data for ${key}:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  clear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

const apiCache = new APICache();
export default apiCache;
