import { NextRequest, NextResponse } from "next/server";
import { requireApprovedCaller } from "@/lib/auth";
import { getAllCallLogs } from "@/lib/repo";
import { logActivity } from "@/lib/activity";
import { generateBrandedPdf } from "@/lib/pdfReport";

export async function GET(request: NextRequest) {
  const auth = await requireApprovedCaller();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const format = (searchParams.get("format") || "json").toLowerCase();

  const myLogs = await getAllCallLogs({ callerId: auth.user.id });
  const dayLogs = myLogs.filter((c) => c.calledAt.slice(0, 10) === date);

  const summary = {
    totalCalls: dayLogs.length,
    interested: dayLogs.filter((c) => c.outcome === "Interested").length,
    meetings: dayLogs.filter((c) => c.outcome === "Meeting Fixed").length,
    won: dayLogs.filter((c) => c.outcome === "Won").length,
    callbacks: dayLogs.filter((c) => c.outcome === "Callback").length,
    notInterested: dayLogs.filter((c) => c.outcome === "Not Interested").length,
    noAnswer: dayLogs.filter(
      (c) => c.outcome === "No Answer" || c.outcome === "Busy"
    ).length,
  };

  // Callers NEVER get full phone numbers in report — last 4 digits only
  const safeRows = dayLogs.map((c) => ({
    id: c.id,
    businessName: c.leadName,
    phoneMasked: `******${c.leadPhoneLast4}`,
    outcome: c.outcome,
    note: c.note || "",
    calledAt: c.calledAt,
  }));

  if (format === "pdf") {
    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "caller",
      action: `Downloaded daily PDF report for ${date} (${dayLogs.length} calls)`,
      entityType: "export",
    });

    const pdfBytes = await generateBrandedPdf({
      title: "Daily Telecaller Work Report",
      subtitle: `Caller: ${auth.user.name} (@${auth.user.username})`,
      dateRangeLabel: `Date: ${date}`,
      generatedBy: auth.user.name,
      summaryStats: [
        { label: "Total Calls", value: summary.totalCalls },
        { label: "Interested", value: summary.interested },
        { label: "Meetings", value: summary.meetings },
        { label: "Won", value: summary.won },
      ],
      includeCallerColumn: false,
      rows: safeRows,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="creightweb-report-${auth.user.username}-${date}.pdf"`,
      },
    });
  }

  return NextResponse.json({
    date,
    callerName: auth.user.name,
    summary,
    rows: safeRows,
  });
}
