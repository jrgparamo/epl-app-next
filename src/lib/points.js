import { prisma } from "@/lib/prisma";

/**
 * Calculate and persist points for a single match.
 *
 * Rules (mirrors the legacy `calculate_match_points` Postgres function):
 *  - Exact score match  → 3 points (type: "exact_score")
 *  - Correct result     → 1 point  (type: "result")
 *  - Otherwise          → no row
 *
 * Existing UserPoints rows for the match are cleared before inserting
 * to keep the state idempotent.
 *
 * @param {string} matchId
 * @param {number} homeActual
 * @param {number} awayActual
 * @returns {Promise<number>} total points awarded for this match
 */
export async function calculateMatchPoints(matchId, homeActual, awayActual) {
  const matchIdStr = String(matchId);
  const homeAct = Number(homeActual);
  const awayAct = Number(awayActual);

  const predictions = await prisma.prediction.findMany({
    where: { matchId: matchIdStr },
    select: {
      userId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  if (predictions.length === 0) return 0;

  let totalAwarded = 0;

  await prisma.$transaction(async (tx) => {
    // Clear any previously computed points for this match so recalculation
    // is idempotent.
    await tx.userPoints.deleteMany({ where: { matchId: matchIdStr } });

    for (const pred of predictions) {
      const exact = pred.homeScore === homeAct && pred.awayScore === awayAct;
      const predResultSign = Math.sign(pred.homeScore - pred.awayScore);
      const actualResultSign = Math.sign(homeAct - awayAct);
      const correctResult = predResultSign === actualResultSign;

      if (exact) {
        await tx.userPoints.create({
          data: {
            userId: pred.userId,
            matchId: matchIdStr,
            pointsEarned: 3,
            predictionType: "exact_score",
            homeScorePredicted: pred.homeScore,
            awayScorePredicted: pred.awayScore,
            homeScoreActual: homeAct,
            awayScoreActual: awayAct,
          },
        });
        totalAwarded += 3;
      } else if (correctResult) {
        await tx.userPoints.create({
          data: {
            userId: pred.userId,
            matchId: matchIdStr,
            pointsEarned: 1,
            predictionType: "result",
            homeScorePredicted: pred.homeScore,
            awayScorePredicted: pred.awayScore,
            homeScoreActual: homeAct,
            awayScoreActual: awayAct,
          },
        });
        totalAwarded += 1;
      }
    }
  });

  return totalAwarded;
}

/**
 * Aggregate points summary for a single user.
 * Replaces the legacy `user_points_summary` Postgres view.
 *
 * @param {string} userId
 */
export async function getUserPointsSummary(userId) {
  const [totals, distinctMatches, correctCount, latest] = await Promise.all([
    prisma.userPoints.aggregate({
      where: { userId },
      _sum: { pointsEarned: true },
    }),
    prisma.userPoints.findMany({
      where: { userId },
      distinct: ["matchId"],
      select: { matchId: true },
    }),
    prisma.userPoints.count({
      where: { userId, pointsEarned: { gt: 0 } },
    }),
    prisma.userPoints.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
      select: { calculatedAt: true },
    }),
  ]);

  return {
    user_id: userId,
    total_points: totals._sum.pointsEarned ?? 0,
    matches_predicted: distinctMatches.length,
    correct_predictions: correctCount,
    last_updated: latest?.calculatedAt ?? null,
  };
}

/**
 * Aggregate points summaries for a set of user ids in one round-trip.
 * Returns a Map keyed by userId → summary object.
 *
 * @param {string[]} userIds
 */
export async function getUserPointsSummaries(userIds) {
  if (!userIds || userIds.length === 0) return new Map();

  const rows = await prisma.userPoints.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _sum: { pointsEarned: true },
    _count: { _all: true },
    _max: { calculatedAt: true },
  });

  const correctCounts = await prisma.userPoints.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, pointsEarned: { gt: 0 } },
    _count: { _all: true },
  });
  const correctMap = new Map(
    correctCounts.map((r) => [r.userId, r._count._all]),
  );

  const distinctMatches = await prisma.userPoints.findMany({
    where: { userId: { in: userIds } },
    distinct: ["userId", "matchId"],
    select: { userId: true, matchId: true },
  });
  const matchesMap = new Map();
  for (const row of distinctMatches) {
    matchesMap.set(row.userId, (matchesMap.get(row.userId) ?? 0) + 1);
  }

  const result = new Map();
  for (const row of rows) {
    result.set(row.userId, {
      user_id: row.userId,
      total_points: row._sum.pointsEarned ?? 0,
      matches_predicted: matchesMap.get(row.userId) ?? 0,
      correct_predictions: correctMap.get(row.userId) ?? 0,
      last_updated: row._max.calculatedAt ?? null,
    });
  }
  // Ensure every requested user id is present, even if zero rows.
  for (const id of userIds) {
    if (!result.has(id)) {
      result.set(id, {
        user_id: id,
        total_points: 0,
        matches_predicted: 0,
        correct_predictions: 0,
        last_updated: null,
      });
    }
  }
  return result;
}

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const PREMIER_LEAGUE_ID = 2021;

