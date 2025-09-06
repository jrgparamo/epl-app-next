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

// GET - Fetch user's leagues
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

    // Fetch leagues the user is a member of
    const { data: leagues, error } = await supabase
      .from("league_members")
      .select(
        `
        league_id,
        joined_at,
        is_admin,
        leagues:league_id (
          id,
          name,
          description,
          join_code,
          created_by,
          created_at,
          max_members
        )
      `
      )
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching leagues:", error);
      return NextResponse.json(
        { error: "Failed to fetch leagues" },
        { status: 500 }
      );
    }

    // Transform the data
    const userLeagues = leagues.map((membership) => ({
      id: membership.leagues.id,
      name: membership.leagues.name,
      description: membership.leagues.description,
      joinCode: membership.leagues.join_code,
      createdBy: membership.leagues.created_by,
      createdAt: membership.leagues.created_at,
      maxMembers: membership.leagues.max_members,
      joinedAt: membership.joined_at,
      isAdmin: membership.is_admin,
      isCreator: membership.leagues.created_by === user.id,
    }));

    return NextResponse.json(userLeagues);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new league or join by code
export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a join request or create request
    if (body.joinCode) {
      // Join existing league by code
      try {
        const { data, error } = await supabase.rpc("join_league_by_code", {
          code: body.joinCode.toUpperCase(),
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Fetch the league details
        const { data: league, error: fetchError } = await supabase
          .from("leagues")
          .select("*")
          .eq("id", data)
          .single();

        if (fetchError) {
          return NextResponse.json(
            { error: "Failed to fetch league details" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          id: league.id,
          name: league.name,
          description: league.description,
          joinCode: league.join_code,
          createdBy: league.created_by,
          createdAt: league.created_at,
          maxMembers: league.max_members,
          joinedAt: new Date().toISOString(),
          isAdmin: false,
          isCreator: false,
        });
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      // Create new league
      const { name, description } = body;

      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: "League name is required" },
          { status: 400 }
        );
      }

      if (name.length > 100) {
        return NextResponse.json(
          { error: "League name must be 100 characters or less" },
          { status: 400 }
        );
      }

      try {
        const { data: leagueId, error } = await supabase.rpc("create_league", {
          league_name: name.trim(),
          league_description: description?.trim() || null,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Fetch the created league details
        const { data: league, error: fetchError } = await supabase
          .from("leagues")
          .select("*")
          .eq("id", leagueId)
          .single();

        if (fetchError) {
          return NextResponse.json(
            { error: "Failed to fetch league details" },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            id: league.id,
            name: league.name,
            description: league.description,
            joinCode: league.join_code,
            createdBy: league.created_by,
            createdAt: league.created_at,
            maxMembers: league.max_members,
            joinedAt: new Date().toISOString(),
            isAdmin: true,
            isCreator: true,
          },
          { status: 201 }
        );
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a league (admin/creator only)
export async function DELETE(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("leagueId");

    if (!leagueId) {
      return NextResponse.json(
        { error: "League ID is required" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the creator or admin of the league
    const { data: membershipData, error: membershipError } = await supabase
      .from("league_members")
      .select("is_admin, leagues:league_id(created_by)")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membershipData) {
      return NextResponse.json(
        { error: "You are not a member of this league" },
        { status: 403 }
      );
    }

    const isCreator = membershipData.leagues?.created_by === user.id;
    const isAdmin = membershipData.is_admin;

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Only league creators and admins can delete leagues" },
        { status: 403 }
      );
    }

    // Delete the league (this will cascade delete members due to foreign key)
    const { error: deleteError } = await supabase
      .from("leagues")
      .delete()
      .eq("id", leagueId);

    if (deleteError) {
      console.error("League deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete league" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
