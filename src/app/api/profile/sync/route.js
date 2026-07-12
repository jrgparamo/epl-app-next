import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

/**
 * With Auth.js + Prisma adapter, the User row is created automatically on
 * first sign-in, so this endpoint's original job (creating a `profiles` row)
 * is mostly redundant.
 *
 * We keep it as a compatibility shim that ensures `displayName` is set from
 * the local-part of the email if it's still null. The client hook
 * `useProfileSync` calls this after sign-in.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, displayName } = body ?? {};

  const { user, response } = await requireUser();
  if (response) return response;

  if (userId && user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Only set displayName if the user doesn't already have one — never
    // overwrite an existing value here.
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, displayName: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let updatedDisplayName = existing.displayName;
    if (!existing.displayName && displayName) {
      const trimmed =
        typeof displayName === "string"
          ? displayName.trim().slice(0, 50)
          : null;
      if (trimmed) {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { displayName: trimmed },
          select: { displayName: true },
        });
        updatedDisplayName = updated.displayName;
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: existing.id,
        email: existing.email,
        display_name: updatedDisplayName,
      },
    });
  } catch (error) {
    console.error("POST /api/profile/sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync profile" },
      { status: 500 },
    );
  }
}
