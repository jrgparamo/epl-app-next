import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMatchPoints } from "@/lib/points";

/**
 * Cron entry point that recomputes points for all FINISHED matches.
 *
 * Vercel Cron sends a GET with `Authorization: Bearer <CRON_SECRET>`.
 * We accept both GET (Vercel Cron) and POST (manual backfills) with the
 * same auth check. A POST body of `{ matches: [...] }` scores those exact
 * matches instead of fetching live results — used for local/offline testing.
 */
async function runCron(request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Test/backfill override: POST { matches: [...] } scores the supplied
  // matches instead of fetching live finished matches from the API.
  let overrideMatches = null;
  if (request.method === "POST") {
    try {
      const body = await request.json();
      if (Array.isArray(body?.matches)) overrideMatches = body.matches;
    } catch {
      // No/invalid JSON body — fall back to the live fetch below.
    }
  }

  try {
    await prisma.cronLog.create({
      data: {
        jobName: "cron_calculate_points",
        status: "started",
        message: overrideMatches
          ? `Scoring ${overrideMatches.length} supplied matches`
          : "Fetching finished matches",
      },
    });

    let finishedMatches;
    if (overrideMatches) {
      finishedMatches = overrideMatches;
    } else {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const matchesResponse = await fetch(
        `${baseUrl}/api/matches?status=FINISHED`,
        { headers: { "Content-Type": "application/json" } },
      );

      if (!matchesResponse.ok) {
        const bodyText = await matchesResponse
          .text()
          .catch(() => "<unreadable body>");
        await prisma.cronLog.create({
          data: {
            jobName: "cron_calculate_points",
            status: "error",
            message: `Failed to fetch matches: ${matchesResponse.status} ${matchesResponse.statusText} - ${bodyText}`,
          },
        });
        throw new Error("Failed to fetch matches");
      }

      const matchesData = await matchesResponse.json();
      finishedMatches = matchesData.matches || [];
    }

    let matchesProcessed = 0;
    let totalPointsCalculated = 0;

    for (const match of finishedMatches) {
      if (match?.status !== "FINISHED" || !match?.score?.fullTime) continue;
      const { home, away } = match.score.fullTime;

      try {
        const awarded = await calculateMatchPoints(
          match.id,
          Number(home),
          Number(away),
        );
        totalPointsCalculated += awarded;
        matchesProcessed += 1;

        await prisma.cronLog.create({
          data: {
            jobName: "cron_calculate_points",
            status: "processed_match",
            message: `Match ${match.id} (${match.homeTeam?.shortName ?? "?"} ${home}-${away} ${match.awayTeam?.shortName ?? "?"}): ${awarded} points`,
          },
        });
      } catch (matchError) {
        console.error(`Error processing match ${match.id}:`, matchError);
        await prisma.cronLog.create({
          data: {
            jobName: "cron_calculate_points",
            status: "error_match",
            message: `Error processing match ${match.id}: ${matchError.message}`,
          },
        });
      }
    }

    await prisma.cronLog.create({
      data: {
        jobName: "cron_calculate_points",
        status: "completed",
        message: `Completed: ${matchesProcessed} matches processed, ${totalPointsCalculated} total points calculated`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Automatic point calculation completed",
      matchesProcessed,
      totalPointsCalculated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    try {
      await prisma.cronLog.create({
        data: {
          jobName: "cron_calculate_points",
          status: "error",
          message: `Cron job failed: ${error.message}`,
        },
      });
    } catch (logError) {
      console.error("Failed to log cron error:", logError);
    }
    return NextResponse.json(
      {
        error: "Failed to run automatic point calculation",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const GET = runCron;
export const POST = runCron;
