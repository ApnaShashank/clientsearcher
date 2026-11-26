import { NextRequest, NextResponse } from "next/server";
import { findUserById, requireAdmin } from "@/lib/auth";
import { getCollection, stripMongoId } from "@/lib/db";
import { bulkAssignLeads, insertBatch, makeId } from "@/lib/repo";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { Batch, BatchStatus, Lead } from "@/types/crm";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));

  const [{ col: batchCol, memory }, { col: leadCol }] = await Promise.all([
    getCollection<Batch>("batches"),
    getCollection<Lead>("leads"),
  ]);

  const now = new Date().toISOString();

  if (batchCol && leadCol) {
    const [total, batchDocs] = await Promise.all([
      batchCol.countDocuments({}),
      batchCol
        .find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);

    const batches = batchDocs.map((d) => stripMongoId(d) as Batch);
    const batchIds = batches.map((b) => b.id);

    const leadStats = await leadCol
      .aggregate([
        { $match: { batchId: { $in: batchIds } } },
        {
          $group: {
            _id: "$batchId",
            totalLeads: { $sum: 1 },
            remaining: {
              $sum: { $cond: [{ $eq: ["$status", "Assigned"] }, 1, 0] },
            },
            uncalled: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "Assigned"] },
                      { $eq: ["$callCount", 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const statsMap = new Map(
      leadStats.map((s) => [
        String(s._id),
        {
          totalLeads: Number(s.totalLeads || 0),
          remaining: Number(s.remaining || 0),
          uncalled: Number(s.uncalled || 0),
        },
      ])
    );

    const enriched = batches.map((b) => {
      const st = statsMap.get(b.id) || {
        totalLeads: b.leadIds.length,
        remaining: 0,
        uncalled: 0,
      };
      const completedCount = Math.max(0, st.totalLeads - st.remaining);
      let status: BatchStatus = b.status === "Recalled" ? "Recalled" : "Live";
      if (st.totalLeads === 0 || b.status === "Recalled") {
        status = "Recalled";
      } else if (b.visibleFrom > now) {
        status = "Scheduled";
      } else if (st.remaining === 0) {
        status = "Completed";
      }

      return {
        ...b,
        status,
        totalLeads: st.totalLeads,
        remaining: st.remaining,
        uncalledCount: st.uncalled,
        completedCount,
      };
    });

    return NextResponse.json({
      batches: enriched,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }

  // In-memory fallback
  const sorted = [...memory.batches].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const total = sorted.length;
  const pageItems = sorted.slice((page - 1) * limit, page * limit);
  const leadMap = new Map(memory.leads.map((l) => [l.id, l]));

  const enriched = pageItems.map((b) => {
    const batchLeads = b.leadIds
      .map((id) => leadMap.get(id))
      .filter((l): l is Lead => Boolean(l));
    const remaining = batchLeads.filter((l) => l.status === "Assigned").length;
    const uncalledCount = batchLeads.filter(
      (l) => l.status === "Assigned" && l.callCount === 0
    ).length;
    const completedCount = batchLeads.length - remaining;

    let status: BatchStatus = "Live";
    if (batchLeads.length === 0 || b.status === "Recalled") {
      status = "Recalled";
    } else if (b.visibleFrom > now) {
      status = "Scheduled";
    } else if (remaining === 0) {
      status = "Completed";
    }

    return {
      ...b,
      status,
      totalLeads: batchLeads.length,
      remaining,
      uncalledCount,
      completedCount,
    };
  });

  return NextResponse.json({
    batches: enriched,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
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

    const { col: leadCol, memory } = await getCollection<Lead>("leads");
    let selectedLeads: Lead[] = [];

    if (leadCol) {
      const query: Record<string, unknown> = { status: "Unassigned" };
      if (explicitLeadIds.length > 0) {
        query.id = { $in: explicitLeadIds };
      } else {
        if (city) query.city = city;
        if (area) query.area = { $regex: area, $options: "i" };
        if (category) query.category = category;
      }
      const cursor = leadCol.find(query).sort({ createdAt: -1 });
      if (explicitLeadIds.length === 0 && count > 0) {
        cursor.limit(count);
      }
      selectedLeads = (await cursor.toArray()).map(
        (d) => stripMongoId(d) as Lead
      );
    } else {
      const unassignedPool = memory.leads.filter((l) => l.status === "Unassigned");
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
        selectedLeads = count > 0 ? filtered.slice(0, count) : filtered;
      }
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
    const isScheduled = visibleFrom > now;
    const batch: Batch = {
      id: batchId,
      name: `${dateLabel} · ${caller.name}`,
      callerId: caller.id,
      callerName: caller.name,
      leadIds: selectedLeads.map((l) => l.id),
      visibleFrom,
      createdBy: auth.user.id,
      createdAt: now,
      status: isScheduled ? "Scheduled" : "Live",
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

    await createNotification({
      recipientId: caller.id,
      title: isScheduled ? "New Batch Scheduled" : "New Leads Assigned",
      message: isScheduled
        ? `${batch.leadIds.length} lead(s) scheduled for you — visible from ${new Date(visibleFrom).toLocaleString("en-IN")}.`
        : `${batch.leadIds.length} new lead(s) assigned to your Today queue.`,
      type: "batch",
      entityId: isScheduled ? `sched_${batch.id}` : `live_${batch.id}`,
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
