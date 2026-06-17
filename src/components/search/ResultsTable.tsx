"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Lead, OutreachStatus } from "@/types/lead";
import { 
  Star, ExternalLink, Globe, Phone, MapPin, Sparkles, Mail, Save, Trash2, CheckCircle2 
} from "lucide-react";

interface ResultsTableProps {
  onRowClick: (lead: Lead) => void;
}

// Custom inline SVG icons
const Facebook = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Instagram = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export default function ResultsTable({ onRowClick }: ResultsTableProps) {
  const { 
    searchResults, savedLeads, saveLead, removeSavedLead, updateLeadStatus, isSearching, currentUser 
  } = useAppStore();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === searchResults.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(searchResults.map(l => l.id));
    }
  };

  const getLeadSaveState = (id: string) => {
    const currentUserId = currentUser?.id || "guest";
    const saved = savedLeads.find(sl => sl.leadId === id && sl.userId === currentUserId);
    return {
      isSaved: !!saved,
      status: saved?.status || "Not Contacted",
      campaignId: saved?.campaignId
    };
  };


  const getStatusStyle = (status: OutreachStatus) => {
    switch (status) {
      case "Not Contacted": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "Contacted": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Interested": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Not Interested": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "Fake": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Forwarded": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Won": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Lost": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getScoreStyle = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 55) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const handleBulkSave = () => {
    selectedLeads.forEach(id => {
      saveLead(id);
    });
    setSelectedLeads([]);
  };

  if (isSearching) {
    return (
      <div className="w-full rounded-xl border border-border bg-card overflow-hidden select-none">
        <div className="p-4 border-b border-border bg-card flex justify-between items-center">
          <div className="h-5 w-48 rounded bg-border animate-pulse"></div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="border border-border bg-[#111111] p-4.5 rounded-xl space-y-3 shadow-md animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-4 bg-border rounded"></div>
                <div className="h-4 w-28 bg-border rounded"></div>
              </div>
              <div className="h-3 w-40 bg-border rounded"></div>
              <div className="h-3.5 w-16 bg-border rounded"></div>
              <div className="space-y-1.5 pt-2">
                <div className="h-3 w-full bg-border rounded"></div>
                <div className="h-3 w-full bg-border rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center space-y-4 shadow-lg select-none">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background text-text-muted">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">No Lead Results Found</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            Try running a search in another city, checking filters, or switching to "Live AI Search" to find real-time leads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* Bulk actions and info header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-border px-4 py-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedLeads.length === searchResults.length && searchResults.length > 0}
            onChange={toggleSelectAll}
            className="rounded border-border focus:ring-0 cursor-pointer accent-primary h-4 w-4"
          />
          <span className="text-xs text-text-muted font-medium">
            Select All ({selectedLeads.length} of {searchResults.length} selected)
          </span>
          {selectedLeads.length > 0 && (
            <button
              onClick={handleBulkSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-black font-semibold text-xs transition-colors hover:bg-sky-400 cursor-pointer"
            >
              <Save className="h-3 w-3" />
              Save Selected ({selectedLeads.length})
            </button>
          )}
        </div>
        <div className="text-[11px] text-text-muted">
          Click any card to open the <strong className="text-text-primary">AI Analysis Drawer</strong>
        </div>
      </div>

      {/* Grid of Lead Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {searchResults.map((lead) => {
          const { isSaved, status } = getLeadSaveState(lead.id);
          const isLeadSelected = selectedLeads.includes(lead.id);

          return (
            <div
              key={lead.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (
                  target.tagName === "INPUT" || 
                  target.tagName === "SELECT" || 
                  target.tagName === "A" || 
                  target.closest("button") || 
                  target.closest("a")
                ) {
                  return;
                }
                onRowClick(lead);
              }}
              className={`bg-card border rounded-xl p-4.5 space-y-4 hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative ${
                isLeadSelected ? "border-primary/30 shadow-[0_0_15px_rgba(56,189,248,0.05)]" : "border-border"
              }`}
            >
              {/* Card Top / Title */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isLeadSelected}
                      onChange={() => toggleSelectLead(lead.id)}
                      className="rounded border-border focus:ring-0 cursor-pointer accent-primary h-3.5 w-3.5 mt-0.5"
                    />
                    <h4 className="font-bold text-text-primary text-xs leading-tight group-hover:text-primary transition-colors line-clamp-1">
                      {lead.businessName}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold shrink-0 ${getScoreStyle(lead.leadScore)}`}>
                    {lead.leadScore} Score
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-text-muted">
                  <span className="bg-background border border-border px-1.5 py-0.5 rounded font-medium">{lead.category}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
                    <span className="truncate max-w-[140px]" title={lead.address}>{lead.address.split(",")[1] || lead.address}</span>
                  </span>
                </div>
              </div>

              {/* Review Section */}
              <div className="flex items-center gap-3.5 text-xs text-text-muted select-none border-y border-border/40 py-2.5">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                  <span className="font-bold text-text-primary">{lead.rating}</span>
                </div>
                <span>•</span>
                <span className="font-medium">{lead.reviewsCount} reviews</span>
                {lead.rating >= 4.5 && lead.reviewsCount > 100 && (
                  <>
                    <span>•</span>
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                      Elite
                    </span>
                  </>
                )}
              </div>

              {/* Contact / Web details */}
              <div className="space-y-2 text-xs text-text-muted flex-1">
                {/* Phone */}
                {lead.phoneNumber ? (
                  <a href={`tel:${lead.phoneNumber}`} className="hover:text-primary flex items-center gap-2 font-medium">
                    <Phone className="h-3.5 w-3.5 text-text-muted/70 shrink-0" />
                    <span>{lead.phoneNumber}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-text-dark font-mono">
                    <Phone className="h-3.5 w-3.5 shrink-0 opacity-40" />
                    <span>None listed</span>
                  </div>
                )}

                {/* Email */}
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="hover:text-primary flex items-center gap-2 font-medium truncate" title={lead.email}>
                    <Mail className="h-3.5 w-3.5 text-text-muted/70 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-text-dark font-mono">
                    <Mail className="h-3.5 w-3.5 shrink-0 opacity-40" />
                    <span>None listed</span>
                  </div>
                )}

                {/* Web & SEO stats */}
                {lead.website ? (
                  <div className="space-y-1.5 pt-1">
                    <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-2 font-bold truncate">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{lead.website.replace("https://", "").replace("www.", "")}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-55 shrink-0" />
                    </a>
                    <div className="flex items-center gap-2 text-[9px] font-mono">
                      <span className={lead.sslEnabled ? "text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded border border-emerald-500/10" : "text-rose-400 font-semibold bg-rose-500/10 px-1 rounded border border-rose-500/10"}>
                        {lead.sslEnabled ? "SSL SECURE" : "NO SSL"}
                      </span>
                      <span className={lead.mobileFriendly ? "text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded border border-emerald-500/10" : "text-rose-400 font-semibold bg-rose-500/10 px-1 rounded border border-rose-500/10"}>
                        {lead.mobileFriendly ? "MOBILE OK" : "DESKTOP ONLY"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-text-dark font-mono pt-1">
                    <Globe className="h-3.5 w-3.5 shrink-0 opacity-40" />
                    <span>No website found</span>
                  </div>
                )}
              </div>

              {/* Socials & CRM Footer Actions */}
              <div className="border-t border-border/40 pt-3 flex items-center justify-between gap-3">
                {/* Social icons */}
                <div className="flex items-center gap-2 shrink-0">
                  {lead.facebookUrl ? (
                    <a href={lead.facebookUrl} target="_blank" rel="noreferrer" className="text-indigo-400 bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20 hover:text-white hover:bg-indigo-500/25 transition">
                      <Facebook className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Facebook className="h-3.5 w-3.5 text-text-dark/40 opacity-20" />
                  )}

                  {lead.instagramUrl ? (
                    <a href={lead.instagramUrl} target="_blank" rel="noreferrer" className="text-pink-400 bg-pink-500/10 p-1.5 rounded-lg border border-pink-500/20 hover:text-white hover:bg-pink-500/25 transition">
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Instagram className="h-3.5 w-3.5 text-text-dark/40 opacity-20" />
                  )}
                </div>

                {/* Status Trigger Dropdown */}
                <div className="flex items-center gap-1.5">
                  {isSaved ? (
                    <select
                      value={status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value as OutreachStatus)}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-0 ${getStatusStyle(status)} bg-card cursor-pointer`}
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => saveLead(lead.id)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-background text-text-primary hover:bg-primary hover:text-black transition text-[10px] font-bold border border-border cursor-pointer shrink-0"
                    >
                      <Save className="h-3 w-3 text-primary shrink-0" />
                      Save Lead
                    </button>
                  )}

                  {isSaved && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Remove this lead from saved list?")) {
                          removeSavedLead(lead.id);
                        }
                      }}
                      className="text-text-dark hover:text-rose-400 p-1.5 transition cursor-pointer shrink-0"
                      title="Remove saved lead"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
