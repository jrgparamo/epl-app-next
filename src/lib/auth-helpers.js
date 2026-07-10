import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Server-side helpers for API routes.
 *
 * Usage:
 *   const { user, response } = await requireUser();
 *   if (response) return response;
 *   // ... user is guaranteed defined here
 */

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}

export async function requireAdmin() {
  const { user, response } = await requireUser();
  if (response) return { user: null, response };
  if (!user.isAdmin) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user, response: null };
}

/**
 * True if `sessionUser` is a global admin OR is `is_admin` on at least one
 * league. Mirrors the effective-admin rule used by the legacy Supabase
 * routes for editing another user's predictions.
 */
export async function isEffectiveAdmin(sessionUser) {
  if (!sessionUser) return false;
  if (sessionUser.isAdmin) return true;

  const adminMembership = await prisma.leagueMember.findFirst({
    where: { userId: sessionUser.id, isAdmin: true },
    select: { id: true },
  });
  return Boolean(adminMembership);
}

/**
 * True if `sessionUser` can act on records belonging to `targetUserId`:
 * either they are the same user, or they are an effective admin.
 */
export async function canActAsUser(sessionUser, targetUserId) {
  if (!sessionUser) return false;
  if (sessionUser.id === targetUserId) return true;
  return isEffectiveAdmin(sessionUser);
}
