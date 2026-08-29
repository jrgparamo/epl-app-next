import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { fetchMatchesByMatchday } from "@/lib/matches-service";
import { hasMatchStarted } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Compares the caller's matchday predictions with a target user's.
// Target picks are withheld until each match kicks off (server-enforced).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchday = searchParams.get("matchday");
  const targetUserId = searchParams.get("userId");

  if (!matchday || !targetUserId) {
    return NextResponse.json(
      { error: "matchday and userId are required" },
      { status: 400 },
    );
  }

  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const [matches, targetUser] = await Promise.all([
      fetchMatchesByMatchday(matchday),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, displayName: true },
      }),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const matchIds = matches.map((m) => String(m.id));
    const predictions = await prisma.prediction.findMany({
      where: {
        userId: { in: [user.id, targetUserId] },
        matchId: { in: matchIds },
      },
      select: { userId: true, matchId: true, homeScore: true, awayScore: true },
    });

    const pickByKey = new Map(
      predictions.map((p) => [`${p.userId}:${p.matchId}`, p]),
    );

    const rows = matches.map((m) => {
      const id = String(m.id);
      const started = hasMatchStarted(m.utcDate);
      const mine = pickByKey.get(`${user.id}:${id}`);
      const theirs = pickByKey.get(`${targetUserId}:${id}`);

      let them;
      if (!started) {
        them = { locked: true };
      } else {
        them = theirs
          ? { home_score: theirs.homeScore, away_score: theirs.awayScore }
          : null;
      }

      return {
        id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        utcDate: m.utcDate,
        status: m.status,
        score: { fullTime: m.score?.fullTime ?? { home: null, away: null } },
        me: mine
          ? { home_score: mine.homeScore, away_score: mine.awayScore }
          : null,
        them,
      };
    });

    return NextResponse.json({
      matchday: Number(matchday),
      target: {
        user_id: targetUser.id,
        display_name:
          targetUser.displayName ||
          targetUser.email?.split("@")[0] ||
          "Anonymous",
      },
      matches: rows,
    });
  } catch (error) {
    console.error("GET /api/predictions/compare error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparison" },
      { status: 500 },
    );
  }
}
