import { NextResponse } from "next/server";
import { requireCaller } from "@/lib/auth";
import { getAllCallLogs, getAllLeads } from "@/lib/repo";
import { CallLog } from "@/types/crm";

function computeStats(logs: CallLog[], assignedCount: number, callbacksPending: number) {
  const callsDone = logs.length;
  const interested = logs.filter((c) => c.outcome === "Interested").length;
  const meetings = logs.filter((c) => c.outcome === "Meeting Fixed").length;
  const won = logs.filter((c) => c.outcome === "Won").length;
  const acceptanceRate =
    assignedCount > 0 ? Math.min(100, Math.round((callsDone / assignedCount) * 100)) : 0;

  return {
    assigned: assignedCount,
    callsDone,
    acceptanceRate,
    interested,
    meetings,
    won,
    callbacksPending,
  };
}

export async function GET() {
  const auth = await requireCaller();
  if (auth.error) return auth.error;

  const [leads, callLogs] = await Promise.all([
    getAllLeads(),
    getAllCallLogs({ callerId: auth.user.id }),
  ]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStartStr = weekAgo.toISOString().slice(0, 10);

  const myLeads = leads.filter(
    (l) =>
      l.assignedTo === auth.user.id &&
      (!l.visibleFrom || l.visibleFrom <= now.toISOString())
  );
  const callbacksPending = myLeads.filter((l) => l.status === "Callback").length;

  const todayLogs = callLogs.filter((c) => c.calledAt.slice(0, 10) === todayStr);
  const todayAssigned = myLeads.filter(
    (l) => (l.assignedAt || "").slice(0, 10) === todayStr || l.status === "Assigned"
  ).length;

  const weekLogs = callLogs.filter((c) => c.calledAt.slice(0, 10) >= weekStartStr);
  const weekAssigned = myLeads.filter(
    (l) => (l.assignedAt || "").slice(0, 10) >= weekStartStr
  ).length;

  const last7Days: { date: string; label: string; calls: number; interested: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const dayLogs = callLogs.filter((c) => c.calledAt.slice(0, 10) === dStr);
    last7Days.push({
      date: dStr,
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      calls: dayLogs.length,
      interested: dayLogs.filter(
        (c) =>
          c.outcome === "Interested" ||
          c.outcome === "Meeting Fixed" ||
          c.outcome === "Won"
      ).length,
    });
  }

  return NextResponse.json({
    today: computeStats(todayLogs, todayAssigned, callbacksPending),
    week: computeStats(weekLogs, Math.max(weekAssigned, weekLogs.length), callbacksPending),
    total: computeStats(callLogs, myLeads.length, callbacksPending),
    last7Days,
  });
}
