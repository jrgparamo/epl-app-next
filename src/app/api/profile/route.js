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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify the user is authenticated and matches the requested userId
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return user data including metadata from auth
    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId, displayName } = await request.json();

    if (!userId || displayName === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: userId, displayName" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Verify the user is authenticated and matches the requested userId
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Trim and validate display name
    const trimmedDisplayName = displayName?.trim() || null;

    if (trimmedDisplayName && trimmedDisplayName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Update user metadata in auth
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: trimmedDisplayName,
      },
    });

    if (error) {
      console.error("Auth update error:", error);
      return NextResponse.json(
        { error: "Failed to save display name" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user_id: data.user.id,
      email: data.user.email,
      display_name: data.user.user_metadata?.display_name || null,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
