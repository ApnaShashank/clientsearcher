"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { CallLog, PublicUser } from "@/types/crm";
import { StatusBadge } from "@/components/ui/Badge";

interface ReportResponse {
  overall: {
    totalCalls: number;
    interested: number;
    meetings: number;
    won: number;
    callbacks: number;
  };
  callerSummary: {
    callerId: string;
    callerName: string;
    username: string;
    totalCalls: number;
    interested: number;
    meetings: number;
    won: number;
    callbacks: number;
    notInterested: number;
    noAnswer: number;
  }[];
  logs: CallLog[];
}

export default function AdminReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86400_000)
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [callerId, setCallerId] = useState("");

  const { data: callersData } = useQuery<{ callers: PublicUser[] }>({
    queryKey: ["admin-callers"],
    queryFn: async () => (await fetch("/api/admin/callers")).json(),
  });

  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (callerId) qs.set("callerId", callerId);

  const { data, isLoading } = useQuery<ReportResponse>({
    queryKey: ["admin-reports", qs.toString()],
    queryFn: async () =>
      (await fetch(`/api/admin/reports?${qs.toString()}`)).json(),
  });

  function downloadExport(format: "csv" | "xlsx" | "pdf") {
    const exportQs = new URLSearchParams(qs);
    exportQs.set("format", format);
    window.open(`/api/admin/reports?${exportQs.toString()}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Exports</h1>
          <p className="text-sm text-[#737370]">
            Date-range performance per caller and overall agency metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadExport("csv")}
            className="btn-pill-light px-4 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => downloadExport("xlsx")}
            className="btn-pill-light px-4 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
          </button>
          <button
            onClick={() => downloadExport("pdf")}
            className="btn-pill-dark px-4 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="crm-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-[#737370] mb-1">From Date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[#737370] mb-1">To Date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[#737370] mb-1">Caller</label>
          <select
            value={callerId}
            onChange={(e) => setCallerId(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
          >
            <option value="">All Callers</option>
            {(callersData?.callers || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Calls", val: data?.overall.totalCalls ?? 0, accent: true },
          { label: "Interested", val: data?.overall.interested ?? 0 },
          { label: "Meetings Fixed", val: data?.overall.meetings ?? 0 },
          { label: "Won", val: data?.overall.won ?? 0 },
          { label: "Callbacks", val: data?.overall.callbacks ?? 0 },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-3xl p-5 ${
              item.accent ? "bg-[#FF5C1C] text-white" : "crm-card"
            }`}
          >
            <div
              className={`text-xs ${
                item.accent ? "text-white/85" : "text-[#737370]"
              }`}
            >
              {item.label}
            </div>
            <div className="text-3xl font-bold mt-1">
              {isLoading ? "—" : item.val}
            </div>
          </div>
        ))}
      </div>

      {/* Per Caller Summary */}
      <div className="crm-card overflow-hidden">
        <div className="p-5 border-b border-[#EBEBE7]">
          <h2 className="text-base font-bold">Caller Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9F7] text-left text-xs text-[#737370] border-b border-[#EBEBE7]">
                <th className="p-3.5 font-medium">Caller</th>
                <th className="p-3.5 font-medium text-right">Calls</th>
                <th className="p-3.5 font-medium text-right">Interested</th>
                <th className="p-3.5 font-medium text-right">Meetings</th>
                <th className="p-3.5 font-medium text-right">Won</th>
                <th className="p-3.5 font-medium text-right">Callback</th>
                <th className="p-3.5 font-medium text-right">No Answer/Busy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2EE]">
              {(data?.callerSummary || []).map((c) => (
                <tr key={c.callerId}>
                  <td className="p-3.5 font-semibold">{c.callerName}</td>
                  <td className="p-3.5 text-right font-bold">{c.totalCalls}</td>
                  <td className="p-3.5 text-right text-[#12804A] font-medium">
                    {c.interested}
                  </td>
                  <td className="p-3.5 text-right text-[#FF5C1C] font-medium">
                    {c.meetings}
                  </td>
                  <td className="p-3.5 text-right font-bold">{c.won}</td>
                  <td className="p-3.5 text-right">{c.callbacks}</td>
                  <td className="p-3.5 text-right text-[#737370]">{c.noAnswer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Call Logs in Range */}
      <div className="crm-card overflow-hidden">
        <div className="p-5 border-b border-[#EBEBE7]">
          <h2 className="text-base font-bold">Call Logs ({data?.logs?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9F7] text-left text-xs text-[#737370] border-b border-[#EBEBE7]">
                <th className="p-3.5 font-medium">Date</th>
                <th className="p-3.5 font-medium">Caller</th>
                <th className="p-3.5 font-medium">Business</th>
                <th className="p-3.5 font-medium">Outcome</th>
                <th className="p-3.5 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2EE]">
              {(data?.logs || []).map((log) => (
                <tr key={log.id}>
                  <td className="p-3.5 text-xs text-[#737370]">
                    {new Date(log.calledAt).toLocaleString("en-IN")}
                  </td>
                  <td className="p-3.5 font-medium">{log.callerName}</td>
                  <td className="p-3.5">{log.leadName}</td>
                  <td className="p-3.5">
                    <StatusBadge label={log.outcome} />
                  </td>
                  <td className="p-3.5 text-xs text-[#737370]">
                    {log.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
