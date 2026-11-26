import { NextRequest, NextResponse } from "next/server";
import { requireCaller } from "@/lib/auth";
import {
  getLeadById,
  insertCallLog,
  makeId,
  updateLead,
} from "@/lib/repo";
import { getPhoneLast4 } from "@/lib/phone";
import { logActivity } from "@/lib/activity";
import { CALL_OUTCOMES, CallLog, CallOutcome, DurationFeel } from "@/types/crm";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireCaller();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const lead = await getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Strict ownership check
  if (lead.assignedTo !== auth.user.id) {
    return NextResponse.json(
      { error: "Forbidden: This lead is not assigned to you." },
      { status: 403 }
    );
  }

  const nowIso = new Date().toISOString();
  if (lead.visibleFrom && lead.visibleFrom > nowIso) {
    return NextResponse.json(
      { error: "Forbidden: This batch is not visible yet." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const outcome = body.outcome as CallOutcome;
    const note = String(body.note || "").trim();
    const followUpDate = body.followUpDate ? String(body.followUpDate) : null;
    const durationFeel = body.durationFeel as DurationFeel | undefined;

    if (!CALL_OUTCOMES.includes(outcome)) {
      return NextResponse.json(
        { error: "Invalid call outcome." },
        { status: 400 }
      );
    }

    if (outcome === "Callback" && !followUpDate) {
      return NextResponse.json(
        { error: "Follow-up date is required for Callback." },
        { status: 400 }
      );
    }

    const callLog: CallLog = {
      id: makeId("call"),
      leadId: lead.id,
      leadName: lead.businessName,
      leadPhoneLast4: getPhoneLast4(lead.phone),
      callerId: auth.user.id,
      callerName: auth.user.name,
      calledAt: nowIso,
      outcome,
      note: note || undefined,
      followUpDate: outcome === "Callback" ? followUpDate : null,
      durationFeel,
    };

    await insertCallLog(callLog);

    await updateLead(lead.id, {
      status: outcome,
      followUpDate: outcome === "Callback" ? followUpDate : null,
      lastCalledAt: nowIso,
      callCount: (lead.callCount || 0) + 1,
    });

    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "caller",
      action: `Called "${lead.businessName}" → ${outcome}`,
      entityType: "lead",
      entityId: lead.id,
      details: note || undefined,
    });

    return NextResponse.json({ success: true, callLog });
  } catch (err) {
    console.error("Save call outcome error:", err);
    return NextResponse.json(
      { error: "Failed to save call outcome." },
      { status: 500 }
    );
  }
}
