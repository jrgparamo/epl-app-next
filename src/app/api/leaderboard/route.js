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

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user to include in leaderboard
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch leaderboard from user_points_summary view
    const { data: leaderboardData, error } = await supabase
      .from("user_points_summary")
      .select(
        `
        user_id,
        total_points,
        matches_predicted,
        correct_predictions,
        profiles:user_id (
          display_name,
          email
        )
      `
      )
      .order("total_points", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      // Fallback to mock data if database fails
      return NextResponse.json(getMockLeaderboard(user));
    }

    // Transform the data for the frontend
    const leaderboard = leaderboardData.map((entry, index) => ({
      user_id: entry.user_id,
      display_name:
        entry.profiles?.display_name ||
        entry.profiles?.email?.split("@")[0] ||
        "Anonymous",
      email: entry.profiles?.email,
      predictions: entry.total_points,
      matches_predicted: entry.matches_predicted,
      correct_predictions: entry.correct_predictions,
      rank: index + 1,
      isCurrentUser: user?.id === entry.user_id,
    }));

    // If current user is not in the top 50, add them at the end
    if (user && !leaderboard.some((entry) => entry.user_id === user.id)) {
      const { data: currentUserData } = await supabase
        .from("user_points_summary")
        .select("total_points, matches_predicted, correct_predictions")
        .eq("user_id", user.id)
        .single();

      if (currentUserData) {
        leaderboard.push({
          user_id: user.id,
          display_name:
            user.user_metadata?.display_name ||
            user.email?.split("@")[0] ||
            "You",
          email: user.email,
          predictions: currentUserData.total_points,
          matches_predicted: currentUserData.matches_predicted,
          correct_predictions: currentUserData.correct_predictions,
          rank: null, // Will be calculated based on actual rank
          isCurrentUser: true,
        });
      }
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("API error:", error);
    // Return mock data on error
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return NextResponse.json(getMockLeaderboard(user));
  }
}

function getMockLeaderboard(user) {
  // For now, return mock data with the real user's display name if available
  const mockData = [
    {
      user_id: "mock-1",
      display_name: "Jorge",
      email: "jorge@example.com",
      predictions: 25,
    },
    {
      user_id: "mock-2",
      display_name: "Ricardo",
      email: "ricardo@example.com",
      predictions: 23,
    },
    {
      user_id: "mock-3",
      display_name: "Eric",
      email: "eric@example.com",
      predictions: 20,
    },
    {
      user_id: "mock-4",
      display_name: "Rob",
      email: "rob@example.com",
      predictions: 18,
    },
    {
      user_id: "mock-5",
      display_name: "Ray",
      email: "ray@example.com",
      predictions: 15,
    },
  ];

  // Add current user if authenticated
  if (user) {
    const userDisplayName =
      user.user_metadata?.display_name || user.email?.split("@")[0] || "You";
    mockData.push({
      user_id: user.id,
      display_name: userDisplayName,
      email: user.email,
      predictions: 0, // TODO: Get actual predictions from database
      isCurrentUser: true,
    });
  }

  const leaderboard = mockData
    .sort((a, b) => b.predictions - a.predictions)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

  return leaderboard;
}
