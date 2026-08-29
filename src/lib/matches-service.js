import apiCache from "@/lib/api-cache";

const API_BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const PREMIER_LEAGUE_ID = 2021;

// Shared football-data fetch used by /api/matches and /api/predictions/compare.
// Same cache key across callers so both share the 30-minute cache entry.
export async function fetchMatchesByMatchday(matchday, { status } = {}) {
  if (!API_KEY) {
    throw new Error("API key not configured");
  }

  const cacheKey = `matches-${matchday || status || "all"}`;

  const data = await apiCache.get(
    cacheKey,
    async () => {
      console.log(`🌐 Making API call for ${cacheKey}`);
      const params = new URLSearchParams();
      if (matchday) params.set("matchday", matchday);
      if (status) params.set("status", status);
      const endpoint = `/competitions/${PREMIER_LEAGUE_ID}/matches${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { "X-Auth-Token": API_KEY },
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "<unreadable body>");
        console.error(
          `Football-data API error: ${response.status} ${response.statusText} - ${bodyText}`,
        );
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    30 * 60 * 1000, // 30 minutes TTL
  );

  return (
    data.matches?.map((match) => ({
      id: match.id,
      homeTeam: {
        name: match.homeTeam.name,
        shortName: match.homeTeam.shortName || match.homeTeam.name,
        tla: match.homeTeam.tla,
        crest: match.homeTeam.crest,
      },
      awayTeam: {
        name: match.awayTeam.name,
        shortName: match.awayTeam.shortName || match.awayTeam.name,
        tla: match.awayTeam.tla,
        crest: match.awayTeam.crest,
      },
      utcDate: match.utcDate,
      status: match.status,
      matchday: match.matchday,
      score: match.score,
      venue: match.venue,
    })) || []
  );
}

// All season fixtures with matchday <= N (cumulative through a matchday).
// Uses the shared `matches-all` cache entry, so it costs at most one extra
// football-data call regardless of how many matchdays are requested.
export async function fetchMatchesThroughMatchday(matchday) {
  const n = Number(matchday);
  const all = await fetchMatchesByMatchday(null);
  return all.filter((m) => Number(m.matchday) <= n);
}
