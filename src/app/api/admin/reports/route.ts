import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";
import { getAllCallLogs, getAllLeads, getAllUsers } from "@/lib/repo";
import { logActivity } from "@/lib/activity";
import { generateBrandedPdf } from "@/lib/pdfReport";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const callerId = searchParams.get("callerId") || "";
  const format = (searchParams.get("format") || "json").toLowerCase();

  const [callLogs, leads, users] = await Promise.all([
    getAllCallLogs(),
    getAllLeads(),
    getAllUsers(),
  ]);

  const leadMap = new Map(leads.map((l) => [l.id, l]));
  const filteredLogs = callLogs.filter((c) => {
    const day = c.calledAt.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    if (callerId && c.callerId !== callerId) return false;
    return true;
  });

  const callers = users.filter((u) => u.role === "caller");
  const callerSummary = callers
    .filter((c) => !callerId || c.id === callerId)
    .map((c) => {
      const logs = filteredLogs.filter((l) => l.callerId === c.id);
      return {
        callerId: c.id,
        callerName: c.name,
        username: c.username,
        totalCalls: logs.length,
        interested: logs.filter((l) => l.outcome === "Interested").length,
        meetings: logs.filter((l) => l.outcome === "Meeting Fixed").length,
        won: logs.filter((l) => l.outcome === "Won").length,
        callbacks: logs.filter((l) => l.outcome === "Callback").length,
        notInterested: logs.filter((l) => l.outcome === "Not Interested").length,
        noAnswer: logs.filter(
          (l) => l.outcome === "No Answer" || l.outcome === "Busy"
        ).length,
      };
    });

  const overall = {
    totalCalls: filteredLogs.length,
    interested: filteredLogs.filter((l) => l.outcome === "Interested").length,
    meetings: filteredLogs.filter((l) => l.outcome === "Meeting Fixed").length,
    won: filteredLogs.filter((l) => l.outcome === "Won").length,
    callbacks: filteredLogs.filter((l) => l.outcome === "Callback").length,
  };

  if (format === "csv" || format === "xlsx") {
    const exportRows = filteredLogs.map((c) => {
      const lead = leadMap.get(c.leadId);
      return {
        Date: new Date(c.calledAt).toLocaleString("en-IN"),
        Caller: c.callerName,
        Business: c.leadName,
        Phone: lead?.phone || `******${c.leadPhoneLast4}`,
        City: lead?.city || "",
        Category: lead?.category || "",
        Outcome: c.outcome,
        Duration: c.durationFeel || "",
        FollowUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : "",
        Note: c.note || "",
      };
    });

    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: `Exported ${format.toUpperCase()} report (${filteredLogs.length} call records)`,
      entityType: "export",
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CallReport");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="creightweb-report-${from || "all"}-${to || "now"}.csv"`,
        },
      });
    }

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="creightweb-report-${from || "all"}-${to || "now"}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: `Exported PDF report (${filteredLogs.length} call records)`,
      entityType: "export",
    });

    const pdfBytes = await generateBrandedPdf({
      title: "Admin Calling Performance Report",
      subtitle: callerId
        ? `Caller: ${callerSummary[0]?.callerName || "Selected"}`
        : "All Callers Summary",
      dateRangeLabel: `${from || "Start"} to ${to || "Today"}`,
      generatedBy: auth.user.name,
      summaryStats: [
        { label: "Total Calls", value: overall.totalCalls },
        { label: "Interested", value: overall.interested },
        { label: "Meetings Fixed", value: overall.meetings },
        { label: "Won", value: overall.won },
      ],
      includeCallerColumn: true,
      rows: filteredLogs.slice(0, 200).map((c) => {
        const lead = leadMap.get(c.leadId);
        return {
          businessName: c.leadName,
          phoneMasked: lead?.phone || `******${c.leadPhoneLast4}`,
          callerName: c.callerName,
          outcome: c.outcome,
          note: c.note || "",
          calledAt: c.calledAt,
        };
      }),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="creightweb-admin-report.pdf"`,
      },
    });
  }

  return NextResponse.json({
    overall,
    callerSummary,
    logs: filteredLogs.slice(0, 200),
  });
}
