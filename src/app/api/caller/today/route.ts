import { NextResponse } from "next/server";
import { requireApprovedCaller } from "@/lib/auth";
import { getAllCallLogs, getAllLeads } from "@/lib/repo";
import { generatePitchHint } from "@/lib/pitchHint";

export async function GET() {
  const auth = await requireApprovedCaller();
  if (auth.error) return auth.error;

  const [leads, callLogs] = await Promise.all([
    getAllLeads(),
    getAllCallLogs({ callerId: auth.user.id }),
  ]);

  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);

  // Only leads assigned to THIS caller AND visibleFrom <= now
  const visibleAssigned = leads.filter(
    (l) =>
      l.assignedTo === auth.user.id &&
      (!l.visibleFrom || l.visibleFrom <= nowIso)
  );

  // Pending today queue: status === "Assigned"
  const queue = visibleAssigned
    .filter((l) => l.status === "Assigned")
    .map((l) => ({
      ...l,
      pitchHint: generatePitchHint(l),
    }));

  // Calls done today by this caller
  const callsDoneToday = callLogs.filter(
    (c) => c.calledAt.slice(0, 10) === todayStr
  ).length;

  const totalToday = queue.length + callsDoneToday;

  return NextResponse.json({
    queue,
    progress: {
      doneToday: callsDoneToday,
      remaining: queue.length,
      totalToday,
    },
  });
}
