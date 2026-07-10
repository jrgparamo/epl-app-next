import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isEffectiveAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEffectiveAdmin(user))) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Preserve legacy snake_case shape.
    const payload = users.map((u) => ({
      id: u.id,
      email: u.email,
      display_name: u.displayName,
      created_at: u.createdAt,
      updated_at: u.updatedAt,
    }));
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
