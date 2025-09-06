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

// GET - Fetch league leaderboard
export async function GET(request, { params }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { leagueId } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a member of this league
    const { data: membership, error: membershipError } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this league." },
        { status: 403 }
      );
    }

    // Fetch league leaderboard
    const { data: leaderboardData, error } = await supabase
      .from("league_leaderboard")
      .select(
        `
        league_id,
        league_name,
        user_id,
        total_points,
        matches_predicted,
        correct_predictions,
        joined_at,
        is_admin,
        rank
      `
      )
      .eq("league_id", leagueId)
      .order("rank");

    if (error) {
      console.error("Error fetching league leaderboard:", error);
      return NextResponse.json(
        { error: "Failed to fetch league leaderboard" },
        { status: 500 }
      );
    }

    // Get user metadata for display names - use profiles table as primary source
    const userIds = leaderboardData.map((entry) => entry.user_id);
    let usersData = null;

    // Debug: Log current user info
    console.log("Current user info:", {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name,
      userIds: userIds,
    });

    // Primary approach: Use profiles table since it's populated
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching from profiles table:", profilesError);
      }

      usersData = {
        users:
          profilesData?.map((p) => ({
            id: p.id,
            email: p.email,
            user_metadata: { display_name: p.display_name },
          })) || [],
      };
      console.log(
        "Profiles table success, profiles found:",
        profilesData?.length || 0
      );
      console.log("Profile data sample:", profilesData?.slice(0, 2));
    } catch (error) {
      console.warn("Could not fetch from profiles table:", error);

      // Fallback: try admin API
      try {
        const { data } = await supabase.auth.admin.listUsers({
          filter: `id.in.(${userIds.join(",")})`,
        });
        usersData = data;
        console.log(
          "Admin API fallback success, users found:",
          usersData?.users?.length || 0
        );
      } catch (adminError) {
        console.warn("Admin API also failed:", adminError);
        usersData = { users: [] };
      }
    }

    // Transform the data for the frontend
    const leaderboard = leaderboardData.map((entry) => {
      const userData = usersData?.users?.find((u) => u.id === entry.user_id);

      // For the current user, prioritize their auth metadata
      let display_name = "Anonymous";
      let email = null;

      if (entry.user_id === user.id) {
        // Current user - use their auth data directly
        display_name =
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "You";
        email = user.email;
      } else {
        // Other users - use fetched data
        const profileDisplayName = userData?.user_metadata?.display_name;
        const profileEmail = userData?.email;

        display_name =
          profileDisplayName || profileEmail?.split("@")[0] || "Anonymous";
        email = profileEmail;
      }

      console.log("Processing user:", {
        user_id: entry.user_id,
        isCurrent: entry.user_id === user.id,
        userData: userData,
        final_display_name: display_name,
        final_email: email,
      });

      return {
        user_id: entry.user_id,
        display_name: display_name,
        email: email,
        points: entry.total_points,
        matches_predicted: entry.matches_predicted,
        correct_predictions: entry.correct_predictions,
        rank: entry.rank,
        joinedAt: entry.joined_at,
        isAdmin: entry.is_admin,
        isCurrentUser: user?.id === entry.user_id,
      };
    });

    // Get league info
    const { data: leagueInfo, error: leagueError } = await supabase
      .from("leagues")
      .select("name, description, join_code, created_by, max_members")
      .eq("id", leagueId)
      .single();

    if (leagueError) {
      console.error("Error fetching league info:", error);
      return NextResponse.json(
        { error: "Failed to fetch league information" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      league: {
        id: leagueId,
        name: leagueInfo.name,
        description: leagueInfo.description,
        joinCode: leagueInfo.join_code,
        createdBy: leagueInfo.created_by,
        maxMembers: leagueInfo.max_members,
        memberCount: leaderboard.length,
      },
      leaderboard,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
