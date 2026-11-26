"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import {
  AppSettings,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  PREFERRED_LANGUAGES,
  SUGGESTED_WEBSITE_TYPES,
  WEBSITE_STATUSES,
} from "@/types/crm";

export default function AddLeadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: settingsData } = useQuery<{ settings: AppSettings }>({
    queryKey: ["crm-settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
  });
  const settings = settingsData?.settings;

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Restaurant");
  const [city, setCity] = useState("Azamgarh");
  const [area, setArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [googleRating, setGoogleRating] = useState("");
  const [googleReviews, setGoogleReviews] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState("No Website");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [instagramFollowers, setInstagramFollowers] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [servicesToPitch, setServicesToPitch] = useState<string[]>([
    "New Website",
  ]);
  const [suggestedWebsiteType, setSuggestedWebsiteType] =
    useState("Business Website");
  const [bestTimeToCall, setBestTimeToCall] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("Hinglish");
  const [leadSource, setLeadSource] = useState("Manual");
  const [priority, setPriority] = useState("Warm");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleService(s: string) {
    setServicesToPitch((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          category,
          city,
          area,
          fullAddress,
          phone,
          whatsappSameAsPhone,
          whatsappNumber: whatsappSameAsPhone ? phone : whatsappNumber,
          ownerName,
          googleRating,
          googleReviews,
          googleMapsLink,
          websiteStatus,
          websiteUrl,
          instagramHandle,
          instagramFollowers,
          facebookLink,
          servicesToPitch,
          suggestedWebsiteType,
          bestTimeToCall,
          preferredLanguage,
          leadSource,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save lead");
        setSaving(false);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      router.push("/admin/leads");
    } catch {
      setError("Network error while saving lead.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/leads"
          className="p-2 rounded-full bg-white border border-[#EBEBE7] hover:bg-[#F5F5F3]"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Lead</h1>
          <p className="text-sm text-[#737370]">
            Phone numbers are checked automatically to prevent duplicates.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="crm-card p-6 sm:p-8 space-y-6">
        {error && (
          <div className="bg-[#FEECEC] text-[#C92A2A] text-sm font-medium px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Business Name *
            </label>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sharma Family Restaurant"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Category *
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            >
              {(settings?.categories || ["Restaurant", "Clinic", "Other"]).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              City *
            </label>
            <select
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            >
              {(settings?.cities || ["Azamgarh", "Lucknow", "Delhi", "Mumbai"]).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Area / Locality
            </label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Civil Lines, Gomti Nagar"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#737370] mb-1">
            Full Address
          </label>
          <textarea
            rows={2}
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            placeholder="Street, landmark, pin code..."
            className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Phone Number * (Unique)
            </label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm font-mono"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#737370]">
                WhatsApp Number
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-[#111111] cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappSameAsPhone}
                  onChange={(e) => setWhatsappSameAsPhone(e.target.checked)}
                />
                Same as phone
              </label>
            </div>
            <input
              disabled={whatsappSameAsPhone}
              value={whatsappSameAsPhone ? phone : whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="WhatsApp number"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm font-mono disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Owner / Contact Person
            </label>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Optional"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Best Time to Call
            </label>
            <input
              value={bestTimeToCall}
              onChange={(e) => setBestTimeToCall(e.target.value)}
              placeholder="e.g. 11 AM - 2 PM"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Website & Social */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Website Status
            </label>
            <select
              value={websiteStatus}
              onChange={(e) => setWebsiteStatus(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            >
              {WEBSITE_STATUSES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Website URL
            </label>
            <input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Suggested Website Type
            </label>
            <select
              value={suggestedWebsiteType}
              onChange={(e) => setSuggestedWebsiteType(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            >
              {SUGGESTED_WEBSITE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Google Rating
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={googleRating}
              onChange={(e) => setGoogleRating(e.target.value)}
              placeholder="e.g. 4.3"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Google Reviews Count
            </label>
            <input
              type="number"
              value={googleReviews}
              onChange={(e) => setGoogleReviews(e.target.value)}
              placeholder="e.g. 120"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Google Maps Link
            </label>
            <input
              value={googleMapsLink}
              onChange={(e) => setGoogleMapsLink(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Instagram Handle
            </label>
            <input
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@handle"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Instagram Followers
            </label>
            <input
              type="number"
              value={instagramFollowers}
              onChange={(e) => setInstagramFollowers(e.target.value)}
              placeholder="e.g. 2500"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Facebook Page Link
            </label>
            <input
              value={facebookLink}
              onChange={(e) => setFacebookLink(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Services to Pitch */}
        <div>
          <label className="block text-xs font-medium text-[#737370] mb-2">
            Services to Pitch
          </label>
          <div className="flex flex-wrap gap-2">
            {(settings?.servicesToPitch || []).map((s) => {
              const active = servicesToPitch.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleService(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-white text-[#111111] border-[#E2E2DC] hover:bg-[#F5F5F3]"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Preferred Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            >
              {PREFERRED_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Lead Source
            </label>
            <select
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            >
              {LEAD_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
            >
              {LEAD_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/leads" className="btn-pill-light px-5 py-2.5 text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-pill-dark px-6 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
