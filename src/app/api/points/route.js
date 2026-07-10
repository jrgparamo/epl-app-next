import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { calculateMatchPoints, getUserPointsSummary } from "@/lib/points";

// GET: Retrieve the current user's points summary.
export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const summary = await getUserPointsSummary(user.id);
    return NextResponse.json({
      total_points: summary.total_points,
      matches_predicted: summary.matches_predicted,
      correct_predictions: summary.correct_predictions,
      last_updated: summary.last_updated,
    });
  } catch (error) {
    console.error("GET /api/points error:", error);
    return NextResponse.json(
      { error: "Failed to fetch points" },
      { status: 500 },
    );
  }
}

// POST: Calculate points for finished matches (cron / admin trigger).
export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { matches } = body ?? {};
  if (!matches || !Array.isArray(matches)) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  let totalPointsCalculated = 0;

  for (const match of matches) {
    if (match?.status === "FINISHED" && match?.score?.fullTime) {
      const { home, away } = match.score.fullTime;
      try {
        const awarded = await calculateMatchPoints(
          match.id,
          Number(home),
          Number(away),
        );
        totalPointsCalculated += awarded;
      } catch (error) {
        console.error(`Error calculating points for match ${match.id}:`, error);
      }
    }
  }

  return NextResponse.json({
    success: true,
    totalPointsCalculated,
    matchesProcessed: matches.length,
  });
}

// PUT: Trigger a per-user recalculation (placeholder — parity with legacy route).
export async function PUT() {
  const { user, response } = await requireUser();
  if (response) return response;

  return NextResponse.json({
    success: true,
    message: "Recalculation triggered",
    userId: user.id,
  });
}
