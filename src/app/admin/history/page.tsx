"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import {
  ActivityLog,
  CALL_OUTCOMES,
  CallLog,
  Lead,
  PublicUser,
} from "@/types/crm";
import { StatusBadge } from "@/components/ui/Badge";

interface WorkedLead extends Lead {
  callHistory: CallLog[];
}

export default function AdminHistoryPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"worked" | "activity">("worked");
  const [outcome, setOutcome] = useState("");
  const [callerId, setCallerId] = useState("");
  const [q, setQ] = useState("");

  const { data: callersData } = useQuery<{ callers: PublicUser[] }>({
    queryKey: ["admin-callers"],
    queryFn: async () => (await fetch("/api/admin/callers")).json(),
  });

  const params = new URLSearchParams();
  if (outcome) params.set("outcome", outcome);
  if (callerId) params.set("callerId", callerId);
  if (q) params.set("q", q);

  const { data, isLoading } = useQuery<{
    workedLeads: WorkedLead[];
    activities: ActivityLog[];
  }>({
    queryKey: ["admin-history", params.toString()],
    queryFn: async () =>
      (await fetch(`/api/admin/history?${params.toString()}`)).json(),
  });

  async function handleRecycle(leadId: string) {
    if (!confirm("Recycle this lead back to Unassigned?")) return;
    await fetch(`/api/admin/leads/${leadId}/recycle`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["admin-history"] });
    queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Worked Leads &amp; Audit History
          </h1>
          <p className="text-sm text-[#737370]">
            Complete call trail and system activity feed.
          </p>
        </div>
        <div className="inline-flex bg-white border border-[#EBEBE7] rounded-full p-1">
          <button
            onClick={() => setTab("worked")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
              tab === "worked" ? "bg-[#111111] text-white" : "text-[#737370]"
            }`}
          >
            Worked Leads ({data?.workedLeads?.length || 0})
          </button>
          <button
            onClick={() => setTab("activity")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
              tab === "activity" ? "bg-[#111111] text-white" : "text-[#737370]"
            }`}
          >
            Activity Feed
          </button>
        </div>
      </div>

      {tab === "worked" ? (
        <>
          <div className="crm-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search business, phone, city..."
              className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            />
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            >
              <option value="">All Outcomes</option>
              {CALL_OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select
              value={callerId}
              onChange={(e) => setCallerId(e.target.value)}
              className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            >
              <option value="">All Callers</option>
              {(callersData?.callers || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="crm-card p-8 text-center text-sm text-[#737370]">
                Loading call history...
              </div>
            ) : (data?.workedLeads || []).length === 0 ? (
              <div className="crm-card p-10 text-center text-sm text-[#737370]">
                No worked leads yet.
              </div>
            ) : (
              (data?.workedLeads || []).map((lead) => (
                <div key={lead.id} className="crm-card p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">{lead.businessName}</h3>
                        <StatusBadge label={lead.status} />
                      </div>
                      <p className="text-xs text-[#737370]">
                        {lead.category} · {lead.area}, {lead.city} ·{" "}
                        <span className="font-mono">{lead.phone}</span>
                      </p>
                    </div>
                    {lead.status !== "Unassigned" && (
                      <button
                        onClick={() => handleRecycle(lead.id)}
                        className="btn-pill-light px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Recycle
                      </button>
                    )}
                  </div>

                  <div className="bg-[#F9F9F7] rounded-2xl p-3 space-y-2">
                    {lead.callHistory.map((log) => (
                      <div
                        key={log.id}
                        className="text-xs flex flex-wrap items-center justify-between gap-2 border-b last:border-0 border-[#EBEBE7] pb-2 last:pb-0"
                      >
                        <div>
                          <span className="font-semibold">{log.callerName}</span>{" "}
                          <span className="text-[#737370]">
                            · {new Date(log.calledAt).toLocaleString("en-IN")}
                          </span>
                          {log.note && (
                            <p className="text-[#111111] mt-0.5">{log.note}</p>
                          )}
                        </div>
                        <StatusBadge label={log.outcome} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="crm-card divide-y divide-[#F2F2EE]">
          {(data?.activities || []).length === 0 ? (
            <div className="p-8 text-center text-sm text-[#737370]">
              No activity logged yet.
            </div>
          ) : (
            (data?.activities || []).map((act) => (
              <div
                key={act.id}
                className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <div>
                  <span className="font-semibold">{act.actorName}</span>{" "}
                  <span className="text-[#737370]">({act.actorRole})</span>:{" "}
                  <span>{act.action}</span>
                  {act.details && (
                    <p className="text-xs text-[#737370] mt-0.5">{act.details}</p>
                  )}
                </div>
                <span className="text-xs text-[#737370]">
                  {new Date(act.timestamp).toLocaleString("en-IN")}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
