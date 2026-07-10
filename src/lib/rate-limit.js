import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by the `RateLimit` Prisma model.
 *
 * @param {string} key         — identifier ("magic_link:email@example.com", etc.)
 * @param {number} max         — maximum allowed hits per window
 * @param {number} windowMs    — window length in milliseconds
 * @returns {Promise<{ ok: boolean, remaining: number, resetAt: Date }>}
 */
export async function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  // Bucket start = floor(now / windowMs) * windowMs. All requests in the
  // same window share the same row; DB unique index keeps this atomic.
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);

  // Upsert-and-increment in one round trip.
  const row = await prisma.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  const remaining = Math.max(0, max - row.count);
  return {
    ok: row.count <= max,
    remaining,
    resetAt,
  };
}

/**
 * Convenience helper — throws with a friendly message on limit exceeded.
 */
export async function enforceRateLimit(key, max, windowMs) {
  const result = await checkRateLimit(key, max, windowMs);
  if (!result.ok) {
    const err = new Error(
      `Rate limit exceeded. Try again after ${result.resetAt.toISOString()}.`,
    );
    err.code = "RATE_LIMITED";
    err.resetAt = result.resetAt;
    throw err;
  }
  return result;
}
