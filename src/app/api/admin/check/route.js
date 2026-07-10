import { NextResponse } from "next/server";
import { getSessionUser, isEffectiveAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { isAdmin: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const isAdmin = await isEffectiveAdmin(user);
  return NextResponse.json({ isAdmin });
}
