import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollection, stripMongoId } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { Batch, CallLog, Lead } from "@/types/crm";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const explicitLeadIds: string[] = Array.isArray(body.leadIds)
      ? body.leadIds.map(String)
      : [];
    const batchId = body.batchId ? String(body.batchId).trim() : "";
    const recallAllUncalled = Boolean(body.recallAllUncalled);

    const [
      { col: leadCol, memory },
      { col: logCol },
      { col: batchCol },
    ] = await Promise.all([
      getCollection<Lead>("leads"),
      getCollection<CallLog>("callLogs"),
      getCollection<Batch>("batches"),
    ]);

    let candidateLeads: Lead[] = [];

    if (batchId && recallAllUncalled) {
      candidateLeads = leadCol
        ? (await leadCol.find({ batchId }).toArray()).map(
            (d) => stripMongoId(d) as Lead
          )
        : memory.leads.filter((l) => l.batchId === batchId);
    } else if (explicitLeadIds.length > 0) {
      candidateLeads = leadCol
        ? (
            await leadCol
              .find({ id: { $in: explicitLeadIds } })
              .toArray()
          ).map((d) => stripMongoId(d) as Lead)
        : memory.leads.filter((l) => explicitLeadIds.includes(l.id));
    } else {
      return NextResponse.json(
        { error: "Provide leadIds or batchId with recallAllUncalled." },
        { status: 400 }
      );
    }

    if (candidateLeads.length === 0) {
      return NextResponse.json(
        { error: "No matching leads found to recall." },
        { status: 404 }
      );
    }

    // Check which candidate leads have any CallLog entries
    const candidateIds = candidateLeads.map((l) => l.id);
    const existingLogLeadIds = new Set<string>();
    if (logCol) {
      const logDocs = await logCol
        .find({ leadId: { $in: candidateIds } }, { projection: { leadId: 1 } })
        .toArray();
      logDocs.forEach((d) => existingLogLeadIds.add(String(d.leadId)));
    } else {
      memory.callLogs
        .filter((c) => candidateIds.includes(c.leadId))
        .forEach((c) => existingLogLeadIds.add(c.leadId));
    }

    const recallable: Lead[] = [];
    const blocked: { id: string; businessName: string; reason: string }[] = [];

    for (const l of candidateLeads) {
      if (l.callCount > 0 || existingLogLeadIds.has(l.id)) {
        blocked.push({
          id: l.id,
          businessName: l.businessName,
          reason: "Already called — use Recycle instead",
        });
      } else if (l.status !== "Assigned") {
        blocked.push({
          id: l.id,
          businessName: l.businessName,
          reason: `Status is "${l.status}", not "Assigned"`,
        });
      } else {
        recallable.push(l);
      }
    }

    if (recallable.length === 0) {
      return NextResponse.json(
        {
          error:
            blocked[0]?.reason ||
            "Selected leads cannot be recalled because they already have call outcomes. Use Recycle instead.",
          blocked,
        },
        { status: 400 }
      );
    }

    const recallIds = recallable.map((l) => l.id);
    const now = new Date().toISOString();

    if (leadCol) {
      await leadCol.updateMany(
        { id: { $in: recallIds } },
        {
          $set: {
            status: "Unassigned",
            assignedTo: null,
            assignedToName: null,
            batchId: null,
            assignedAt: null,
            visibleFrom: null,
            updatedAt: now,
          },
        }
      );
    } else {
      const rSet = new Set(recallIds);
      memory.leads = memory.leads.map((l) =>
        rSet.has(l.id)
          ? {
              ...l,
              status: "Unassigned",
              assignedTo: null,
              assignedToName: null,
              batchId: null,
              assignedAt: null,
              visibleFrom: null,
              updatedAt: now,
            }
          : l
      );
    }

    // Update affected batches (remove recalled leadIds; mark Recalled if empty)
    const affectedBatchIds = Array.from(
      new Set(recallable.map((l) => l.batchId).filter((x): x is string => Boolean(x)))
    );
    const recallSet = new Set(recallIds);

    for (const bId of affectedBatchIds) {
      if (batchCol) {
        const bDoc = await batchCol.findOne({ id: bId });
        if (bDoc) {
          const nextLeadIds = (bDoc.leadIds || []).filter(
            (id: string) => !recallSet.has(id)
          );
          await batchCol.updateOne(
            { id: bId },
            {
              $set: {
                leadIds: nextLeadIds,
                ...(nextLeadIds.length === 0 ? { status: "Recalled" } : {}),
              },
            }
          );
        }
      } else {
        const idx = memory.batches.findIndex((b) => b.id === bId);
        if (idx !== -1) {
          const nextLeadIds = memory.batches[idx].leadIds.filter(
            (id) => !recallSet.has(id)
          );
          memory.batches[idx] = {
            ...memory.batches[idx],
            leadIds: nextLeadIds,
            status:
              nextLeadIds.length === 0 ? "Recalled" : memory.batches[idx].status,
          };
        }
      }
    }

    const fromCallers = Array.from(
      new Set(recallable.map((l) => l.assignedToName || "caller"))
    ).join(", ");

    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: `Recalled ${recallable.length} uncalled lead(s) from ${fromCallers} back to Unassigned pool`,
      entityType: "lead",
      entityId: batchId || recallIds[0],
      details:
        blocked.length > 0
          ? `${blocked.length} lead(s) skipped (already called or not Assigned)`
          : undefined,
    });

    return NextResponse.json({
      recalledCount: recallable.length,
      skippedCount: blocked.length,
      blocked,
    });
  } catch (err) {
    console.error("Recall leads error:", err);
    return NextResponse.json(
      { error: "Failed to recall leads." },
      { status: 500 }
    );
  }
}
