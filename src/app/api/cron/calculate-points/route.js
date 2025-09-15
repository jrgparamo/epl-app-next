import { NextResponse } from "next/server";

// This endpoint can be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
// to automatically calculate points when matches finish
export async function POST(request) {
  try {
    // Verify the request is from authorized source
    const authHeader = request.headers.get("authorization");
    // Use server-only CRON_SECRET
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting automatic point calculation...");

    // Fetch finished matches from the matches API
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    console.log(`Using base URL: ${baseUrl}/api/matches?status=FINISHED`);
    const matchesResponse = await fetch(
      `${baseUrl}/api/matches?status=FINISHED`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("matches response status", matchesResponse.status);
    if (!matchesResponse.ok) {
      const bodyText = await matchesResponse
        .text()
        .catch(() => "<unreadable body>");
      console.error(
        `Failed to fetch matches: ${matchesResponse.status} ${matchesResponse.statusText} - ${bodyText}`
      );
      throw new Error("Failed to fetch matches");
    }

    const matchesData = await matchesResponse.json();
    const finishedMatches = matchesData.matches || [];

    console.log(`Found ${finishedMatches.length} finished matches`);

    // Calculate points for finished matches
    const pointsResponse = await fetch(`${baseUrl}/api/points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({
        matches: finishedMatches,
      }),
    });

    if (!pointsResponse.ok) {
      throw new Error("Failed to calculate points");
    }

    const pointsResult = await pointsResponse.json();

    console.log("Point calculation completed:", pointsResult);

    return NextResponse.json({
      success: true,
      message: "Automatic point calculation completed",
      ...pointsResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Failed to run automatic point calculation",
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
    service: "automatic-points-calculation",
    timestamp: new Date().toISOString(),
  });
}
