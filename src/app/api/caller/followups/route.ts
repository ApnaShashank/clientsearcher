import { NextResponse } from "next/server";
import { requireCaller } from "@/lib/auth";
import { getAllCallLogs, getAllLeads } from "@/lib/repo";
import { generatePitchHint } from "@/lib/pitchHint";

export async function GET() {
  const auth = await requireCaller();
  if (auth.error) return auth.error;

  const [leads, callLogs] = await Promise.all([
    getAllLeads(),
    getAllCallLogs({ callerId: auth.user.id }),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const lastNoteByLead = new Map<string, string>();
  for (const log of callLogs) {
    if (!lastNoteByLead.has(log.leadId) && log.note) {
      lastNoteByLead.set(log.leadId, log.note);
    }
  }

  const callbacks = leads
    .filter(
      (l) =>
        l.assignedTo === auth.user.id &&
        l.status === "Callback"
    )
    .map((l) => ({
      ...l,
      pitchHint: generatePitchHint(l),
      lastNote: lastNoteByLead.get(l.id) || "",
      isDueTodayOrPast: Boolean(
        !l.followUpDate || l.followUpDate.slice(0, 10) <= todayStr
      ),
    }))
    .sort((a, b) => {
      // Due today/overdue first, then chronological
      if (a.isDueTodayOrPast !== b.isDueTodayOrPast) {
        return a.isDueTodayOrPast ? -1 : 1;
      }
      return (a.followUpDate || "").localeCompare(b.followUpDate || "");
    });

  return NextResponse.json({
    dueToday: callbacks.filter((c) => c.isDueTodayOrPast),
    upcoming: callbacks.filter((c) => !c.isDueTodayOrPast),
  });
}
