import { NextRequest, NextResponse } from "next/server";
import { findUserById, requireAdmin } from "@/lib/auth";
import {
  bulkAssignLeads,
  getAllBatches,
  getAllLeads,
  insertBatch,
  makeId,
} from "@/lib/repo";
import { logActivity } from "@/lib/activity";
import { Batch, BatchStatus } from "@/types/crm";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const [batches, leads] = await Promise.all([getAllBatches(), getAllLeads()]);
  const now = new Date().toISOString();

  const leadMap = new Map(leads.map((l) => [l.id, l]));

  const enriched = batches.map((b) => {
    const batchLeads = b.leadIds
      .map((id) => leadMap.get(id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l));
    const remaining = batchLeads.filter((l) => l.status === "Assigned").length;
    const completedCount = batchLeads.length - remaining;

    let status: BatchStatus = "Live";
    if (b.visibleFrom > now) {
      status = "Scheduled";
    } else if (batchLeads.length > 0 && remaining === 0) {
      status = "Completed";
    }

    return {
      ...b,
      status,
      totalLeads: b.leadIds.length,
      remaining,
      completedCount,
    };
  });

  return NextResponse.json({ batches: enriched });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const callerId = String(body.callerId || "").trim();
    const visibleFromRaw = String(body.visibleFrom || "").trim();
    const count = Number(body.count || 0);
    const explicitLeadIds: string[] = Array.isArray(body.leadIds)
      ? body.leadIds.map(String)
      : [];

    const city = String(body.city || "").trim();
    const area = String(body.area || "").trim().toLowerCase();
    const category = String(body.category || "").trim();

    if (!callerId) {
      return NextResponse.json(
        { error: "Please select a caller." },
        { status: 400 }
      );
    }

    const caller = await findUserById(callerId);
    if (!caller || caller.role !== "caller") {
      return NextResponse.json(
        { error: "Selected caller not found." },
        { status: 404 }
      );
    }

    const visibleFrom = visibleFromRaw
      ? new Date(visibleFromRaw).toISOString()
      : new Date().toISOString();

    const allLeads = await getAllLeads();
    // Business rule: Only Unassigned leads (never worked/called unless deliberately recycled) can be assigned
    const unassignedPool = allLeads.filter((l) => l.status === "Unassigned");

    let selectedLeads = [];
    if (explicitLeadIds.length > 0) {
      const idSet = new Set(explicitLeadIds);
      selectedLeads = unassignedPool.filter((l) => idSet.has(l.id));
    } else {
      const filtered = unassignedPool.filter((l) => {
        if (city && l.city !== city) return false;
        if (area && !l.area.toLowerCase().includes(area)) return false;
        if (category && l.category !== category) return false;
        return true;
      });
      const limit = count > 0 ? count : filtered.length;
      selectedLeads = filtered.slice(0, limit);
    }

    if (selectedLeads.length === 0) {
      return NextResponse.json(
        { error: "No matching unassigned leads available to assign." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const dateLabel = new Date(visibleFrom).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
    const batchId = makeId("batch");
    const batch: Batch = {
      id: batchId,
      name: `${dateLabel} · ${caller.name}`,
      callerId: caller.id,
      callerName: caller.name,
      leadIds: selectedLeads.map((l) => l.id),
      visibleFrom,
      createdBy: auth.user.id,
      createdAt: now,
      status: visibleFrom > now ? "Scheduled" : "Live",
    };

    await insertBatch(batch);
    await bulkAssignLeads(batch.leadIds, {
      status: "Assigned",
      assignedTo: caller.id,
      assignedToName: caller.name,
      batchId,
      assignedAt: now,
      visibleFrom,
    });

    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: `Assigned batch "${batch.name}" (${batch.leadIds.length} leads) visible from ${new Date(visibleFrom).toLocaleString("en-IN")}`,
      entityType: "batch",
      entityId: batch.id,
    });

    return NextResponse.json({ batch }, { status: 201 });
  } catch (err) {
    console.error("Create batch error:", err);
    return NextResponse.json(
      { error: "Failed to assign batch." },
      { status: 500 }
    );
  }
}
