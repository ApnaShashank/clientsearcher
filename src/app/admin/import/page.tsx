"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface PreviewResponse {
  mode: string;
  fileName: string;
  totalRows: number;
  validCount: number;
  skippedCount: number;
  skipped: {
    row: number;
    businessName: string;
    phone: string;
    reason: string;
  }[];
}

export default function ImportLeadsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [leadSource, setLeadSource] = useState<"Excel Import" | "Notion Import">(
    "Excel Import"
  );
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setSavedCount(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "preview");
      fd.append("leadSource", leadSource);
      const res = await fetch("/api/admin/leads/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Validation failed";
        setError(msg);
        toast.error(msg);
      } else {
        setPreview(data);
        toast.info(`Validated ${data.totalRows} rows: ${data.validCount} valid`);
      }
    } catch {
      const msg = "Failed to parse file.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", "commit");
      fd.append("leadSource", leadSource);
      const res = await fetch("/api/admin/leads/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Import failed";
        setError(msg);
        toast.error(msg);
      } else {
        setSavedCount(data.validCount);
        setPreview(data);
        queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
        toast.success(`Imported ${data.validCount} leads successfully!`);
      }
    } catch {
      const msg = "Failed to import leads.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Leads</h1>
          <p className="text-sm text-[#737370]">
            Upload CSV or Excel (.xlsx). Duplicate phone numbers are automatically rejected.
          </p>
        </div>
        <a
          href="/api/admin/leads/import"
          className="btn-pill-light px-4 py-2 text-sm inline-flex items-center gap-2 self-start"
        >
          <Download className="w-4 h-4" />
          Download Sample Template (.xlsx)
        </a>
      </div>

      <form onSubmit={handleValidate} className="crm-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1.5">
              Upload File (.xlsx or .csv)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              required
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setPreview(null);
                setSavedCount(null);
              }}
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#111111] file:text-white file:text-xs file:font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1.5">
              Lead Source
            </label>
            <select
              value={leadSource}
              onChange={(e) =>
                setLeadSource(
                  e.target.value as "Excel Import" | "Notion Import"
                )
              }
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            >
              <option value="Excel Import">Excel Import</option>
              <option value="Notion Import">Notion Import</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-[#FEECEC] text-[#C92A2A] text-sm px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        {savedCount !== null && (
          <div className="bg-[#E6F9EE] text-[#12804A] text-sm px-4 py-3 rounded-2xl flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Successfully imported {savedCount} leads!
            </span>
            <Link href="/admin/leads" className="underline font-semibold">
              View Leads
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="btn-pill-dark px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Spinner className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {loading ? "Checking..." : "Validate & Preview"}
        </button>
      </form>

      {preview && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="crm-card p-5">
              <div className="text-xs text-[#737370]">Total Rows</div>
              <div className="text-2xl font-bold mt-1">{preview.totalRows}</div>
            </div>
            <div className="crm-card p-5">
              <div className="text-xs text-[#12804A]">Valid New Leads</div>
              <div className="text-2xl font-bold text-[#12804A] mt-1">
                {preview.validCount}
              </div>
            </div>
            <div className="crm-card p-5">
              <div className="text-xs text-[#C92A2A]">Skipped / Duplicates</div>
              <div className="text-2xl font-bold text-[#C92A2A] mt-1">
                {preview.skippedCount}
              </div>
            </div>
          </div>

          {preview.validCount > 0 && savedCount === null && (
            <div className="crm-card p-5 flex items-center justify-between gap-4 bg-[#FFF0EA] border-[#FFD3C0]">
              <div className="text-sm font-medium">
                Ready to save <strong>{preview.validCount}</strong> valid leads to the Unassigned pool.
              </div>
              <button
                onClick={handleCommit}
                disabled={loading}
                className="btn-pill-orange px-6 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <Spinner className="w-4 h-4" />}
                {loading ? "Saving..." : `Save ${preview.validCount} Leads`}
              </button>
            </div>
          )}

          {preview.skipped.length > 0 && (
            <div className="crm-card p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 text-[#C92A2A] mb-3">
                <AlertTriangle className="w-4 h-4" />
                Skipped Rows ({preview.skipped.length})
              </h3>
              <div className="max-h-60 overflow-y-auto divide-y divide-[#F2F2EE] text-xs">
                {preview.skipped.map((s, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold">Row {s.row}:</span>{" "}
                      {s.businessName} ({s.phone})
                    </div>
                    <span className="text-[#C92A2A]">{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
