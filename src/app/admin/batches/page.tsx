"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Clock, Undo2, Eye, X } from "lucide-react";
import { AppSettings, Batch, Lead, PublicUser } from "@/types/crm";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton, Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface EnrichedBatch extends Batch {
  totalLeads: number;
  remaining: number;
  uncalledCount?: number;
  completedCount: number;
}

export default function AdminBatchesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

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

  const [page, setPage] = useState(1);
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null);
  const [selectedBatchLeads, setSelectedBatchLeads] = useState<string[]>([]);
  const [recallingBatchId, setRecallingBatchId] = useState<string | null>(null);
  const [recallSelectedBusy, setRecallSelectedBusy] = useState(false);

  const { data: settingsData } = useQuery<{ settings: AppSettings }>({
    queryKey: ["crm-settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
    staleTime: 5 * 60_000,
  });
  const settings = settingsData?.settings;

  const { data: callersData } = useQuery<{ callers: PublicUser[] }>({
    queryKey: ["admin-callers"],
    queryFn: async () => (await fetch("/api/admin/callers")).json(),
    staleTime: 5 * 60_000,
  });
  const callers = (callersData?.callers || []).filter((c) => c.isActive);

  const poolParams = new URLSearchParams({ assigned: "unassigned", limit: "1" });
  if (city) poolParams.set("city", city);
  if (area) poolParams.set("area", area);
  if (category) poolParams.set("category", category);

  const { data: poolData } = useQuery<{ total: number; leads: Lead[] }>({
    queryKey: ["unassigned-pool", poolParams.toString()],
    queryFn: async () =>
      (await fetch(`/api/admin/leads?${poolParams.toString()}`)).json(),
  });
  const availableCount = poolData?.total ?? poolData?.leads?.length ?? 0;

  const { data: batchesData, isLoading: batchesLoading } = useQuery<{
    batches: EnrichedBatch[];
    total: number;
    totalPages: number;
  }>({
    queryKey: ["admin-batches", page],
    queryFn: async () =>
      (await fetch(`/api/admin/batches?page=${page}&limit=20`)).json(),
  });

  const { data: batchDetailData, isLoading: detailLoading } = useQuery<{
    batch: Batch;
    leads: Lead[];
  }>({
    queryKey: ["admin-batch-detail", detailBatchId],
    enabled: Boolean(detailBatchId),
    queryFn: async () =>
      (await fetch(`/api/admin/batches/${detailBatchId}`)).json(),
  });

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
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
        toast.error(data.error || "Failed to create batch");
      } else {
        toast.success(
          `Batch "${data.batch.name}" created (${data.batch.leadIds.length} leads)`
        );
        queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
        queryClient.invalidateQueries({ queryKey: ["unassigned-pool"] });
        queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      }
    } catch {
      toast.error("Network error while creating batch");
    } finally {
      setBusy(false);
    }
  }

  async function handleRecallAllUncalled(batchId: string) {
    if (
      !confirm(
        "Recall all uncalled leads from this batch back to the Unassigned pool?"
      )
    ) {
      return;
    }
    setRecallingBatchId(batchId);
    try {
      const res = await fetch("/api/admin/leads/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, recallAllUncalled: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not recall leads");
        return;
      }
      toast.success(`Recalled ${data.recalledCount} uncalled lead(s)`);
      queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-batch-detail", batchId] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-pool"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    } catch {
      toast.error("Network error while recalling batch");
    } finally {
      setRecallingBatchId(null);
    }
  }

  async function handleRecallSelected() {
    if (selectedBatchLeads.length === 0) return;
    setRecallSelectedBusy(true);
    try {
      const res = await fetch("/api/admin/leads/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedBatchLeads }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not recall selected leads");
        return;
      }
      setSelectedBatchLeads([]);
      toast.success(
        `Recalled ${data.recalledCount} lead(s)` +
          (data.skippedCount ? ` (${data.skippedCount} skipped)` : "")
      );
      queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
      if (detailBatchId) {
        queryClient.invalidateQueries({
          queryKey: ["admin-batch-detail", detailBatchId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["unassigned-pool"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    } catch {
      toast.error("Network error while recalling leads");
    } finally {
      setRecallSelectedBusy(false);
    }
  }

  const totalPages = batchesData?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Assign Leads &amp; Daily Batches
        </h1>
        <p className="text-sm text-[#737370]">
          Filter the unassigned pool by city, area, and category, schedule
          visibility, or recall uncalled leads.
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy || availableCount === 0 || !callerId}
            className="btn-pill-dark px-6 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            {busy ? <Spinner className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
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
                <th className="p-3.5 font-medium text-right">Done</th>
                <th className="p-3.5 font-medium text-right">Status</th>
                <th className="p-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2EE]">
              {batchesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-3.5">
                      <Skeleton className="h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : (batchesData?.batches || []).length === 0 ? (
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
                    <td className="p-3.5 text-right font-medium">
                      {b.completedCount} / {b.totalLeads}
                    </td>
                    <td className="p-3.5 text-right">
                      <StatusBadge label={b.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailBatchId(b.id);
                            setSelectedBatchLeads([]);
                          }}
                          className="btn-pill-light px-3 py-1 text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {(b.uncalledCount ?? b.remaining) > 0 && (
                          <button
                            type="button"
                            disabled={recallingBatchId === b.id}
                            onClick={() => handleRecallAllUncalled(b.id)}
                            className="btn-pill-light px-3 py-1 text-xs inline-flex items-center gap-1 text-[#E84E10] border-[#FFD3C0] disabled:opacity-50"
                          >
                            {recallingBatchId === b.id ? (
                              <Spinner className="w-3.5 h-3.5" />
                            ) : (
                              <Undo2 className="w-3.5 h-3.5" />
                            )}
                            Recall all uncalled
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#EBEBE7] flex items-center justify-between text-xs">
            <span className="text-[#737370]">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-pill-light px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn-pill-light px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Detail Drawer */}
      {detailBatchId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setDetailBatchId(null)}
          />
          <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto p-6 z-10 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {batchDetailData?.batch?.name || "Batch Details"}
                </h2>
                <p className="text-xs text-[#737370]">
                  Select uncalled Assigned leads to recall back to the Unassigned pool.
                </p>
              </div>
              <button
                onClick={() => setDetailBatchId(null)}
                className="p-2 rounded-full hover:bg-[#F5F5F3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedBatchLeads.length > 0 && (
              <div className="bg-[#FFF0EA] border border-[#FFD3C0] rounded-2xl p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">
                  {selectedBatchLeads.length} selected
                </span>
                <button
                  disabled={recallSelectedBusy}
                  onClick={handleRecallSelected}
                  className="btn-pill-dark px-4 py-1.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {recallSelectedBusy ? (
                    <Spinner className="w-3.5 h-3.5" />
                  ) : (
                    <Undo2 className="w-3.5 h-3.5" />
                  )}
                  Recall Selected to Unassigned
                </button>
              </div>
            )}

            {detailLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (batchDetailData?.leads || []).length === 0 ? (
              <p className="text-sm text-[#737370] py-8 text-center">
                No leads remain in this batch.
              </p>
            ) : (
              <div className="divide-y divide-[#F2F2EE] border border-[#EBEBE7] rounded-2xl">
                {(batchDetailData?.leads || []).map((l) => {
                  const canRecall = l.status === "Assigned" && l.callCount === 0;
                  return (
                    <div
                      key={l.id}
                      className="p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          disabled={!canRecall}
                          checked={selectedBatchLeads.includes(l.id)}
                          onChange={() =>
                            setSelectedBatchLeads((prev) =>
                              prev.includes(l.id)
                                ? prev.filter((x) => x !== l.id)
                                : [...prev, l.id]
                            )
                          }
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {l.businessName}
                          </div>
                          <div className="text-xs text-[#737370]">
                            {l.category} · {l.area || l.city} · {l.phone}
                          </div>
                        </div>
                      </div>
                      <StatusBadge label={l.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
