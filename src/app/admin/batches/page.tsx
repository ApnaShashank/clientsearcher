"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Clock } from "lucide-react";
import { AppSettings, Batch, Lead, PublicUser } from "@/types/crm";
import { StatusBadge } from "@/components/ui/Badge";

interface EnrichedBatch extends Batch {
  totalLeads: number;
  remaining: number;
  completedCount: number;
}

export default function AdminBatchesPage() {
  const queryClient = useQueryClient();

  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [count, setCount] = useState(25);
  const [callerId, setCallerId] = useState("");
  const [visibleFrom, setVisibleFrom] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const { data: settingsData } = useQuery<{ settings: AppSettings }>({
    queryKey: ["crm-settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
  });
  const settings = settingsData?.settings;

  const { data: callersData } = useQuery<{ callers: PublicUser[] }>({
    queryKey: ["admin-callers"],
    queryFn: async () => (await fetch("/api/admin/callers")).json(),
  });
  const callers = (callersData?.callers || []).filter((c) => c.isActive);

  const poolParams = new URLSearchParams({ assigned: "unassigned" });
  if (city) poolParams.set("city", city);
  if (area) poolParams.set("area", area);
  if (category) poolParams.set("category", category);

  const { data: poolData } = useQuery<{ leads: Lead[] }>({
    queryKey: ["unassigned-pool", poolParams.toString()],
    queryFn: async () =>
      (await fetch(`/api/admin/leads?${poolParams.toString()}`)).json(),
  });
  const availableCount = poolData?.leads?.length || 0;

  const { data: batchesData } = useQuery<{ batches: EnrichedBatch[] }>({
    queryKey: ["admin-batches"],
    queryFn: async () => (await fetch("/api/admin/batches")).json(),
  });

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          area,
          category,
          count,
          callerId,
          visibleFrom: visibleFrom
            ? new Date(visibleFrom).toISOString()
            : new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to create batch");
      } else {
        setMessage(
          `Batch "${data.batch.name}" created with ${data.batch.leadIds.length} leads.`
        );
        queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
        queryClient.invalidateQueries({ queryKey: ["unassigned-pool"] });
        queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Assign Leads &amp; Daily Batches
        </h1>
        <p className="text-sm text-[#737370]">
          Filter the unassigned pool by city, area, and category, then schedule when the batch becomes visible to the caller.
        </p>
      </div>

      {/* Assignment Builder */}
      <form onSubmit={handleAssign} className="crm-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Create New Batch</h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FFF0EA] text-[#FF5C1C]">
            {availableCount} unassigned leads match
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[#737370] mb-1">1. City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Any City</option>
              {(settings?.cities || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              2. Area / Locality
            </label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Gomti Nagar"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              3. Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Any Category</option>
              {(settings?.categories || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#F2F2EE]">
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              Lead Count
            </label>
            <input
              type="number"
              min={1}
              max={500}
              required
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              Assign to Caller *
            </label>
            <select
              required
              value={callerId}
              onChange={(e) => setCallerId(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Select Caller...</option>
              {callers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.homeCity}
                  {c.workingAreas.length ? ` · ${c.workingAreas.join(", ")}` : ""})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              Visible From (Date &amp; Time)
            </label>
            <input
              type="datetime-local"
              value={visibleFrom}
              onChange={(e) => setVisibleFrom(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        {message && (
          <div className="text-sm font-medium bg-[#F9F9F7] px-4 py-3 rounded-2xl">
            {message}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy || availableCount === 0 || !callerId}
            className="btn-pill-dark px-6 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Layers className="w-4 h-4" />
            {busy ? "Assigning..." : "Assign Batch"}
          </button>
        </div>
      </form>

      {/* Batches Table */}
      <div className="crm-card overflow-hidden">
        <div className="p-5 border-b border-[#EBEBE7]">
          <h2 className="text-base font-bold">Recent &amp; Scheduled Batches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9F7] text-left text-xs text-[#737370] border-b border-[#EBEBE7]">
                <th className="p-3.5 font-medium">Batch</th>
                <th className="p-3.5 font-medium">Caller</th>
                <th className="p-3.5 font-medium">Visible From</th>
                <th className="p-3.5 font-medium text-right">Leads</th>
                <th className="p-3.5 font-medium text-right">Done</th>
                <th className="p-3.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2EE]">
              {(batchesData?.batches || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#737370]">
                    No batches assigned yet.
                  </td>
                </tr>
              ) : (
                (batchesData?.batches || []).map((b) => (
                  <tr key={b.id}>
                    <td className="p-3.5 font-semibold">{b.name}</td>
                    <td className="p-3.5">{b.callerName}</td>
                    <td className="p-3.5 text-xs text-[#737370]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(b.visibleFrom).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">{b.totalLeads}</td>
                    <td className="p-3.5 text-right font-medium">
                      {b.completedCount} / {b.totalLeads}
                    </td>
                    <td className="p-3.5 text-right">
                      <StatusBadge label={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
