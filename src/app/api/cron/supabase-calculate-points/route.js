import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint is specifically designed to be called by Supabase pg_cron
// It will fetch finished matches and calculate points internally
export async function POST(request) {
  try {
    // Verify the request is from Supabase or authorized source
    const authHeader = request.headers.get("authorization");
    const supabaseSecret =
      process.env.SUPABASE_CRON_SECRET || process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${supabaseSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting Supabase cron point calculation...");

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Log the start of the job
    await supabase.from("cron_logs").insert({
      job_name: "supabase_cron_calculate_points",
      status: "started",
      message: "Starting Supabase cron points calculation",
    });

    // Fetch finished matches from the Football Data API
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log(
      `Fetching finished matches from: ${baseUrl}/api/matches?status=FINISHED`
    );

    const matchesResponse = await fetch(
      `${baseUrl}/api/matches?status=FINISHED`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!matchesResponse.ok) {
      const errorText = await matchesResponse
        .text()
        .catch(() => "<unreadable>");
      console.error(
        `Failed to fetch matches: ${matchesResponse.status} - ${errorText}`
      );

      await supabase.from("cron_logs").insert({
        job_name: "supabase_cron_calculate_points",
        status: "error",
        message: `Failed to fetch matches: ${matchesResponse.status} - ${errorText}`,
      });

      throw new Error("Failed to fetch matches");
    }

    const matchesData = await matchesResponse.json();
    const finishedMatches = matchesData.matches || [];

    console.log(`Found ${finishedMatches.length} finished matches`);

    if (finishedMatches.length === 0) {
      await supabase.from("cron_logs").insert({
        job_name: "supabase_cron_calculate_points",
        status: "completed",
        message: "No finished matches found to process",
      });

      return NextResponse.json({
        success: true,
        message: "No finished matches to process",
        matchesProcessed: 0,
        totalPointsCalculated: 0,
      });
    }

    let totalPointsCalculated = 0;
    let matchesProcessed = 0;

    // Process each finished match
    for (const match of finishedMatches) {
      if (match.status === "FINISHED" && match.score?.fullTime) {
        const { home, away } = match.score.fullTime;

        try {
          // Check if this match already had points calculated recently (within 24 hours)
          const { data: recentPoints } = await supabase
            .from("user_points")
            .select("calculated_at")
            .eq("match_id", match.id.toString())
            .gte(
              "calculated_at",
              new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            )
            .limit(1);

          if (recentPoints && recentPoints.length > 0) {
            console.log(
              `Skipping match ${match.id} - points calculated recently`
            );
            continue;
          }

          // Call the database function to calculate points
          const { data, error } = await supabase.rpc("calculate_match_points", {
            match_id_param: match.id.toString(),
            home_score_actual: home,
            away_score_actual: away,
          });

          if (error) {
            console.error(
              `Error calculating points for match ${match.id}:`,
              error
            );

            await supabase.from("cron_logs").insert({
              job_name: "supabase_cron_calculate_points",
              status: "error_match",
              message: `Error calculating points for match ${match.id}: ${error.message}`,
            });
          } else {
            const pointsCalculated = data || 0;
            totalPointsCalculated += pointsCalculated;
            matchesProcessed++;

            console.log(
              `Calculated ${pointsCalculated} points for match ${match.id} (${match.homeTeam.shortName} ${home}-${away} ${match.awayTeam.shortName})`
            );

            await supabase.from("cron_logs").insert({
              job_name: "supabase_cron_calculate_points",
              status: "processed_match",
              message: `Match ${match.id} (${match.homeTeam.shortName} ${home}-${away} ${match.awayTeam.shortName}): ${pointsCalculated} points calculated`,
            });
          }
        } catch (matchError) {
          console.error(`Error processing match ${match.id}:`, matchError);

          await supabase.from("cron_logs").insert({
            job_name: "supabase_cron_calculate_points",
            status: "error_match",
            message: `Error processing match ${match.id}: ${matchError.message}`,
          });
        }
      }
    }

    // Log completion
    await supabase.from("cron_logs").insert({
      job_name: "supabase_cron_calculate_points",
      status: "completed",
      message: `Completed: ${matchesProcessed} matches processed, ${totalPointsCalculated} total points calculated`,
    });

    console.log(
      `Supabase cron job completed: ${matchesProcessed} matches processed, ${totalPointsCalculated} points calculated`
    );

    return NextResponse.json({
      success: true,
      message: "Supabase cron point calculation completed",
      matchesProcessed,
      totalPointsCalculated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Supabase cron job error:", error);

    // Try to log the error (might fail if Supabase is down)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      await supabase.from("cron_logs").insert({
        job_name: "supabase_cron_calculate_points",
        status: "error",
        message: `Cron job failed: ${error.message}`,
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return NextResponse.json(
      {
        error: "Failed to run Supabase cron point calculation",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "supabase-cron-points-calculation",
    timestamp: new Date().toISOString(),
  });
}
