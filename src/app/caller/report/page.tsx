"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";

interface CallerReportResponse {
  date: string;
  callerName: string;
  summary: {
    totalCalls: number;
    interested: number;
    meetings: number;
    won: number;
    callbacks: number;
    notInterested: number;
    noAnswer: number;
  };
  rows: {
    id: string;
    businessName: string;
    phoneMasked: string;
    outcome: string;
    note: string;
    calledAt: string;
  }[];
}

export default function CallerReportPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery<CallerReportResponse>({
    queryKey: ["caller-report", date],
    queryFn: async () =>
      (await fetch(`/api/caller/report?date=${date}`)).json(),
  });

  function handleDownloadPdf() {
    window.open(`/api/caller/report?date=${date}&format=pdf`, "_blank");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Daily Report</h1>
        <p className="text-xs text-[#737370]">
          Download your branded PDF report to share with Admin on WhatsApp.
        </p>
      </div>

      <div className="crm-card p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#737370] mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-2xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={handleDownloadPdf}
          className="w-full btn-pill-dark py-3.5 text-sm inline-flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="crm-card p-3.5 text-center">
          <div className="text-xl font-bold">
            {isLoading ? "—" : data?.summary.totalCalls ?? 0}
          </div>
          <div className="text-[11px] text-[#737370]">Calls</div>
        </div>
        <div className="crm-card p-3.5 text-center">
          <div className="text-xl font-bold text-[#FF5C1C]">
            {isLoading ? "—" : data?.summary.interested ?? 0}
          </div>
          <div className="text-[11px] text-[#737370]">Interested</div>
        </div>
        <div className="crm-card p-3.5 text-center">
          <div className="text-xl font-bold text-[#12804A]">
            {isLoading ? "—" : (data?.summary.meetings ?? 0) + (data?.summary.won ?? 0)}
          </div>
          <div className="text-[11px] text-[#737370]">Meet / Won</div>
        </div>
      </div>

      {/* Lead-wise list (masked phone last-4 only) */}
      <div className="crm-card p-4 space-y-3">
        <h2 className="text-sm font-bold">
          Called Leads ({data?.rows?.length || 0})
        </h2>
        {!data?.rows || data.rows.length === 0 ? (
          <p className="text-xs text-[#737370] py-4 text-center">
            No calls logged on {date}.
          </p>
        ) : (
          <div className="divide-y divide-[#F2F2EE]">
            {data.rows.map((r) => (
              <div key={r.id} className="py-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {r.businessName}
                  </div>
                  <div className="text-xs text-[#737370] font-mono">
                    {r.phoneMasked}
                  </div>
                  {r.note && (
                    <div className="text-xs text-[#111111] mt-0.5">{r.note}</div>
                  )}
                </div>
                <StatusBadge label={r.outcome} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
