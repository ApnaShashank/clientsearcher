import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectToDb, ensureSeeded } from "@/lib/db";
import { getAllCallLogs, getAllLeads, getAllUsers } from "@/lib/repo";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await ensureSeeded();
  const db = await connectToDb();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthPrefix = todayStr.slice(0, 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const start14Str = fourteenDaysAgo.toISOString().slice(0, 10);

  // Build 14-day template
  const dayLabels: { date: string; label: string }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayLabels.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    });
  }

  if (db) {
    // Fast MongoDB aggregation pipelines (no full collection scans into JS)
    const [leadAgg, callAgg, callers] = await Promise.all([
      db
        .collection("leads")
        .aggregate([
          {
            $facet: {
              totals: [
                {
                  $group: {
                    _id: null,
                    totalLeads: { $sum: 1 },
                    unassigned: {
                      $sum: { $cond: [{ $eq: ["$status", "Unassigned"] }, 1, 0] },
                    },
                    assignedToday: {
                      $sum: {
                        $cond: [
                          {
                            $eq: [
                              { $substrBytes: [{ $ifNull: ["$assignedAt", ""] }, 0, 10] },
                              todayStr,
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                    followUpsDueToday: {
                      $sum: {
                        $cond: [
                          {
                            $and: [
                              { $eq: ["$status", "Callback"] },
                              {
                                $lte: [
                                  { $substrBytes: [{ $ifNull: ["$followUpDate", "9999"] }, 0, 10] },
                                  todayStr,
                                ],
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
              byCaller: [
                { $match: { assignedTo: { $ne: null } } },
                {
                  $group: {
                    _id: "$assignedTo",
                    assignedTodayOrActive: {
                      $sum: {
                        $cond: [
                          {
                            $or: [
                              { $eq: ["$status", "Assigned"] },
                              {
                                $eq: [
                                  { $substrBytes: [{ $ifNull: ["$assignedAt", ""] }, 0, 10] },
                                  todayStr,
                                ],
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                    remaining: {
                      $sum: { $cond: [{ $eq: ["$status", "Assigned"] }, 1, 0] },
                    },
                  },
                },
              ],
            },
          },
        ])
        .toArray(),
      db
        .collection("callLogs")
        .aggregate([
          {
            $facet: {
              today: [
                {
                  $match: {
                    calledAt: { $gte: `${todayStr}T00:00:00`, $lte: `${todayStr}T23:59:59.999Z` },
                  },
                },
                {
                  $group: {
                    _id: null,
                    callsToday: { $sum: 1 },
                    interestedToday: {
                      $sum: {
                        $cond: [
                          { $in: ["$outcome", ["Interested", "Meeting Fixed"]] },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
              wonMonth: [
                {
                  $match: {
                    outcome: "Won",
                    calledAt: { $gte: `${monthPrefix}-01` },
                  },
                },
                { $count: "count" },
              ],
              chart14: [
                { $match: { calledAt: { $gte: `${start14Str}T00:00:00` } } },
                {
                  $group: {
                    _id: { $substrBytes: ["$calledAt", 0, 10] },
                    calls: { $sum: 1 },
                    interested: {
                      $sum: {
                        $cond: [
                          { $in: ["$outcome", ["Interested", "Meeting Fixed", "Won"]] },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
              byCallerToday: [
                {
                  $match: {
                    calledAt: { $gte: `${todayStr}T00:00:00`, $lte: `${todayStr}T23:59:59.999Z` },
                  },
                },
                {
                  $group: {
                    _id: "$callerId",
                    called: { $sum: 1 },
                    interested: {
                      $sum: {
                        $cond: [
                          { $in: ["$outcome", ["Interested", "Meeting Fixed", "Won"]] },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ])
        .toArray(),
      db
        .collection("users")
        .find(
          { role: "caller" },
          { projection: { id: 1, name: 1, username: 1, homeCity: 1, isActive: 1 } }
        )
        .toArray(),
    ]);

    const leadTotals = leadAgg[0]?.totals?.[0] || {};
    const callTodayTotals = callAgg[0]?.today?.[0] || {};
    const wonThisMonth = callAgg[0]?.wonMonth?.[0]?.count || 0;

    const chartMap = new Map<string, { calls: number; interested: number }>();
    for (const row of callAgg[0]?.chart14 || []) {
      chartMap.set(row._id, { calls: row.calls, interested: row.interested });
    }
    const chart14Days = dayLabels.map((d) => ({
      date: d.date,
      label: d.label,
      calls: chartMap.get(d.date)?.calls || 0,
      interested: chartMap.get(d.date)?.interested || 0,
    }));

    const leadCallerMap = new Map<string, { assigned: number; remaining: number }>();
    for (const row of leadAgg[0]?.byCaller || []) {
      leadCallerMap.set(row._id, {
        assigned: row.assignedTodayOrActive,
        remaining: row.remaining,
      });
    }

    const callCallerMap = new Map<string, { called: number; interested: number }>();
    for (const row of callAgg[0]?.byCallerToday || []) {
      callCallerMap.set(row._id, {
        called: row.called,
        interested: row.interested,
      });
    }

    const callerToday = callers.map((c) => ({
      id: c.id,
      name: c.name,
      username: c.username,
      homeCity: c.homeCity,
      isActive: c.isActive,
      assigned: leadCallerMap.get(c.id)?.assigned || 0,
      called: callCallerMap.get(c.id)?.called || 0,
      remaining: leadCallerMap.get(c.id)?.remaining || 0,
      interested: callCallerMap.get(c.id)?.interested || 0,
    }));

    return NextResponse.json({
      kpis: {
        totalLeads: leadTotals.totalLeads || 0,
        unassigned: leadTotals.unassigned || 0,
        assignedToday: leadTotals.assignedToday || 0,
        callsToday: callTodayTotals.callsToday || 0,
        interestedToday: callTodayTotals.interestedToday || 0,
        followUpsDueToday: leadTotals.followUpsDueToday || 0,
        wonThisMonth,
      },
      chart14Days,
      callerToday,
    });
  }

  // In-memory fallback when MONGODB_URI is not configured
  const [leads, callLogs, users] = await Promise.all([
    getAllLeads(),
    getAllCallLogs(),
    getAllUsers(),
  ]);

  const isSameDay = (iso: string | null | undefined, dayStr: string) =>
    Boolean(iso && iso.slice(0, 10) === dayStr);

  const chart14Days = dayLabels.map((d) => {
    const dayCalls = callLogs.filter((c) => isSameDay(c.calledAt, d.date));
    return {
      date: d.date,
      label: d.label,
      calls: dayCalls.length,
      interested: dayCalls.filter(
        (c) =>
          c.outcome === "Interested" ||
          c.outcome === "Meeting Fixed" ||
          c.outcome === "Won"
      ).length,
    };
  });

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
      totalLeads: leads.length,
      unassigned: leads.filter((l) => l.status === "Unassigned").length,
      assignedToday: leads.filter((l) => isSameDay(l.assignedAt, todayStr)).length,
      callsToday: callLogs.filter((c) => isSameDay(c.calledAt, todayStr)).length,
      interestedToday: callLogs.filter(
        (c) =>
          isSameDay(c.calledAt, todayStr) &&
          (c.outcome === "Interested" || c.outcome === "Meeting Fixed")
      ).length,
      followUpsDueToday: leads.filter(
        (l) =>
          l.status === "Callback" &&
          l.followUpDate &&
          l.followUpDate.slice(0, 10) <= todayStr
      ).length,
      wonThisMonth: callLogs.filter(
        (c) => c.outcome === "Won" && c.calledAt.slice(0, 7) === monthPrefix
      ).length,
    },
    chart14Days,
    callerToday,
  });
}
