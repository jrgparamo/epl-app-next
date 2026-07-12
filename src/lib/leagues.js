import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Unambiguous 32-char alphabet (excludes 0/O/1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomJoinCode(length = 6) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Generate a unique 6-char join code, retrying on collision.
 */
async function allocateJoinCode(tx, { maxAttempts = 10 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = randomJoinCode();
    const existing = await tx.league.findUnique({
      where: { joinCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique league join code");
}

/**
 * Create a league and add the creator as an admin member (atomic).
 * Mirrors the legacy `create_league` Postgres function.
 */
export async function createLeagueForUser({
  userId,
  name,
  description = null,
}) {
  return prisma.$transaction(async (tx) => {
    const joinCode = await allocateJoinCode(tx);

    const league = await tx.league.create({
      data: {
        name,
        description: description ?? null,
        joinCode,
        createdById: userId,
      },
    });

    await tx.leagueMember.create({
      data: {
        leagueId: league.id,
        userId,
        isAdmin: true,
      },
    });

    return league;
  });
}

export class LeagueJoinError extends Error {
  constructor(message, { status = 400 } = {}) {
    super(message);
    this.name = "LeagueJoinError";
    this.status = status;
  }
}

/**
 * Join a league by its join code. Mirrors the legacy `join_league_by_code`
 * Postgres function.
 */
export async function joinLeagueByCode({ userId, code }) {
  const normalizedCode = String(code || "").toUpperCase();
  if (!normalizedCode) {
    throw new LeagueJoinError("Join code is required");
  }

  return prisma.$transaction(async (tx) => {
    const league = await tx.league.findUnique({
      where: { joinCode: normalizedCode },
    });
    if (!league || !league.isActive) {
      throw new LeagueJoinError("League not found or inactive", {
        status: 404,
      });
    }

    const already = await tx.leagueMember.findUnique({
      where: {
        leagueId_userId: { leagueId: league.id, userId },
      },
      select: { id: true },
    });
    if (already) {
      throw new LeagueJoinError("Already a member of this league");
    }

    const memberCount = await tx.leagueMember.count({
      where: { leagueId: league.id },
    });
    if (memberCount >= league.maxMembers) {
      throw new LeagueJoinError("League is full", { status: 400 });
    }

    await tx.leagueMember.create({
      data: {
        leagueId: league.id,
        userId,
        isAdmin: false,
      },
    });

    return league;
  });
}
