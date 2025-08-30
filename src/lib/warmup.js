/**
 * Cache warmup utility for server startup
 */

const WARMUP_DELAY = 5000; // Wait 5 seconds after server start
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function warmupCache() {
  // Only run in production or when explicitly enabled
  if (
    process.env.NODE_ENV !== "production" &&
    !process.env.ENABLE_CACHE_WARMUP
  ) {
    console.log("⏭️  Cache warmup skipped (development mode)");
    return;
  }

  try {
    console.log("⏰ Scheduling cache warmup...");

    // Wait for server to be fully ready
    await new Promise((resolve) => setTimeout(resolve, WARMUP_DELAY));

    const response = await fetch(`${API_BASE_URL}/api/cache-warmup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const result = await response.json();
      console.log("🔥 Cache warmup completed:", result.warmed);
    } else {
      console.warn("⚠️  Cache warmup failed:", response.statusText);
    }
  } catch (error) {
    console.warn("⚠️  Cache warmup error:", error.message);
  }
}
