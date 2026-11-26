"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Upload,
  RotateCcw,
  Undo2,
  X,
  Phone,
  MapPin,
  Globe,
  AtSign,
  Layers,
} from "lucide-react";
import {
  AppSettings,
  CallLog,
  Lead,
  LEAD_PRIORITIES,
  PublicUser,
  WEBSITE_STATUSES,
} from "@/types/crm";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton, Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const ALL_STATUSES = [
  "Unassigned",
  "Assigned",
  "Interested",
  "Callback",
  "Meeting Fixed",
  "Won",
  "Not Interested",
  "No Answer",
  "Busy",
  "Wrong Number",
];

export default function AdminLeadsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState("");
  const [service, setService] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [assigned, setAssigned] = useState("");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignCallerId, setAssignCallerId] = useState("");
  const [assignVisibleFrom, setAssignVisibleFrom] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [recallBusy, setRecallBusy] = useState(false);

  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const [recycling, setRecycling] = useState(false);

  useEffect(() => {
    const urlQ = searchParams.get("q");
    if (urlQ !== null) setQ(urlQ);
    const urlStatus = searchParams.get("status");
    if (urlStatus !== null) setStatus(urlStatus);
    setPage(1);
  }, [searchParams]);

  const { data: settingsData } = useQuery<{ settings: AppSettings }>({
    queryKey: ["crm-settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
    staleTime: 5 * 60_000,
  });

  const { data: callersData } = useQuery<{ callers: PublicUser[] }>({
    queryKey: ["admin-callers"],
    queryFn: async () => (await fetch("/api/admin/callers")).json(),
    staleTime: 5 * 60_000,
  });

  const params = new URLSearchParams({ page: String(page), limit: "25" });
  if (city) params.set("city", city);
  if (area) params.set("area", area);
  if (category) params.set("category", category);
  if (websiteStatus) params.set("websiteStatus", websiteStatus);
  if (service) params.set("service", service);
  if (priority) params.set("priority", priority);
  if (status) params.set("status", status);
  if (assigned) params.set("assigned", assigned);
  if (q) params.set("q", q);

  const { data: leadsData, isLoading } = useQuery<{
    leads: Lead[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["admin-leads", params.toString()],
    queryFn: async () =>
      (await fetch(`/api/admin/leads?${params.toString()}`)).json(),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery<{
    lead: Lead;
    callLogs: CallLog[];
  }>({
    queryKey: ["admin-lead-detail", drawerLeadId],
    enabled: Boolean(drawerLeadId),
    queryFn: async () =>
      (await fetch(`/api/admin/leads/${drawerLeadId}`)).json(),
  });

  const leads = leadsData?.leads || [];
  const total = leadsData?.total ?? leads.length;
  const totalPages = leadsData?.totalPages ?? 1;
  const settings = settingsData?.settings;
  const callers = (callersData?.callers || []).filter((c) => c.isActive);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  }

  async function handleBulkAssign() {
    if (!assignCallerId || selectedIds.length === 0) return;
    setAssignBusy(true);
    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: assignCallerId,
          leadIds: selectedIds,
          visibleFrom: assignVisibleFrom || new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to assign selected leads");
      } else {
        setSelectedIds([]);
        queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
        queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
        toast.success(`Assigned ${data.batch.leadIds.length} leads to ${data.batch.callerName}`);
      }
    } catch {
      toast.error("Network error while assigning leads");
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleRecall(leadIds: string[]) {
    if (leadIds.length === 0) return;
    setRecallBusy(true);
    try {
      const res = await fetch("/api/admin/leads/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to recall leads");
        return;
      }
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
      if (drawerLeadId) {
        queryClient.invalidateQueries({ queryKey: ["admin-lead-detail", drawerLeadId] });
      }
      toast.success(
        `Recalled ${data.recalledCount} lead(s) to Unassigned pool` +
          (data.skippedCount ? ` (${data.skippedCount} skipped)` : "")
      );
    } catch {
      toast.error("Network error while recalling leads");
    } finally {
      setRecallBusy(false);
    }
  }

  async function handleRecycle(leadId: string) {
    if (
      !confirm(
        "Recycle this lead back to the Unassigned pool? Its call history stays intact."
      )
    ) {
      return;
    }
    setRecycling(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/recycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin deliberate recycle" }),
      });
      if (!res.ok) {
        toast.error("Failed to recycle lead");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lead-detail", leadId] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      toast.success("Lead recycled to Unassigned pool");
    } finally {
      setRecycling(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads Database</h1>
          <p className="text-sm text-[#737370]">
            {total} leads matching current filters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/import"
            className="btn-pill-light px-4 py-2 text-sm inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Import
          </Link>
          <Link
            href="/admin/leads/new"
            className="btn-pill-dark px-4 py-2 text-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="crm-card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, phone..."
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#111111]"
        />
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
        >
          <option value="">All Cities</option>
          {(settings?.cities || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setPage(1);
          }}
          placeholder="Area / Locality..."
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {(settings?.categories || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={websiteStatus}
          onChange={(e) => {
            setWebsiteStatus(e.target.value);
            setPage(1);
          }}
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Website Status</option>
          {WEBSITE_STATUSES.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <select
          value={service}
          onChange={(e) => {
            setService(e.target.value);
            setPage(1);
          }}
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Services to Pitch</option>
          {(settings?.servicesToPitch || []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
        >
          <option value="">All Priorities</option>
          {LEAD_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={assigned}
          onChange={(e) => {
            setAssigned(e.target.value);
            setPage(1);
          }}
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Assigned &amp; Unassigned</option>
          <option value="unassigned">Unassigned Only</option>
          <option value="assigned">Assigned Only</option>
        </select>
        <button
          onClick={() => {
            setCity("");
            setArea("");
            setCategory("");
            setWebsiteStatus("");
            setService("");
            setPriority("");
            setStatus("");
            setAssigned("");
            setQ("");
            setPage(1);
          }}
          className="btn-pill-light px-3 py-2 text-sm"
        >
          Clear Filters
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="crm-card p-4 bg-[#FFF0EA] border-[#FFD3C0] flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[#111111]">
            {selectedIds.length} lead(s) selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={assignCallerId}
              onChange={(e) => setAssignCallerId(e.target.value)}
              className="bg-white border border-[#E2E2DC] rounded-full px-3 py-1.5 text-sm"
            >
              <option value="">Select Caller...</option>
              {callers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.homeCity})
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={assignVisibleFrom}
              onChange={(e) => setAssignVisibleFrom(e.target.value)}
              className="bg-white border border-[#E2E2DC] rounded-full px-3 py-1.5 text-sm"
              title="Visible from date-time"
            />
            <button
              disabled={!assignCallerId || assignBusy}
              onClick={handleBulkAssign}
              className="btn-pill-dark px-4 py-1.5 text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {assignBusy ? <Spinner className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              {assignBusy ? "Assigning..." : "Assign Batch"}
            </button>
            <button
              disabled={recallBusy}
              onClick={() => handleRecall(selectedIds)}
              className="btn-pill-light px-4 py-1.5 text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {recallBusy ? <Spinner className="w-4 h-4" /> : <Undo2 className="w-4 h-4" />}
              {recallBusy ? "Recalling..." : "Recall to Unassigned Pool"}
            </button>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9F7] text-left text-xs text-[#737370] border-b border-[#EBEBE7]">
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selectedIds.length === leads.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3.5 font-medium">Business</th>
                <th className="p-3.5 font-medium">Location</th>
                <th className="p-3.5 font-medium">Phone</th>
                <th className="p-3.5 font-medium">Website</th>
                <th className="p-3.5 font-medium">Priority</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2EE]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={8} className="p-3.5">
                      <Skeleton className="h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#737370]">
                    No leads found.{" "}
                    <Link href="/admin/import" className="text-[#FF5C1C] font-medium underline">
                      Import from Excel/CSV
                    </Link>{" "}
                    or{" "}
                    <Link href="/admin/leads/new" className="text-[#111111] font-medium underline">
                      add manually
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-[#F9F9F7] cursor-pointer"
                    onClick={() => setDrawerLeadId(lead.id)}
                  >
                    <td
                      className="p-3.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(lead.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => {}}
                      />
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#111111]">
                        {lead.businessName}
                      </div>
                      <div className="text-xs text-[#737370]">{lead.category}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{lead.city}</div>
                      <div className="text-xs text-[#737370]">{lead.area || "—"}</div>
                    </td>
                    <td className="p-3.5 font-mono text-xs">{lead.phone}</td>
                    <td className="p-3.5 text-xs">{lead.websiteStatus}</td>
                    <td className="p-3.5">
                      <StatusBadge label={lead.priority} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge label={lead.status} />
                    </td>
                    <td className="p-3.5 text-xs text-[#737370]">
                      {lead.assignedToName || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#EBEBE7] flex items-center justify-between text-xs">
            <span className="text-[#737370]">
              Page {page} of {totalPages} ({total} leads)
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

      {/* Lead Detail Drawer */}
      {drawerLeadId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setDrawerLeadId(null)}
          />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto p-6 z-10 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-bold">
                  {detailData?.lead?.businessName || "Lead Details"}
                </h2>
                {detailData?.lead && (
                  <p className="text-sm text-[#737370]">
                    {detailData.lead.category} · {detailData.lead.area},{" "}
                    {detailData.lead.city}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDrawerLeadId(null)}
                className="p-2 rounded-full hover:bg-[#F5F5F3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !detailData?.lead ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={detailData.lead.status} />
                  <StatusBadge label={detailData.lead.priority} />
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F5F3] text-[#737370]">
                    {detailData.lead.preferredLanguage}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F5F3] text-[#737370]">
                    {detailData.lead.leadSource}
                  </span>
                </div>

                <div className="bg-[#F9F9F7] rounded-2xl p-4 space-y-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#737370]" />
                    <span className="font-mono font-semibold">
                      {detailData.lead.phone}
                    </span>
                    {detailData.lead.ownerName && (
                      <span className="text-[#737370]">
                        ({detailData.lead.ownerName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#737370] mt-0.5 shrink-0" />
                    <span>{detailData.lead.fullAddress || "No address provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#737370]" />
                    <span>
                      {detailData.lead.websiteStatus}
                      {detailData.lead.websiteUrl ? ` · ${detailData.lead.websiteUrl}` : ""}
                    </span>
                  </div>
                  {detailData.lead.instagramHandle && (
                    <div className="flex items-center gap-2">
                      <AtSign className="w-4 h-4 text-[#737370]" />
                      <span>
                        {detailData.lead.instagramHandle}
                        {detailData.lead.instagramFollowers
                          ? ` (${detailData.lead.instagramFollowers.toLocaleString("en-IN")} followers)`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>

                {detailData.lead.servicesToPitch.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#737370] mb-2">
                      Services to Pitch
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailData.lead.servicesToPitch.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-3 py-1 rounded-full bg-[#FFF0EA] text-[#E84E10] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detailData.lead.status === "Assigned" &&
                  detailData.lead.callCount === 0 && (
                    <button
                      disabled={recallBusy}
                      onClick={() => handleRecall([detailData.lead.id])}
                      className="w-full btn-pill-dark py-2.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {recallBusy ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        <Undo2 className="w-4 h-4" />
                      )}
                      {recallBusy
                        ? "Recalling..."
                        : "Recall to Unassigned Pool"}
                    </button>
                  )}

                {detailData.lead.status !== "Unassigned" &&
                  detailData.lead.callCount > 0 && (
                    <button
                      disabled={recycling}
                      onClick={() => handleRecycle(detailData.lead.id)}
                      className="w-full btn-pill-light py-2.5 text-sm inline-flex items-center justify-center gap-2 border-[#FFD3C0] text-[#E84E10] disabled:opacity-60"
                    >
                      {recycling ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      {recycling
                        ? "Recycling..."
                        : "Recycle Lead Back to Unassigned Pool"}
                    </button>
                  )}

                <div>
                  <h3 className="text-sm font-bold mb-3">
                    Call History ({detailData.callLogs.length})
                  </h3>
                  {detailData.callLogs.length === 0 ? (
                    <p className="text-xs text-[#737370]">No calls logged yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {detailData.callLogs.map((log) => (
                        <div
                          key={log.id}
                          className="border border-[#EBEBE7] rounded-2xl p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{log.callerName}</span>
                            <StatusBadge label={log.outcome} />
                          </div>
                          <div className="text-[#737370]">
                            {new Date(log.calledAt).toLocaleString("en-IN")}
                            {log.durationFeel ? ` · ${log.durationFeel}` : ""}
                          </div>
                          {log.note && (
                            <p className="text-[#111111] pt-1">{log.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