async function fetchFinishedMatchesFromApi() {
  const apiKey =
    process.env.FOOTBALL_DATA_API_KEY ||
    process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY not configured");

  const response = await fetch(
    `${FOOTBALL_DATA_BASE_URL}/competitions/${PREMIER_LEAGUE_ID}/matches?status=FINISHED`,
    { headers: { "X-Auth-Token": apiKey } },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch matches: ${response.status}`);
  }
  const data = await response.json();
  return data.matches || [];
}

/**
 * Opportunistically recompute points for recently-finished matches when a user
 * reads their points, so results are fresh soon after a match ends instead of
 * waiting for the once-a-day cron.
 *
 * Throttled via a `CronLog` marker (shared with the cron) so the external
 * football-data fetch runs at most once per `throttleMs` across all readers,
 * and scoped to matches updated within `recentMs` to keep the work bounded.
 *
 * Best-effort: any failure is swallowed by the caller so reads never break.
 *
 * @param {{ throttleMs?: number, recentMs?: number }} [options]
 * @returns {Promise<{ skipped: boolean, processed?: number, awarded?: number }>}
 */
export async function refreshRecentMatchPoints({
  throttleMs = 10 * 60 * 1000,
  recentMs = 3 * 24 * 60 * 60 * 1000,
} = {}) {
  const lastRun = await prisma.cronLog.findFirst({
    where: {
      jobName: { in: ["cron_calculate_points", "points_lazy_refresh"] },
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (lastRun && Date.now() - lastRun.createdAt.getTime() < throttleMs) {
    return { skipped: true };
  }

  let matches;
  try {
    matches = await fetchFinishedMatchesFromApi();
  } catch (error) {
    console.error("Lazy points refresh: fetch failed:", error);
    return { skipped: true };
  }

  const cutoff = Date.now() - recentMs;
  let processed = 0;
  let awarded = 0;

  for (const match of matches) {
    if (match?.status !== "FINISHED" || !match?.score?.fullTime) continue;
    // Skip matches that finished well in the past; the daily cron backfills those.
    const updatedAt = match.lastUpdated
      ? new Date(match.lastUpdated).getTime()
      : 0;
    if (updatedAt && updatedAt < cutoff) continue;

    const { home, away } = match.score.fullTime;
    try {
      awarded += await calculateMatchPoints(
        match.id,
        Number(home),
        Number(away),
      );
      processed += 1;
    } catch (error) {
      console.error(`Lazy points refresh: match ${match.id} failed:`, error);
    }
  }

  await prisma.cronLog.create({
    data: {
      jobName: "points_lazy_refresh",
      status: "completed",
      message: `Lazy refresh: ${processed} matches processed, ${awarded} points`,
    },
  });

  return { skipped: false, processed, awarded };
}
