import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST() {
  try {
    console.log("🔥 Starting cache warmup...");

    // Step 1: Warm up current matchday
    const matchdayResponse = await fetch(`${API_BASE_URL}/api/matchday`, {
      headers: { "Cache-Control": "no-cache" },
    });

    if (!matchdayResponse.ok) {
      throw new Error("Failed to fetch current matchday");
    }

    const { currentMatchday } = await matchdayResponse.json();
    console.log(`📅 Current matchday: ${currentMatchday}`);

    // Step 2: Warm up matches for current matchday
    const matchesResponse = await fetch(
      `${API_BASE_URL}/api/matches?matchday=${currentMatchday}`,
      {
        headers: { "Cache-Control": "no-cache" },
      }
    );

    if (!matchesResponse.ok) {
      throw new Error("Failed to fetch matches");
    }

    // // Step 3: Warm up all matches (for general browsing)
    // const allMatchesResponse = await fetch(`${API_BASE_URL}/api/matches`, {
    //   headers: { "Cache-Control": "no-cache" },
    // });

    // if (!allMatchesResponse.ok) {
    //   throw new Error("Failed to fetch all matches");
    // }

    console.log("✅ Cache warmup completed successfully");

    return NextResponse.json({
      success: true,
      warmed: ["current-matchday", `matches-${currentMatchday}`],
      currentMatchday,
    });
  } catch (error) {
    console.error("❌ Cache warmup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Allow GET requests for manual triggering
  return POST();
}
