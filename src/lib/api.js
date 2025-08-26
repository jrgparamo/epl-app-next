// Football Data API integration via Next.js API routes
// This avoids CORS issues by calling our internal API routes
import cache, { CACHE_CONFIG } from "./cache";

/**
 * Make API request to our internal API routes with caching
 */
async function apiRequest(endpoint, cacheKey = null, ttl = null) {
  // Check cache first if cache key is provided
  if (cacheKey) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedData;
    }
  }

  try {
    console.log(`Making API request to ${endpoint}`);

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Cache the response if cache key is provided
    if (cacheKey && ttl) {
      cache.set(cacheKey, data, ttl);
      console.log(`Cached response for ${cacheKey} (TTL: ${ttl}s)`);
    }

    return data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

/**
 * Get Premier League fixtures for a specific matchday
 * @param {number} matchday - The matchday number (1-38)
 */
export async function getFixturesByMatchday(matchday) {
  try {
    const cacheKey = `${CACHE_CONFIG.matches.key}-${matchday}`;
    const data = await apiRequest(
      `/api/matches?matchday=${matchday}`,
      cacheKey,
      CACHE_CONFIG.matches.ttl
    );
    return data.matches || [];
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return [];
  }
}

/**
 * Get all Premier League fixtures
 */
export async function getAllFixtures() {
  try {
    const cacheKey = `${CACHE_CONFIG.fixtures.key}-all`;
    const data = await apiRequest(
      `/api/matches`,
      cacheKey,
      CACHE_CONFIG.fixtures.ttl
    );
    return data.matches || [];
  } catch (error) {
    console.error("Error fetching all fixtures:", error);
    return [];
  }
}

/**
 * Get current matchday
 */
export async function getCurrentMatchday() {
  try {
    const data = await apiRequest(
      `/api/matchday`,
      CACHE_CONFIG.matchday.key,
      CACHE_CONFIG.matchday.ttl
    );
    return data.currentMatchday || 1;
  } catch (error) {
    console.error("Error fetching current matchday:", error);
    return 1;
  }
}

/**
 * Get matches for the current or upcoming gameweek
 */
export async function getUpcomingMatches() {
  try {
    const currentMatchday = await getCurrentMatchday();
    const matches = await getFixturesByMatchday(currentMatchday);
    return matches;
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return [];
  }
}

/**
 * Cache management functions
 */

/**
 * Clear all cached data
 */
export function clearCache() {
  cache.clear();
  console.log("All cache cleared");
}

/**
 * Clear cache for specific matchday
 */
export function clearMatchdayCache(matchday) {
  const cacheKey = `${CACHE_CONFIG.matches.key}-${matchday}`;
  cache.cache.delete(cacheKey);
  console.log(`Cache cleared for matchday ${matchday}`);
}

/**
 * Clear current matchday cache
 */
export function clearCurrentMatchdayCache() {
  cache.cache.delete(CACHE_CONFIG.matchday.key);
  console.log("Current matchday cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats();
}

/**
 * Prefetch data for multiple matchdays
 */
export async function prefetchMatchdays(matchdays) {
  const promises = matchdays.map((matchday) =>
    getFixturesByMatchday(matchday).catch((error) => {
      console.error(`Failed to prefetch matchday ${matchday}:`, error);
      return [];
    })
  );

  await Promise.all(promises);
  console.log(`Prefetched data for matchdays: ${matchdays.join(", ")}`);
}
