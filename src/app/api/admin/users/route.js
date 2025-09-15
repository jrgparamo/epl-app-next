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

// Helper function to check if user is admin
async function checkAdminStatus(supabase) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin via user metadata
  const isAdmin =
    user?.user_metadata?.is_admin === true ||
    user?.user_metadata?.is_admin === "true";

  // Also check if user is admin of any league (alternative admin check)
  if (!isAdmin) {
    const { data: adminMemberships } = await supabase
      .from("league_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_admin", true)
      .limit(1);

    const isLeagueAdmin = adminMemberships && adminMemberships.length > 0;
    return { user, isAdmin: isLeagueAdmin };
  }

  return { user, isAdmin };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { isAdmin } = await checkAdminStatus(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all users from profiles table
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    return NextResponse.json(profiles || []);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
