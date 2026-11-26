"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, PlayCircle } from "lucide-react";
import { PricingRow } from "@/types/crm";
import { Skeleton, Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface GuideData {
  pricingRows: PricingRow[];
  trainingVideoUrl: string;
  negotiationRules: string[];
}

export default function AdminGuidePage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery<GuideData>({
    queryKey: ["admin-guide"],
    queryFn: async () => (await fetch("/api/admin/guide")).json(),
  });

  const [trainingVideoUrl, setTrainingVideoUrl] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const [category, setCategory] = useState("");
  const [packageName, setPackageName] = useState("");
  const [priceMin, setPriceMin] = useState(4500);
  const [priceMax, setPriceMax] = useState(6000);
  const [domainIncluded, setDomainIncluded] = useState(true);
  const [note, setNote] = useState("");
  const [addingRow, setAddingRow] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setTrainingVideoUrl(data.trainingVideoUrl || "");
      setRules(data.negotiationRules || []);
    }
  }, [data]);

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeta(true);
    try {
      const res = await fetch("/api/admin/guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingVideoUrl,
          negotiationRules: rules,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to save guide settings");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-guide"] });
      queryClient.invalidateQueries({ queryKey: ["caller-guide"] });
      toast.success("Guide video & rules saved");
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleAddRow(e: React.FormEvent) {
    e.preventDefault();
    setAddingRow(true);
    try {
      const res = await fetch("/api/admin/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          packageName,
          priceMin,
          priceMax,
          domainIncluded,
          note,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to add pricing row");
        return;
      }
      setCategory("");
      setPackageName("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-guide"] });
      queryClient.invalidateQueries({ queryKey: ["caller-guide"] });
      toast.success("Pricing row added");
    } finally {
      setAddingRow(false);
    }
  }

  async function handleDeleteRow(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/guide?id=${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["admin-guide"] });
      queryClient.invalidateQueries({ queryKey: ["caller-guide"] });
      toast.success("Pricing row deleted");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Guide &amp; Pricing Manager
        </h1>
        <p className="text-sm text-[#737370]">
          Edit the price list, Hinglish negotiation rules, and training video
          shown to Approved callers.
        </p>
      </div>

      {/* Pricing Rows */}
      <div className="crm-card p-6 space-y-4">
        <h2 className="text-base font-bold">Rate Card / Pricing Packages</h2>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9F7] text-left text-xs text-[#737370] border-b border-[#EBEBE7]">
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Package</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Domain</th>
                  <th className="p-3 font-medium">Note</th>
                  <th className="p-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2EE]">
                {(data?.pricingRows || []).map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-semibold">{r.category}</td>
                    <td className="p-3">{r.packageName}</td>
                    <td className="p-3 font-bold whitespace-nowrap">
                      ₹{r.priceMin.toLocaleString("en-IN")} – ₹
                      {r.priceMax.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          r.domainIncluded
                            ? "bg-[#E6F9EE] text-[#12804A]"
                            : "bg-[#FEECEC] text-[#C92A2A]"
                        }`}
                      >
                        {r.domainIncluded ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-[#737370]">{r.note}</td>
                    <td className="p-3 text-right">
                      <button
                        disabled={deletingId === r.id}
                        onClick={() => handleDeleteRow(r.id)}
                        className="p-1.5 rounded-full text-[#737370] hover:text-[#C92A2A] hover:bg-[#FEECEC]"
                      >
                        {deletingId === r.id ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form
          onSubmit={handleAddRow}
          className="pt-4 border-t border-[#EBEBE7] grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] text-[#737370] mb-1">
              Category *
            </label>
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Clinic"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#737370] mb-1">
              Package *
            </label>
            <input
              required
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="Website"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#737370] mb-1">
              Min (₹) *
            </label>
            <input
              type="number"
              required
              value={priceMin}
              onChange={(e) => setPriceMin(Number(e.target.value))}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#737370] mb-1">
              Max (₹) *
            </label>
            <input
              type="number"
              required
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#737370] mb-1">
              Domain Included?
            </label>
            <select
              value={domainIncluded ? "yes" : "no"}
              onChange={(e) => setDomainIncluded(e.target.value === "yes")}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={addingRow}
            className="btn-pill-dark py-2 px-4 text-xs inline-flex items-center justify-center gap-1"
          >
            {addingRow ? <Spinner className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            Add Row
          </button>
          <div className="sm:col-span-6">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Short note for caller (optional)"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs"
            />
          </div>
        </form>
      </div>

      {/* Training Video & Negotiation Rules */}
      <form onSubmit={handleSaveMeta} className="crm-card p-6 space-y-5">
        <div>
          <label className="text-sm font-bold flex items-center gap-2 mb-1.5">
            <PlayCircle className="w-4 h-4 text-[#FF5C1C]" />
            Training Video URL (Google Drive)
          </label>
          <input
            value={trainingVideoUrl}
            onChange={(e) => setTrainingVideoUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/.../view"
            className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-sm font-bold block">
            Negotiation Rules (Rate kaise rakhe)
          </label>
          {rules.map((r, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <textarea
                rows={2}
                value={r}
                onChange={(e) => {
                  const next = [...rules];
                  next[idx] = e.target.value;
                  setRules(next);
                }}
                className="flex-1 bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                className="p-2 text-[#737370] hover:text-[#C92A2A]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Add another negotiation rule..."
              className="flex-1 bg-[#F9F9F7] border border-[#E2E2DC] rounded-full px-4 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (newRule.trim()) {
                  setRules([...rules, newRule.trim()]);
                  setNewRule("");
                }
              }}
              className="btn-pill-light px-4 py-2 text-xs"
            >
              Add Rule
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingMeta}
            className="btn-pill-dark px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            {savingMeta ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savingMeta ? "Saving..." : "Save Video & Rules"}
          </button>
        </div>
      </form>
    </div>
  );
}
