import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllCallLogs, getLeadById, updateLead } from "@/lib/repo";
import { logActivity } from "@/lib/activity";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const lead = await getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const callLogs = await getAllCallLogs({ leadId: id });
  return NextResponse.json({ lead, callLogs });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const existing = await getLeadById(id);
  if (!existing) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = [
    "businessName",
    "category",
    "city",
    "fullAddress",
    "area",
    "whatsappNumber",
    "ownerName",
    "googleRating",
    "googleReviews",
    "googleMapsLink",
    "websiteStatus",
    "websiteUrl",
    "instagramHandle",
    "instagramFollowers",
    "facebookLink",
    "servicesToPitch",
    "suggestedWebsiteType",
    "bestTimeToCall",
    "preferredLanguage",
    "priority",
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      patch[key] = body[key];
    }
  }

  const updated = await updateLead(id, patch);
  await logActivity({
    actorId: auth.user.id,
    actorName: auth.user.name,
    actorRole: "admin",
    action: `Updated lead "${existing.businessName}"`,
    entityType: "lead",
    entityId: id,
  });

  return NextResponse.json({ lead: updated });
}
