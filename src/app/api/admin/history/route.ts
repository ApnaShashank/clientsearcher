import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllCallLogs, getAllLeads, getRecentActivities } from "@/lib/repo";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const outcome = searchParams.get("outcome")?.trim() || "";
  const callerId = searchParams.get("callerId")?.trim() || "";
  const q = searchParams.get("q")?.trim().toLowerCase() || "";

  const [leads, callLogs, activities] = await Promise.all([
    getAllLeads(),
    getAllCallLogs(),
    getRecentActivities(150),
  ]);

  const logsByLead = new Map<string, typeof callLogs>();
  for (const log of callLogs) {
    const arr = logsByLead.get(log.leadId) || [];
    arr.push(log);
    logsByLead.set(log.leadId, arr);
  }

  const workedLeads = leads
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
      if (q) {
        const hay = `${l.businessName} ${l.phone} ${l.city} ${l.area} ${
          l.assignedToName || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) =>
      (b.lastCalledAt || b.updatedAt).localeCompare(a.lastCalledAt || a.updatedAt)
    );

  return NextResponse.json({ workedLeads, activities });
}
