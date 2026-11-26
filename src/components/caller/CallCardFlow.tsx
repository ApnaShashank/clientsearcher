"use client";

import React, { useState } from "react";
import {
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  Sparkles,
  Check,
} from "lucide-react";
import {
  CALL_OUTCOMES,
  CallOutcome,
  DURATION_FEELS,
  DurationFeel,
  Lead,
} from "@/types/crm";
import { formatWhatsAppLink } from "@/lib/phone";
import { Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export interface CallerLeadItem extends Lead {
  pitchHint: string;
  lastNote?: string;
}

export function CallCardFlow({
  lead,
  onSaved,
}: {
  lead: CallerLeadItem;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [showAddress, setShowAddress] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | null>(
    null
  );
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [durationFeel, setDurationFeel] = useState<DurationFeel | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSaveOutcome() {
    if (!selectedOutcome) return;
    if (selectedOutcome === "Callback" && !followUpDate) {
      const msg = "Please pick a follow-up date for Callback.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/caller/leads/${lead.id}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: selectedOutcome,
          note: note.trim(),
          followUpDate: selectedOutcome === "Callback" ? followUpDate : null,
          durationFeel: durationFeel || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Could not save outcome";
        setError(msg);
        toast.error(msg);
        setSaving(false);
        return;
      }
      toast.success(`Saved: ${selectedOutcome}`);
      setSelectedOutcome(null);
      setNote("");
      setFollowUpDate("");
      setDurationFeel("");
      setShowAddress(false);
      onSaved();
    } catch {
      const msg = "Network error. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const waPhone = lead.whatsappNumber || lead.phone;
  const waHref = formatWhatsAppLink(
    waPhone,
    `Namaste ${lead.ownerName || lead.businessName} ji, Creightweb se baat kar raha hoon.`
  );

  return (
    <div className="space-y-4">
      {/* Main Lead Card */}
      <div className="crm-card p-5 lg:p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F5F5F3] text-[#737370] mb-1.5">
              {lead.category}
            </span>
            <h2 className="text-xl lg:text-2xl font-bold leading-snug text-[#111111]">
              {lead.businessName}
            </h2>
            <p className="text-sm text-[#737370] mt-0.5">
              {lead.area ? `${lead.area}, ` : ""}
              {lead.city}
              {lead.ownerName ? ` · ${lead.ownerName}` : ""}
            </p>
          </div>
          {lead.googleRating && (
            <div className="flex items-center gap-1 bg-[#FFF7E6] text-[#B86B00] px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{lead.googleRating}</span>
            </div>
          )}
        </div>

        {/* One-line Pitch Hint */}
        <div className="bg-[#FFF0EA] border border-[#FFD9C8] rounded-2xl p-3.5 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#FF5C1C] shrink-0 mt-0.5" />
          <p className="text-xs lg:text-sm font-semibold text-[#111111] leading-relaxed">
            {lead.pitchHint}
          </p>
        </div>

        {lead.lastNote && (
          <div className="text-xs bg-[#F9F9F7] rounded-2xl px-3.5 py-2.5 text-[#737370]">
            <span className="font-semibold text-[#111111]">Last note:</span>{" "}
            {lead.lastNote}
          </div>
        )}

        {/* Collapsible Full Address */}
        {lead.fullAddress && (
          <div>
            <button
              type="button"
              onClick={() => setShowAddress((v) => !v)}
              className="text-xs font-medium text-[#737370] inline-flex items-center gap-1 hover:text-[#111111]"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{showAddress ? "Hide address" : "Show full address"}</span>
              {showAddress ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {showAddress && (
              <p className="text-xs text-[#111111] mt-2 bg-[#F9F9F7] p-3 rounded-xl">
                {lead.fullAddress}
              </p>
            )}
          </div>
        )}

        {/* Huge Thumb-Sized CALL NOW + WhatsApp Buttons */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <a
            href={`tel:${lead.phone}`}
            className="col-span-2 btn-pill-orange py-4 text-base inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(255,92,28,0.28)]"
          >
            <Phone className="w-5 h-5" />
            <span>CALL NOW</span>
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill-light py-4 text-sm inline-flex items-center justify-center gap-1.5 border-[#D7F0DF] bg-[#F2FBF5] text-[#12804A] font-semibold"
          >
            <MessageCircle className="w-5 h-5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* One-Tap Outcome Card */}
      <div className="crm-card p-5 lg:p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#111111]">
          After the call — tap outcome:
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {CALL_OUTCOMES.map((outcome) => {
            const active = selectedOutcome === outcome;
            return (
              <button
                type="button"
                key={outcome}
                onClick={() => {
                  setSelectedOutcome(outcome);
                  setError("");
                }}
                className={`py-3 px-3 rounded-2xl text-xs font-semibold border transition-all text-center ${
                  active
                    ? "bg-[#111111] text-white border-[#111111] shadow-sm"
                    : "bg-[#F9F9F7] text-[#111111] border-[#E8E8E4] hover:border-[#111111] active:scale-[0.98]"
                }`}
              >
                {outcome}
              </button>
            );
          })}
        </div>

        {selectedOutcome && (
          <div className="space-y-3 pt-2 border-t border-[#EBEBE7]">
            {selectedOutcome === "Callback" && (
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Follow-up Date *
                </label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-2xl px-3.5 py-2.5 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#737370] mb-1">
                Call Duration (optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_FEELS.map((df) => (
                  <button
                    type="button"
                    key={df}
                    onClick={() => setDurationFeel(df)}
                    className={`py-2 rounded-xl text-xs font-medium border ${
                      durationFeel === df
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-[#737370] border-[#E2E2DC]"
                    }`}
                  >
                    {df}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#737370] mb-1">
                Short Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Owner asked to call at 5 PM"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-2xl px-3.5 py-2.5 text-sm"
              />
            </div>

            {error && (
              <div className="bg-[#FEECEC] text-[#C92A2A] text-xs font-medium px-3.5 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveOutcome}
              className="w-full btn-pill-dark py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Spinner className="w-4 h-4" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save &amp; Next Lead</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
