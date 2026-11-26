import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollection, stripMongoId } from "@/lib/db";
import { getRecentActivities } from "@/lib/repo";
import { CallLog, Lead } from "@/types/crm";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const outcome = searchParams.get("outcome")?.trim() || "";
  const callerId = searchParams.get("callerId")?.trim() || "";
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));

  const [{ col: leadCol, memory }, { col: logCol }, activities] =
    await Promise.all([
      getCollection<Lead>("leads"),
      getCollection<CallLog>("callLogs"),
      getRecentActivities(100),
    ]);

  if (leadCol && logCol) {
    const query: Record<string, unknown> = { callCount: { $gt: 0 } };
    if (outcome) query.status = outcome;
    if (callerId) query.assignedTo = callerId;
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { businessName: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
        { city: { $regex: escaped, $options: "i" } },
        { area: { $regex: escaped, $options: "i" } },
        { assignedToName: { $regex: escaped, $options: "i" } },
      ];
    }

    const [total, docs] = await Promise.all([
      leadCol.countDocuments(query),
      leadCol
        .find(query)
        .sort({ lastCalledAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);

    const leadsPage = docs.map((d) => stripMongoId(d) as Lead);
    const leadIds = leadsPage.map((l) => l.id);
    const logs = leadIds.length
      ? (
          await logCol
            .find({ leadId: { $in: leadIds } })
            .sort({ calledAt: -1 })
            .toArray()
        ).map((d) => stripMongoId(d) as CallLog)
      : [];

    const logsByLead = new Map<string, CallLog[]>();
    for (const log of logs) {
      const arr = logsByLead.get(log.leadId) || [];
      arr.push(log);
      logsByLead.set(log.leadId, arr);
    }

    const workedLeads = leadsPage.map((l) => ({
      ...l,
      callHistory: logsByLead.get(l.id) || [],
    }));

    return NextResponse.json({
      workedLeads,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      activities,
    });
  }

  // In-memory fallback
  const logsByLead = new Map<string, CallLog[]>();
  for (const log of memory.callLogs) {
    const arr = logsByLead.get(log.leadId) || [];
    arr.push(log);
    logsByLead.set(log.leadId, arr);
  }

  const qLower = q.toLowerCase();
  const allWorked = memory.leads
    .filter((l) => l.callCount > 0 || (logsByLead.get(l.id)?.length || 0) > 0)
    .map((l) => ({
      ...l,
      callHistory: logsByLead.get(l.id) || [],
    }))
    .filter((l) => {
      if (outcome && l.status !== outcome) return false;
      if (
        callerId &&
        l.assignedTo !== callerId &&
        !l.callHistory.some((c) => c.callerId === callerId)
      ) {
        return false;
      }
      if (qLower) {
        const hay = `${l.businessName} ${l.phone} ${l.city} ${l.area} ${
          l.assignedToName || ""
        }`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    })
    .sort((a, b) =>
      (b.lastCalledAt || b.updatedAt).localeCompare(a.lastCalledAt || a.updatedAt)
    );

  const total = allWorked.length;
  return NextResponse.json({
    workedLeads: allWorked.slice((page - 1) * limit, page * limit),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    activities,
  });
}
