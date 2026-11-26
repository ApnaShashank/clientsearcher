"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { AppSettings, PublicUser } from "@/types/crm";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton, Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface CallerWithStats extends PublicUser {
  stats: {
    totalAssigned: number;
    pendingQueue: number;
    totalCalls: number;
    interested: number;
    won: number;
  };
}

export default function AdminCallersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: settingsData } = useQuery<{ settings: AppSettings }>({
    queryKey: ["crm-settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
    staleTime: 5 * 60_000,
  });
  const settings = settingsData?.settings;

  const { data: callersData, isLoading } = useQuery<{
    callers: CallerWithStats[];
  }>({
    queryKey: ["admin-callers"],
    queryFn: async () => (await fetch("/api/admin/callers")).json(),
    staleTime: 5 * 60_000,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [homeCity, setHomeCity] = useState("Azamgarh");
  const [workingAreas, setWorkingAreas] = useState("");
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  function toggleCategory(cat: string) {
    setPreferredCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/callers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          phone,
          homeCity,
          workingAreas: workingAreas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          preferredCategories,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Failed to create caller";
        setError(msg);
        toast.error(msg);
      } else {
        setShowCreate(false);
        setName("");
        setUsername("");
        setPassword("");
        setPhone("");
        setWorkingAreas("");
        setPreferredCategories([]);
        queryClient.invalidateQueries({ queryKey: ["admin-callers"] });
        toast.success(`Caller "${data.caller.name}" created`);
      }
    } catch {
      toast.error("Network error while creating caller");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(caller: CallerWithStats) {
    setTogglingId(caller.id);
    try {
      const res = await fetch(`/api/admin/callers/${caller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !caller.isActive }),
      });
      if (!res.ok) {
        toast.error("Failed to update caller status");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-callers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      toast.success(
        `${caller.name} ${caller.isActive ? "deactivated" : "activated"}`
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetId || !newPassword.trim()) return;
    setResetBusy(true);
    try {
      const res = await fetch(`/api/admin/callers/${resetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPassword.trim() }),
      });
      if (!res.ok) {
        toast.error("Failed to reset password");
        return;
      }
      setResetId(null);
      setNewPassword("");
      toast.success("Password updated successfully");
    } finally {
      setResetBusy(false);
    }
  }

  async function handleApproval(
    caller: CallerWithStats,
    approvalStatus: "Approved" | "Rejected"
  ) {
    let rejectionReason = "";
    if (approvalStatus === "Rejected") {
      rejectionReason =
        prompt("Optional reason for rejection:") || "Application not approved.";
    }
    setApprovingId(caller.id);
    try {
      const res = await fetch(`/api/admin/callers/${caller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus, rejectionReason }),
      });
      if (!res.ok) {
        toast.error("Failed to update approval status");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-callers"] });
      toast.success(`${caller.name} marked ${approvalStatus}`);
    } finally {
      setApprovingId(null);
    }
  }

  const allCallers = callersData?.callers || [];
  const pendingCallers = allCallers.filter(
    (c) => c.approvalStatus === "Pending"
  );
  const callers = allCallers.filter((c) => c.approvalStatus !== "Pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Telecallers</h1>
          <p className="text-sm text-[#737370]">
            Create caller logins, manage territory, and deactivate access in one click.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="btn-pill-dark px-4 py-2 text-sm inline-flex items-center gap-2 self-start"
        >
          <UserPlus className="w-4 h-4" />
          {showCreate ? "Close Form" : "Create Caller"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="crm-card p-6 space-y-4">
          <h2 className="text-base font-bold">New Telecaller Account</h2>
          {error && (
            <div className="bg-[#FEECEC] text-[#C92A2A] text-xs px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#737370] mb-1">Full Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Verma"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#737370] mb-1">Username *</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. priya"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#737370] mb-1">Password *</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 chars"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#737370] mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Caller mobile"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#737370] mb-1">Home City *</label>
              <select
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
              >
                {(settings?.cities || ["Azamgarh", "Lucknow"]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#737370] mb-1">
                Working Areas (comma-separated)
              </label>
              <input
                value={workingAreas}
                onChange={(e) => setWorkingAreas(e.target.value)}
                placeholder="Civil Lines, Sidhari, Chowk"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#737370] mb-1.5">
              Preferred Categories (optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(settings?.categories || []).map((cat) => {
                const active = preferredCategories.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      active
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-[#111111] border-[#E2E2DC]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-pill-dark px-5 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <Spinner className="w-4 h-4" />}
              {saving ? "Creating..." : "Create Caller"}
            </button>
          </div>
        </form>
      )}

      {pendingCallers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#FF5C1C]">
            Pending Verification ({pendingCallers.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingCallers.map((c) => (
              <div
                key={c.id}
                className="crm-card p-5 border-[#FFD3C0] bg-[#FFFDFB] space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold">{c.name}</h3>
                    <p className="text-xs text-[#737370]">
                      @{c.username} · {c.phone}
                      {c.email ? ` · ${c.email}` : ""}
                    </p>
                  </div>
                  <StatusBadge
                    label={c.agreementSigned ? "Agreement Signed" : "No Signature"}
                  />
                </div>

                <div className="bg-[#F9F9F7] rounded-2xl p-3.5 text-xs space-y-1">
                  <div>
                    <strong>Address:</strong>{" "}
                    {c.fullAddress || c.homeCity || "-"}
                  </div>
                  <div>
                    <strong>Preferred Calling Area:</strong>{" "}
                    {c.preferredCallCityArea || c.homeCity}
                  </div>
                  <div>
                    <strong>ID Proof:</strong> {c.idProofType || "-"} ·{" "}
                    <span className="font-mono">{c.idProofNumber || "-"}</span>
                  </div>
                  <div>
                    <strong>Experience / Occupation:</strong>{" "}
                    {c.workExperience || "-"} / {c.currentOccupation || "-"}
                  </div>
                  {c.agreementSignedAt && (
                    <div>
                      <strong>Signed At:</strong>{" "}
                      {new Date(c.agreementSignedAt).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>

                {c.signatureDataUrl && (
                  <div className="bg-white border border-[#EBEBE7] rounded-2xl p-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#737370] pl-2">
                      Digital Signature:
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.signatureDataUrl}
                      alt="Signature"
                      className="h-12 object-contain"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F2F2EE]">
                  <a
                    href={`/api/admin/callers/${c.id}/agreement-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-pill-light px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Agreement PDF
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={approvingId === c.id}
                      onClick={() => handleApproval(c, "Rejected")}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FEECEC] text-[#C92A2A] inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      disabled={approvingId === c.id}
                      onClick={() => handleApproval(c, "Approved")}
                      className="btn-pill-dark px-4 py-1.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {approvingId === c.id ? (
                        <Spinner className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                      )}
                      Approve Caller
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : callers.length === 0 ? (
        <div className="crm-card p-10 text-center text-sm text-[#737370]">
          No callers yet. Click &ldquo;Create Caller&rdquo; to add your first telecaller.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {callers.map((c) => (
            <div key={c.id} className="crm-card p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold">{c.name}</h3>
                    <p className="text-xs text-[#737370]">
                      @{c.username} · {c.homeCity}
                    </p>
                  </div>
                  <StatusBadge label={c.isActive ? "Active" : "Inactive"} />
                </div>

                {c.workingAreas.length > 0 && (
                  <p className="text-xs text-[#737370] mt-2">
                    Areas: {c.workingAreas.join(", ")}
                  </p>
                )}

                <div className="grid grid-cols-4 gap-2 mt-4 bg-[#F9F9F7] rounded-2xl p-3 text-center">
                  <div>
                    <div className="text-sm font-bold">{c.stats.totalCalls}</div>
                    <div className="text-[11px] text-[#737370]">Calls</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{c.stats.pendingQueue}</div>
                    <div className="text-[11px] text-[#737370]">Queue</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#FF5C1C]">
                      {c.stats.interested}
                    </div>
                    <div className="text-[11px] text-[#737370]">Interested</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#12804A]">
                      {c.stats.won}
                    </div>
                    <div className="text-[11px] text-[#737370]">Won</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F2F2EE]">
                <button
                  disabled={togglingId === c.id}
                  onClick={() => toggleActive(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50 ${
                    c.isActive
                      ? "bg-[#FEECEC] text-[#C92A2A]"
                      : "bg-[#E6F9EE] text-[#12804A]"
                  }`}
                >
                  {togglingId === c.id ? (
                    <Spinner className="w-3.5 h-3.5" />
                  ) : c.isActive ? (
                    <ShieldOff className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {c.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    setResetId(c.id);
                    setNewPassword("");
                  }}
                  className="btn-pill-light px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Reset Password
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={handleResetPassword}
            className="crm-card p-6 w-full max-w-sm space-y-4"
          >
            <h3 className="text-base font-bold">Reset Caller Password</h3>
            <input
              type="password"
              required
              minLength={4}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 4 chars)"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetId(null)}
                className="btn-pill-light px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetBusy}
                className="btn-pill-dark px-4 py-2 text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {resetBusy && <Spinner className="w-3.5 h-3.5" />}
                {resetBusy ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
