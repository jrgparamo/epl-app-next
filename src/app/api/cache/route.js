import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import apiCache from "@/lib/api-cache";
import { requireAdmin } from "@/lib/auth-helpers";

/**
 * Cache management API endpoint
 * Allows manual cache invalidation and revalidation
 */

export async function POST(request) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { action, tag } = await request.json();

    switch (action) {
      case "revalidate-all":
        // Revalidate all cached data
        revalidateTag("matches");
        revalidateTag("matchday");
        return NextResponse.json({
          success: true,
          message: "All cache revalidated",
        });

      case "revalidate-matches":
        // Revalidate matches cache
        revalidateTag("matches");
        return NextResponse.json({
          success: true,
          message: "Matches cache revalidated",
        });

      case "revalidate-matchday":
        // Revalidate current matchday cache
        revalidateTag("matchday");
        return NextResponse.json({
          success: true,
          message: "Matchday cache revalidated",
        });

      case "revalidate-specific":
        // Revalidate specific tag
        if (tag) {
          revalidateTag(tag);
          return NextResponse.json({
            success: true,
            message: `Tag '${tag}' revalidated`,
          });
        }
        return NextResponse.json(
          {
            success: false,
            message: "Tag parameter required",
          },
          { status: 400 },
        );

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid action. Use: revalidate-all, revalidate-matches, revalidate-matchday, or revalidate-specific",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Cache management error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Cache management failed",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const stats = apiCache.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get cache stats:", error);
    return NextResponse.json(
      { error: "Failed to get cache stats" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    apiCache.clear(key);

    return NextResponse.json({
      success: true,
      message: key ? `Cleared cache for ${key}` : "Cleared all cache",
    });
  } catch (error) {
    console.error("Failed to clear cache:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 },
    );
  }
}
