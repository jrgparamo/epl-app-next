import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const { user, response } = await requireUser();
  if (response) return response;

  if (user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const record = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user_id: record.id,
      email: record.email,
      display_name: record.displayName ?? null,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, displayName } = body ?? {};

  if (!userId || displayName === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: userId, displayName" },
      { status: 400 },
    );
  }

  const { user, response } = await requireUser();
  if (response) return response;

  if (user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const trimmed = typeof displayName === "string" ? displayName.trim() : "";
  const normalized = trimmed.length > 0 ? trimmed : null;

  if (normalized && normalized.length > 50) {
    return NextResponse.json(
      { error: "Display name must be 50 characters or less" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { displayName: normalized },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user_id: updated.id,
      email: updated.email,
      display_name: updated.displayName ?? null,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to save display name" },
      { status: 500 },
    );
  }
}
