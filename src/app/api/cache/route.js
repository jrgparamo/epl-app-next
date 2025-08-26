import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * Cache management API endpoint
 * Allows manual cache invalidation and revalidation
 */

export async function POST(request) {
  try {
    const { action, matchday, tag } = await request.json();

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
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid action. Use: revalidate-all, revalidate-matches, revalidate-matchday, or revalidate-specific",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Cache management error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Cache management failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Cache management endpoint",
    availableActions: [
      "revalidate-all",
      "revalidate-matches",
      "revalidate-matchday",
      "revalidate-specific",
    ],
    usage: {
      method: "POST",
      body: {
        action: "string (required)",
        matchday: "number (optional)",
        tag: "string (required for revalidate-specific)",
      },
    },
  });
}
