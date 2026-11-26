import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getLeadById, updateLead } from "@/lib/repo";
import { logActivity } from "@/lib/activity";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const lead = await getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  let reason = "";
  try {
    const body = await request.json();
    reason = String(body.reason || "").trim();
  } catch {
    // optional body
  }

  const prevStatus = lead.status;
  const updated = await updateLead(id, {
    status: "Unassigned",
    assignedTo: null,
    assignedToName: null,
    batchId: null,
    assignedAt: null,
    visibleFrom: null,
    followUpDate: null,
  });

  await logActivity({
    actorId: auth.user.id,
    actorName: auth.user.name,
    actorRole: "admin",
    action: `Recycled lead "${lead.businessName}" from "${prevStatus}" back to Unassigned pool`,
    entityType: "lead",
    entityId: id,
    details: reason || undefined,
  });

  return NextResponse.json({ lead: updated });
}
