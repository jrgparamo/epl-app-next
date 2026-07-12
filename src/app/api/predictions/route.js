import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, canActAsUser } from "@/lib/auth-helpers";

// Prisma model → legacy API shape (snake_case) that the client expects.
function toApiShape(prediction) {
  return {
    id: prediction.id,
    user_id: prediction.userId,
    match_id: prediction.matchId,
    home_score: prediction.homeScore,
    away_score: prediction.awayScore,
    confidence: prediction.confidence,
    created_at: prediction.createdAt,
    updated_at: prediction.updatedAt,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const { user, response } = await requireUser();
  if (response) return response;

  if (!(await canActAsUser(user, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const predictions = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(predictions.map(toApiShape));
  } catch (error) {
    console.error("GET /api/predictions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, matchId, homeScore, awayScore, confidence = 1 } = body ?? {};

  if (
    !userId ||
    !matchId ||
    homeScore === undefined ||
    awayScore === undefined
  ) {
    return NextResponse.json(
      {
        error: "Missing required fields: userId, matchId, homeScore, awayScore",
      },
      { status: 400 },
    );
  }

  const { user, response } = await requireUser();
  if (response) return response;

  if (!(await canActAsUser(user, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId, matchId: String(matchId) } },
      create: {
        userId,
        matchId: String(matchId),
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        confidence: Number(confidence),
      },
      update: {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        confidence: Number(confidence),
      },
    });
    return NextResponse.json(toApiShape(prediction));
  } catch (error) {
    console.error("POST /api/predictions error:", error);
    return NextResponse.json(
      { error: "Failed to save prediction" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const matchId = searchParams.get("matchId");

  if (!userId || !matchId) {
    return NextResponse.json(
      { error: "User ID and Match ID required" },
      { status: 400 },
    );
  }

  const { user, response } = await requireUser();
  if (response) return response;

  if (!(await canActAsUser(user, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.prediction
      .delete({
        where: {
          userId_matchId: { userId, matchId: String(matchId) },
        },
      })
      .catch((err) => {
        // Deleting a non-existent row is a no-op for our client.
        if (err?.code !== "P2025") throw err;
      });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/predictions error:", error);
    return NextResponse.json(
      { error: "Failed to delete prediction" },
      { status: 500 },
    );
  }
}
