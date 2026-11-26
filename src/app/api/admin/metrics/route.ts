import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllCallLogs, getAllLeads, getAllUsers } from "@/lib/repo";

function isSameDay(iso: string | null | undefined, dayStr: string): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) === dayStr;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const [leads, callLogs, users] = await Promise.all([
    getAllLeads(),
    getAllCallLogs(),
    getAllUsers(),
  ]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthPrefix = todayStr.slice(0, 7); // YYYY-MM

  const totalLeads = leads.length;
  const unassigned = leads.filter((l) => l.status === "Unassigned").length;
  const assignedToday = leads.filter((l) => isSameDay(l.assignedAt, todayStr)).length;
  const callsToday = callLogs.filter((c) => isSameDay(c.calledAt, todayStr)).length;
  const interestedToday = callLogs.filter(
    (c) =>
      isSameDay(c.calledAt, todayStr) &&
      (c.outcome === "Interested" || c.outcome === "Meeting Fixed")
  ).length;
  const followUpsDueToday = leads.filter(
    (l) =>
      l.status === "Callback" &&
      l.followUpDate &&
      l.followUpDate.slice(0, 10) <= todayStr
  ).length;
  const wonThisMonth = callLogs.filter(
    (c) => c.outcome === "Won" && c.calledAt.slice(0, 7) === monthPrefix
  ).length;

  // 14-day calls chart
  const chartDays: { date: string; label: string; calls: number; interested: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const dayCalls = callLogs.filter((c) => isSameDay(c.calledAt, dStr));
    chartDays.push({
      date: dStr,
      label,
      calls: dayCalls.length,
      interested: dayCalls.filter(
        (c) =>
          c.outcome === "Interested" ||
          c.outcome === "Meeting Fixed" ||
          c.outcome === "Won"
      ).length,
    });
  }

  // Per-caller table for today
  const callers = users.filter((u) => u.role === "caller");
  const callerToday = callers.map((caller) => {
    const assignedLeads = leads.filter(
      (l) =>
        l.assignedTo === caller.id &&
        (isSameDay(l.assignedAt, todayStr) || l.status === "Assigned")
    );
    const remaining = leads.filter(
      (l) => l.assignedTo === caller.id && l.status === "Assigned"
    ).length;
    const todayLogs = callLogs.filter(
      (c) => c.callerId === caller.id && isSameDay(c.calledAt, todayStr)
    );
    const interested = todayLogs.filter(
      (c) =>
        c.outcome === "Interested" ||
        c.outcome === "Meeting Fixed" ||
        c.outcome === "Won"
    ).length;

    return {
      id: caller.id,
      name: caller.name,
      username: caller.username,
      homeCity: caller.homeCity,
      isActive: caller.isActive,
      assigned: assignedLeads.length,
      called: todayLogs.length,
      remaining,
      interested,
    };
  });

  return NextResponse.json({
    kpis: {
      totalLeads,
      unassigned,
      assignedToday,
      callsToday,
      interestedToday,
      followUpsDueToday,
      wonThisMonth,
    },
    chart14Days: chartDays,
    callerToday,
  });
}
