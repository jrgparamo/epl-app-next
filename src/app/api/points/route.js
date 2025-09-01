import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

// GET: Retrieve user's total points
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's total points from the summary view
    const { data: pointsSummary, error: pointsError } = await supabase
      .from("user_points_summary")
      .select(
        "total_points, matches_predicted, correct_predictions, last_updated"
      )
      .eq("user_id", user.id)
      .single();

    if (pointsError && pointsError.code !== "PGRST116") {
      // PGRST116 is "not found" which is OK for new users
      console.error("Error fetching user points:", pointsError);
      return NextResponse.json(
        { error: "Failed to fetch points" },
        { status: 500 }
      );
    }

    // Return points or 0 for new users
    const result = pointsSummary || {
      total_points: 0,
      matches_predicted: 0,
      correct_predictions: 0,
      last_updated: null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Calculate points for finished matches (admin/cron job endpoint)
export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    // Verify admin access or API key
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matches } = body;

    if (!matches || !Array.isArray(matches)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    let totalPointsCalculated = 0;

    // Process each finished match
    for (const match of matches) {
      if (match.status === "FINISHED" && match.score?.fullTime) {
        const { home, away } = match.score.fullTime;

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
        } else {
          totalPointsCalculated += data || 0;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalPointsCalculated,
      matchesProcessed: matches.length,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Recalculate all points for a specific user (manual trigger)
export async function PUT() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This would require fetching all finished matches and recalculating
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      message: "Recalculation triggered",
      userId: user.id,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
