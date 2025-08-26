/**
 * Client-side cache implementation for API responses
 * Provides in-memory caching with TTL (Time To Live)
 */

class Cache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    return paramString ? `${url}?${paramString}` : url;
  }

  /**
   * Set cache entry with TTL
   */
  set(key, data, ttlSeconds = 1800) {
    // Default 30 minutes
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Get cache entry if not expired
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if cache has valid entry
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      totalEntries: this.cache.size,
      validEntries: entries.filter((entry) => now <= entry.expiresAt).length,
      expiredEntries: entries.filter((entry) => now > entry.expiresAt).length,
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((e) => e.createdAt))
          : null,
      newestEntry:
        entries.length > 0
          ? Math.max(...entries.map((e) => e.createdAt))
          : null,
    };
  }
}

// Singleton instance
const cache = new Cache();

// Cleanup expired entries every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

export default cache;

/**
 * Cache configuration for different API endpoints
 */
export const CACHE_CONFIG = {
  matches: {
    ttl: 1800, // 30 minutes
    key: "matches",
  },
  matchday: {
    ttl: 3600, // 1 hour
    key: "current-matchday",
  },
  fixtures: {
    ttl: 1800, // 30 minutes
    key: "fixtures",
  },
};
