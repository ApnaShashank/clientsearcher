"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Lead, OutreachStatus } from "@/types/lead";
import { 
  X, Globe, Phone, MapPin, Mail, Sparkles, Star, Calendar, MessageSquare, 
  CheckCircle, FileText, Send, RefreshCw, AlertCircle, Copy, Check 
} from "lucide-react";

interface LeadDrawerProps {
  lead: Lead | null;
  onClose: () => void;
}

type TabType = "overview" | "seo" | "ai-outreach" | "crm";

export default function LeadDrawer({ lead, onClose }: LeadDrawerProps) {
  const { savedLeads, saveLead, updateLeadStatus, updateLeadNotes, campaigns, assignLeadToCampaign } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Local CRM Inputs
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [campaignId, setCampaignId] = useState("");

  // AI Tooling States
  const [aiType, setAiType] = useState<"email" | "whatsapp" | "proposal" | "followup" | "analysis">("email");
  const [aiOutput, setAiOutput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copiedText, setCopiedText] = useState(false);

  // Sync inputs with state when a new lead is clicked/saved
  const savedLeadInfo = lead ? savedLeads.find(sl => sl.leadId === lead.id) : null;
  const isSaved = !!savedLeadInfo;

  useEffect(() => {
    if (lead) {
      if (savedLeadInfo) {
        setNotes(savedLeadInfo.notes);
        setFollowUpDate(savedLeadInfo.followUpDate || "");
        setCampaignId(savedLeadInfo.campaignId || "");
      } else {
        setNotes("");
        setFollowUpDate("");
        setCampaignId("");
      }
      setAiOutput("");
      setAiError("");
      setActiveTab("overview");
    }
  }, [lead, savedLeadInfo]);

  if (!lead) return null;

  const handleSaveOrUpdateCRM = () => {
    if (isSaved) {
      updateLeadNotes(lead.id, notes, followUpDate || undefined);
      if (campaignId) assignLeadToCampaign(lead.id, campaignId);
    } else {
      saveLead(lead.id, "Not Contacted", notes, followUpDate || undefined, campaignId || undefined);
    }
    alert("Outreach details saved successfully!");
  };

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    setAiError("");
    setAiOutput("");

    try {
      const response = await fetch("/api/ai/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: aiType,
          lead,
          notes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to call AI model");
      }

      const data = await response.json();
      setAiOutput(data.result);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to generate outreach copy.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(aiOutput);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getStatusStyle = (status: OutreachStatus) => {
    switch (status) {
      case "Not Contacted": return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      case "Contacted": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Interested": return "bg-sky-500/10 text-sky-500 border-sky-500/20";
      case "Not Interested": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      case "Fake": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Forwarded": return "bg-violet-500/10 text-violet-500 border-violet-500/20";
      case "Follow Up": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Meeting Scheduled": return "bg-violet-500/10 text-violet-500 border-violet-500/20";
      case "Proposal Sent": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Won": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Lost": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs select-none">
      {/* Click outside target */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Slide drawer */}
      <div className="w-full max-w-2xl bg-background border-l border-border h-full flex flex-col shadow-2xl animate-slide-in overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border flex justify-between items-start bg-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-border text-text-muted px-2 py-0.5 rounded border border-border">
                {lead.category}
              </span>
              {isSaved && (
                <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 font-semibold">
                  <CheckCircle className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">{lead.businessName}</h2>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              {lead.address}
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-card-hover transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-card px-4">
          {[
            { id: "overview", label: "Overview" },
            { id: "seo", label: "SEO & Tech Audit" },
            { id: "ai-outreach", label: "AI Outreach Tools" },
            { id: "crm", label: "CRM & Activities" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Score widgets grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Lead Score</p>
                  <p className={`text-2xl font-extrabold ${
                    lead.leadScore >= 80 ? "text-emerald-500" : lead.leadScore >= 55 ? "text-amber-500" : "text-rose-500"
                  }`}>{lead.leadScore}/100</p>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">SEO Rating</p>
                  <p className="text-2xl font-extrabold text-text-primary">{lead.seoScore || "—"}/100</p>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Google Rating</p>
                  <p className="text-2xl font-extrabold text-text-primary flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    {lead.rating}
                  </p>
                </div>
              </div>

              {/* Contact info card */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border/50 pb-1.5">
                  Business Directory Metadata
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-text-muted uppercase text-[9px] font-bold">Category</p>
                    <p className="text-text-primary font-semibold">{lead.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-muted uppercase text-[9px] font-bold">Reviews Count</p>
                    <p className="text-text-primary font-semibold">{lead.reviewsCount} Google Reviews</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-muted uppercase text-[9px] font-bold">Phone Number</p>
                    <p className="text-text-primary font-mono">{lead.phoneNumber || "No number recorded"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-muted uppercase text-[9px] font-bold">Website</p>
                    {lead.website ? (
                      <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 font-semibold">
                        {lead.website}
                      </a>
                    ) : (
                      <p className="text-text-dark font-mono">No website listed</p>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-text-muted uppercase text-[9px] font-bold">Google Maps Url</p>
                    <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[11px] truncate block font-semibold">
                      {lead.googleMapsUrl}
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Channels and Status */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border/50 pb-1.5">
                  Connected Social Profiles
                </h3>
                <div className="flex gap-4">
                  {lead.facebookUrl ? (
                    <a href={lead.facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-text-primary bg-background px-3.5 py-2 rounded-lg border border-border hover:border-primary/45 transition">
                      <span className="text-indigo-500 font-semibold">Facebook</span>
                    </a>
                  ) : (
                    <div className="opacity-35 flex items-center gap-2 text-xs text-text-dark bg-transparent border border-border/50 px-3.5 py-2 rounded-lg cursor-not-allowed">
                      Facebook (Not found)
                    </div>
                  )}

                  {lead.instagramUrl ? (
                    <a href={lead.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-text-primary bg-background px-3.5 py-2 rounded-lg border border-border hover:border-primary/45 transition">
                      <span className="text-pink-500 font-semibold">Instagram</span>
                    </a>
                  ) : (
                    <div className="opacity-35 flex items-center gap-2 text-xs text-text-dark bg-transparent border border-border/50 px-3.5 py-2 rounded-lg cursor-not-allowed">
                      Instagram (Not found)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SEO & TECH TAB */}
          {activeTab === "seo" && (
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-border/50 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Website Audit Details
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    lead.websiteStatus === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  }`}>
                    {lead.websiteStatus}
                  </span>
                </div>

                {lead.website ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background border border-border rounded-lg flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${lead.sslEnabled ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <div>
                          <p className="font-bold text-text-primary">SSL Status</p>
                          <p className="text-[10px] text-text-muted">{lead.sslEnabled ? "HTTPS secure configuration" : "No SSL / Insecure HTTP"}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-background border border-border rounded-lg flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${lead.mobileFriendly ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <div>
                          <p className="font-bold text-text-primary">Mobile Optimization</p>
                          <p className="text-[10px] text-text-muted">{lead.mobileFriendly ? "Mobile responsive layout" : "Desktop layout only"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted">SEO Metrics & Meta Tags</h4>
                      <div className="bg-background border border-border p-3.5 rounded-lg space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase">Meta Title Tag</p>
                          <p className="text-text-primary mt-0.5 italic">"{lead.businessName} - Expert services and care in the local area"</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase">Meta Description</p>
                          <p className="text-text-primary mt-0.5 italic">"Looking for expert care? Contact {lead.businessName} today at {lead.phoneNumber || "our main line"} for reviews, appointments, and consultation."</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                          <div className="border border-border/60 p-2 rounded">
                            <p className="text-[10px] text-text-muted">Load Time</p>
                            <p className="font-bold text-text-primary mt-0.5">{lead.websiteStatus === "Slow" ? "4.2s" : "1.4s"}</p>
                          </div>
                          <div className="border border-border/60 p-2 rounded">
                            <p className="text-[10px] text-text-muted">Page Size</p>
                            <p className="font-bold text-text-primary mt-0.5">2.1 MB</p>
                          </div>
                          <div className="border border-border/60 p-2 rounded">
                            <p className="text-[10px] text-text-muted">Security Score</p>
                            <p className="font-bold text-text-primary mt-0.5">{lead.sslEnabled ? "92%" : "20%"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="text-xs text-text-muted">
                      This business does not have a website. Rebuild or design packages are the primary outreach hooks.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI OUTREACH TAB */}
          {activeTab === "ai-outreach" && (
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-border/50 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    AI Outreach Generator
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Select outreach copy type */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: "email", label: "Cold Email" },
                      { id: "whatsapp", label: "WhatsApp" },
                      { id: "proposal", label: "Proposal" },
                      { id: "followup", label: "Follow-up" },
                      { id: "analysis", label: "Marketing Audit" }
                    ].map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => setAiType(tool.id as any)}
                        className={`py-2 px-1 rounded-md text-[10px] font-bold border transition text-center cursor-pointer ${
                          aiType === tool.id
                            ? "bg-border text-primary border-primary/20"
                            : "bg-transparent text-text-muted border-border hover:text-text-primary"
                        }`}
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateAI}
                    disabled={isAiLoading}
                    className="w-full btn-primary rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Generating tailored outreach drafts...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-black" />
                        <span>Generate with GPT-4o</span>
                      </>
                    )}
                  </button>

                  {/* Errors */}
                  {aiError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs">
                      {aiError}
                    </div>
                  )}

                  {/* Output Preview */}
                  {aiOutput && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-background border border-border border-b-0 px-4 py-2 rounded-t-lg">
                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Generated Copy Output</span>
                        <button
                          onClick={handleCopyToClipboard}
                          className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-primary transition cursor-pointer"
                        >
                          {copiedText ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-background border border-border p-4 rounded-b-lg text-xs leading-relaxed text-text-primary font-mono whitespace-pre-wrap max-h-[280px] overflow-y-auto">
                        {aiOutput}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CRM TAB */}
          {activeTab === "crm" && (
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2.5">
                  Workspace Outreach settings
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Status update */}
                  {isSaved ? (
                    <div className="space-y-1.5">
                      <label className="text-text-muted uppercase text-[9px] font-bold">Outreach Status</label>
                      <select
                        value={savedLeadInfo.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as OutreachStatus)}
                        className={`w-full rounded border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-0 ${getStatusStyle(savedLeadInfo.status)} bg-card`}
                      >
                        <option value="Not Contacted" className="bg-card text-zinc-500">Not Contacted</option>
                        <option value="Contacted" className="bg-card text-blue-500">Contacted</option>
                        <option value="Interested" className="bg-card text-sky-500">Interested</option>
                        <option value="Not Interested" className="bg-card text-slate-500">Not Interested</option>
                        <option value="Fake" className="bg-card text-orange-500">Fake</option>
                        <option value="Forwarded" className="bg-card text-violet-500">Forwarded</option>
                        <option value="Won" className="bg-card text-emerald-500">Won</option>
                        <option value="Lost" className="bg-card text-rose-500">Lost</option>
                        <option value="Meeting Scheduled" className="bg-card text-violet-500">Meeting Scheduled</option>
                        <option value="Proposal Sent" className="bg-card text-orange-500">Proposal Sent</option>
                        <option value="Follow Up" className="bg-card text-amber-500">Follow Up</option>
                      </select>

                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[11px] font-semibold">
                      This lead is not saved yet. Fill out details below and hit "Save and Apply CRM" to add it to your tracking dashboard.
                    </div>
                  )}

                  {/* Campaign dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-text-muted uppercase text-[9px] font-bold">Outreach Campaign</label>
                    <select
                      value={campaignId}
                      onChange={(e) => setCampaignId(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="">No Active Campaign</option>
                      {campaigns.map((camp) => (
                        <option key={camp.id} value={camp.id}>{camp.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Follow-up date */}
                  <div className="space-y-1.5">
                    <label className="text-text-muted uppercase text-[9px] font-bold">Schedule Follow-up Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer text-left"
                    />
                  </div>

                  {/* Notes input */}
                  <div className="space-y-1.5">
                    <label className="text-text-muted uppercase text-[9px] font-bold">Outreach Notes / Log Details</label>
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Sent email on 18th June, requested a callback details..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Save button */}
                  <button
                    onClick={handleSaveOrUpdateCRM}
                    className="w-full btn-primary rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Save CRM Workspace Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
