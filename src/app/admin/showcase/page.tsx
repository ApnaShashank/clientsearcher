"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink, Briefcase, Upload } from "lucide-react";
import { ShowcaseItem } from "@/types/crm";
import { Skeleton, Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminShowcasePage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery<{ items: ShowcaseItem[] }>({
    queryKey: ["admin-showcase"],
    queryFn: async () => (await fetch("/api/admin/showcase")).json(),
  });

  const [title, setTitle] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Restaurant");
  const [liveUrl, setLiveUrl] = useState("");
  const [type, setType] = useState<"client" | "demo">("client");
  const [previewImage, setPreviewImage] = useState("");
  const [logoImage, setLogoImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          businessName,
          category,
          liveUrl,
          type,
          previewImage,
          logoImage,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "Failed to add showcase item");
        return;
      }
      setTitle("");
      setBusinessName("");
      setLiveUrl("");
      setPreviewImage("");
      setLogoImage("");
      queryClient.invalidateQueries({ queryKey: ["admin-showcase"] });
      queryClient.invalidateQueries({ queryKey: ["public-showcase"] });
      toast.success("Showcase item added");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this showcase item?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/showcase?id=${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["admin-showcase"] });
      queryClient.invalidateQueries({ queryKey: ["public-showcase"] });
      toast.success("Showcase item removed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Showcase — &ldquo;Our Work&rdquo;
        </h1>
        <p className="text-sm text-[#737370]">
          Items added here appear automatically on the public Job Landing page
          and in the Caller app&apos;s Our Work tab.
        </p>
      </div>

      <form onSubmit={handleAdd} className="crm-card p-6 space-y-4">
        <h2 className="text-base font-bold">Add Client Work or Demo Website</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              Business / Client Name *
            </label>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Vaidya Dental Care"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              Project Title *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clinic Website + Booking"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              Category
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Restaurant, Clinic, Salon..."
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              Live Website URL *
            </label>
            <input
              required
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "client" | "demo")}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm"
            >
              <option value="client">Completed Client Work</option>
              <option value="demo">Demo Template</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#737370] mb-1">
              Preview Image (Upload or URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                value={previewImage}
                onChange={(e) => setPreviewImage(e.target.value)}
                placeholder="https://... or upload"
                className="flex-1 bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs"
              />
              <label className="btn-pill-light px-3 py-2 text-xs cursor-pointer inline-flex items-center gap-1 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setPreviewImage(await fileToDataUrl(f));
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#737370]">Logo (optional):</label>
            <input
              type="file"
              accept="image/*"
              className="text-xs"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setLogoImage(await fileToDataUrl(f));
              }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-pill-dark px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {saving ? "Adding..." : "Add to Showcase"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-3xl" />
          ))}
        </div>
      ) : (data?.items || []).length === 0 ? (
        <div className="crm-card p-10 text-center text-sm text-[#737370]">
          <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No showcase items yet. Add your first client or demo website above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.items || []).map((item) => (
            <div
              key={item.id}
              className="crm-card overflow-hidden flex flex-col justify-between"
            >
              {item.previewImage && (
                <div className="aspect-video bg-[#F9F9F7] border-b border-[#EBEBE7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewImage}
                    alt={item.businessName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF0EA] text-[#FF5C1C]">
                    {item.category} · {item.type}
                  </span>
                  <h3 className="font-bold text-base mt-1">{item.businessName}</h3>
                  <p className="text-xs text-[#737370]">{item.title}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#F2F2EE]">
                  <a
                    href={item.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#111111] inline-flex items-center gap-1 hover:underline"
                  >
                    Visit Site <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-full text-[#737370] hover:text-[#C92A2A] hover:bg-[#FEECEC]"
                  >
                    {deletingId === item.id ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
