import { NextResponse } from "next/server";
import { fetchMatchesByMatchday } from "@/lib/matches-service";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchday = searchParams.get("matchday");
  const status = searchParams.get("status");

  try {
    const matches = await fetchMatchesByMatchday(matchday, { status });
    return NextResponse.json({ matches });
  } catch (error) {
    if (error.message === "API key not configured") {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }
    console.error("Football Data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
