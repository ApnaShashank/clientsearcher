import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getRecentActivities } from "@/lib/repo";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const activities = await getRecentActivities(150);
  return NextResponse.json({ activities });
}
