// Football Data API integration via Next.js API routes
// This avoids CORS issues by calling our internal API routes

/**
 * Make API request to our internal API routes
 */
async function apiRequest(endpoint) {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
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
    const data = await apiRequest(`/api/matches?matchday=${matchday}`);
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
    const data = await apiRequest(`/api/matches`);
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
    const data = await apiRequest(`/api/matchday`);
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
