import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import {
  getUserPointsSummaries,
  getMatchdayPointsSummaries,
  getFinishedMatchesCount,
} from "@/lib/points";
import { fetchMatchesByMatchday } from "@/lib/matches-service";

export async function GET(request, { params }) {
  const { leagueId } = await params;
  const { user, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const matchday = searchParams.get("matchday");

  try {
    // Access control: caller must be a member.
    const membership = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: user.id } },
      select: { id: true },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this league." },
        { status: 403 },
      );
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true },
            },
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    const memberUserIds = league.members.map((m) => m.userId);

    let pointsByUser;
    let finishedMatches;
    if (matchday) {
      const matches = await fetchMatchesByMatchday(matchday);
      const matchIds = matches.map((m) => String(m.id));
      finishedMatches = matches.filter((m) => m.status === "FINISHED").length;
      pointsByUser = await getMatchdayPointsSummaries(memberUserIds, matchIds);
    } else {
      [pointsByUser, finishedMatches] = await Promise.all([
        getUserPointsSummaries(memberUserIds),
        getFinishedMatchesCount(),
      ]);
    }

    // Sort by total points desc, tie-break on joinedAt asc.
    const enriched = league.members
      .map((m) => {
        const summary = pointsByUser.get(m.userId) ?? {
          total_points: 0,
          predicted_matches: 0,
          correct_predictions: 0,
        };
        const displayName =
          m.user?.displayName || m.user?.email?.split("@")[0] || "Anonymous";
        return {
          user_id: m.userId,
          display_name:
            m.userId === user.id ? displayName || "You" : displayName,
          points: summary.total_points,
          predicted_matches: summary.predicted_matches,
          correct_predictions: summary.correct_predictions,
          finished_matches: finishedMatches,
          joinedAt: m.joinedAt,
          isAdmin: m.isAdmin,
          isCurrentUser: m.userId === user.id,
        };
      })
      .sort(
        (a, b) =>
          b.points - a.points ||
          new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
      );

    const leaderboard = enriched.map((entry, i) => ({
      ...entry,
      rank: i + 1,
    }));

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        description: league.description,
        joinCode: league.joinCode,
        createdBy: league.createdById,
        maxMembers: league.maxMembers,
        memberCount: leaderboard.length,
      },
      leaderboard,
    });
  } catch (error) {
    console.error("GET /api/leagues/[leagueId]/leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch league leaderboard" },
      { status: 500 },
    );
  }
}
