import { NextResponse } from "next/server";
import apiCache from "@/lib/api-cache";

const API_BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY;
const PREMIER_LEAGUE_ID = 2021;

// Cache for 30 minutes (1800 seconds)
// export const revalidate = 1800;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchday = searchParams.get("matchday");

  if (!API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const cacheKey = `matches-${matchday || "all"}`;

    const data = await apiCache.get(
      cacheKey,
      async () => {
        console.log(`🌐 Making API call for ${cacheKey}`);
        let endpoint = `/competitions/${PREMIER_LEAGUE_ID}/matches`;
        if (matchday) {
          endpoint += `?matchday=${matchday}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            "X-Auth-Token": API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`
          );
        }

        return response.json();
      },
      30 * 60 * 1000 // 30 minutes TTL
    );

    // Transform the data to match our app format
    const transformedMatches =
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
      })) || [];

    return NextResponse.json({ matches: transformedMatches });
  } catch (error) {
    console.error("Football Data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
