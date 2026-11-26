import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { getAppSettings, updateAppSettings } from "@/lib/repo";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const settings = await getAppSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const patch: {
      cities?: string[];
      categories?: string[];
      servicesToPitch?: string[];
    } = {};

    if (Array.isArray(body.cities)) {
      patch.cities = Array.from(
        new Set(body.cities.map((c: unknown) => String(c).trim()).filter(Boolean))
      );
    }
    if (Array.isArray(body.categories)) {
      patch.categories = Array.from(
        new Set(body.categories.map((c: unknown) => String(c).trim()).filter(Boolean))
      );
    }
    if (Array.isArray(body.servicesToPitch)) {
      patch.servicesToPitch = Array.from(
        new Set(
          body.servicesToPitch.map((c: unknown) => String(c).trim()).filter(Boolean)
        )
      );
    }

    const updated = await updateAppSettings(patch);
    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: "Updated CRM dropdown settings",
      entityType: "settings",
      entityId: "default",
    });

    return NextResponse.json({ settings: updated });
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 }
    );
  }
}
