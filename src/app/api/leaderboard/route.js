import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

const TOP_N = 50;

export async function GET() {
  const currentUser = await getSessionUser();

  try {
    // Top-N by total points. Groups over `user_points` and joins user info
    // in a follow-up query.
    const grouped = await prisma.userPoints.groupBy({
      by: ["userId"],
      _sum: { pointsEarned: true },
      orderBy: { _sum: { pointsEarned: "desc" } },
      take: TOP_N,
    });

    const userIds = grouped.map((g) => g.userId);
    const [correctCounts, distinctMatches, users] = await Promise.all([
      prisma.userPoints.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, pointsEarned: { gt: 0 } },
        _count: { _all: true },
      }),
      prisma.userPoints.findMany({
        where: { userId: { in: userIds } },
        distinct: ["userId", "matchId"],
        select: { userId: true, matchId: true },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, displayName: true },
      }),
    ]);

    const correctMap = new Map(
      correctCounts.map((r) => [r.userId, r._count._all]),
    );
    const matchesMap = new Map();
    for (const row of distinctMatches) {
      matchesMap.set(row.userId, (matchesMap.get(row.userId) ?? 0) + 1);
    }
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = grouped.map((row, index) => {
      const u = userMap.get(row.userId);
      return {
        user_id: row.userId,
        display_name: u?.displayName || u?.email?.split("@")[0] || "Anonymous",
        email: u?.email ?? null,
        predictions: row._sum.pointsEarned ?? 0,
        matches_predicted: matchesMap.get(row.userId) ?? 0,
        correct_predictions: correctMap.get(row.userId) ?? 0,
        rank: index + 1,
        isCurrentUser: currentUser?.id === row.userId,
      };
    });

    // Append current user at the tail if they're outside the top N.
    if (currentUser && !leaderboard.some((e) => e.user_id === currentUser.id)) {
      const [meAgg, meCorrect, meDistinct, meUser] = await Promise.all([
        prisma.userPoints.aggregate({
          where: { userId: currentUser.id },
          _sum: { pointsEarned: true },
        }),
        prisma.userPoints.count({
          where: { userId: currentUser.id, pointsEarned: { gt: 0 } },
        }),
        prisma.userPoints.findMany({
          where: { userId: currentUser.id },
          distinct: ["matchId"],
          select: { matchId: true },
        }),
        prisma.user.findUnique({
          where: { id: currentUser.id },
          select: { email: true, displayName: true },
        }),
      ]);

      leaderboard.push({
        user_id: currentUser.id,
        display_name:
          meUser?.displayName || meUser?.email?.split("@")[0] || "You",
        email: meUser?.email ?? null,
        predictions: meAgg._sum.pointsEarned ?? 0,
        matches_predicted: meDistinct.length,
        correct_predictions: meCorrect,
        rank: null,
        isCurrentUser: true,
      });
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
