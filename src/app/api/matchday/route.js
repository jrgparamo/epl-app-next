import { NextResponse } from "next/server";

const API_BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY;
const PREMIER_LEAGUE_ID = 2021;

// Cache for 1 hour (3600 seconds) - matchday changes less frequently
// export const revalidate = 3600;

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/competitions/${PREMIER_LEAGUE_ID}`,
      {
        headers: {
          "X-Auth-Token": API_KEY,
        },
        // Cache the response for 1 hour with tags
        next: {
          revalidate: 3600,
          tags: ["matchday", "season-info"],
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const currentMatchday = data.currentSeason?.currentMatchday || 1;

    return NextResponse.json({ currentMatchday });
  } catch (error) {
    console.error("Football Data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch current matchday" },
      { status: 500 }
    );
  }
}
