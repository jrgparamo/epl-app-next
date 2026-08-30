import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { fetchMatchesByMatchday } from "@/lib/matches-service";
import { upsertManualMatchResult } from "@/lib/match-results";
import { calculateMatchPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

function isValidScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 99;
}

/**
 * Admin-only: manually record a final result for a match the football-data API
 * left stale (stuck at TIMED with no score). Writes a `manual` MatchResult
 * (source of truth, overrides the API) and immediately recomputes points using
 * the existing scoring logic.
 */
export async function POST(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const matchId = body?.matchId != null ? String(body.matchId) : null;
  const matchday = Number(body?.matchday);
  const homeScore = Number(body?.homeScore);
  const awayScore = Number(body?.awayScore);

  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }
  if (!Number.isInteger(matchday) || matchday < 1 || matchday > 38) {
    return NextResponse.json({ error: "Invalid matchday" }, { status: 400 });
  }
  if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
    return NextResponse.json(
      { error: "Scores must be integers between 0 and 99" },
      { status: 400 },
    );
  }

  try {
    // Pull the fixture (teams, kickoff) from the authoritative fixture list so
    // the snapshot's metadata isn't trusted from the client.
    const fixtures = await fetchMatchesByMatchday(matchday);
    const fixture = fixtures.find((m) => String(m.id) === matchId);
    if (!fixture) {
      return NextResponse.json(
        { error: "Match not found in that matchday" },
        { status: 404 },
      );
    }

    await upsertManualMatchResult(fixture, homeScore, awayScore);
    const pointsAwarded = await calculateMatchPoints(
      matchId,
      homeScore,
      awayScore,
    );

    return NextResponse.json({
      success: true,
      matchId,
      homeScore,
      awayScore,
      pointsAwarded,
    });
  } catch (error) {
    console.error("POST /api/admin/match-result error:", error);
    return NextResponse.json(
      { error: "Failed to save match result" },
      { status: 500 },
    );
  }
}
