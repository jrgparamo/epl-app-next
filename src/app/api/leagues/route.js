import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import {
  createLeagueForUser,
  joinLeagueByCode,
  LeagueJoinError,
} from "@/lib/leagues";

function toApiShape(league, membership, currentUserId) {
  return {
    id: league.id,
    name: league.name,
    description: league.description,
    joinCode: league.joinCode,
    createdBy: league.createdById,
    createdAt: league.createdAt,
    maxMembers: league.maxMembers,
    joinedAt: membership?.joinedAt ?? null,
    isAdmin: membership?.isAdmin ?? false,
    isCreator: league.createdById === currentUserId,
  };
}

// GET — leagues the current user belongs to.
export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const memberships = await prisma.leagueMember.findMany({
      where: { userId: user.id },
      include: { league: true },
    });

    const payload = memberships.map((m) => toApiShape(m.league, m, user.id));
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/leagues error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leagues" },
      { status: 500 },
    );
  }
}

// POST — create a new league OR join by code.
export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Join by code branch.
  if (body?.joinCode) {
    try {
      const league = await joinLeagueByCode({
        userId: user.id,
        code: body.joinCode,
      });
      return NextResponse.json(
        toApiShape(league, { joinedAt: new Date(), isAdmin: false }, user.id),
      );
    } catch (error) {
      if (error instanceof LeagueJoinError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error("POST /api/leagues (join) error:", error);
      return NextResponse.json(
        { error: "Failed to join league" },
        { status: 500 },
      );
    }
  }

  // Create branch.
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";

  if (name.length === 0) {
    return NextResponse.json(
      { error: "League name is required" },
      { status: 400 },
    );
  }
  if (name.length > 100) {
    return NextResponse.json(
      { error: "League name must be 100 characters or less" },
      { status: 400 },
    );
  }

  try {
    const league = await createLeagueForUser({
      userId: user.id,
      name,
      description: description || null,
    });
    return NextResponse.json(
      toApiShape(league, { joinedAt: new Date(), isAdmin: true }, user.id),
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/leagues (create) error:", error);
    return NextResponse.json(
      { error: "Failed to create league" },
      { status: 500 },
    );
  }
}

// DELETE — remove a league (creator or admin only).
export async function DELETE(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  if (!leagueId) {
    return NextResponse.json(
      { error: "League ID is required" },
      { status: 400 },
    );
  }

  try {
    const [league, membership] = await Promise.all([
      prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, createdById: true },
      }),
      prisma.leagueMember.findUnique({
        where: { leagueId_userId: { leagueId, userId: user.id } },
        select: { isAdmin: true },
      }),
    ]);

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this league" },
        { status: 403 },
      );
    }

    const isCreator = league.createdById === user.id;
    if (!isCreator && !membership.isAdmin) {
      return NextResponse.json(
        { error: "Only league creators and admins can delete leagues" },
        { status: 403 },
      );
    }

    await prisma.league.delete({ where: { id: leagueId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/leagues error:", error);
    return NextResponse.json(
      { error: "Failed to delete league" },
      { status: 500 },
    );
  }
}
