"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Lead, OutreachStatus } from "@/types/lead";
import { 
  FolderKanban, PlusCircle, FileText, Search, MapPin, 
  Phone, Mail, Globe, ExternalLink, Calendar, MessageCircle, 
  Trash2, Award, ClipboardEdit, CheckCircle
} from "lucide-react";

interface PipelineViewProps {
  onLeadClick: (lead: Lead) => void;
}

const statusOptions: OutreachStatus[] = [
  "Not Contacted", "Contacted", "Interested", "Not Interested", 
  "Meeting Scheduled", "Proposal Sent", "Follow Up", "Fake", "Forwarded", "Won", "Lost"
];

// Helper X close icon
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export default function PipelineView({ onLeadClick }: PipelineViewProps) {
  const { 
    savedLeads, leads, updateLeadStatus, updateLeadNotes, 
    removeSavedLead, campaigns, createCampaign, currentUser 
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState("all");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // States to manage status and notes update feedback
  const [savedFeedback, setSavedFeedback] = useState<Record<string, string>>({}); // leadId -> message
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({}); // leadId -> notes text
  const [localFollowUp, setLocalFollowUp] = useState<Record<string, string>>({}); // leadId -> followUpDate

  const currentUserId = currentUser?.id || "guest";

  // Build saved prospects details
  const pipelineLeads = savedLeads
    .filter(sl => sl.userId === currentUserId)
    .map(sl => {
      const leadDetail = leads.find(l => l.id === sl.leadId);
      return {
        ...sl,
        detail: leadDetail
      };
    })
    .filter(item => {
      if (!item.detail) return false;
      
      // Filter by Campaign
      if (selectedCampaignFilter !== "all" && item.campaignId !== selectedCampaignFilter) {
        return false;
      }

      // Filter by Status
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Search Query filter
      const nameMatch = item.detail.businessName.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = item.detail.category.toLowerCase().includes(searchQuery.toLowerCase());
      const addressMatch = item.detail.address.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || categoryMatch || addressMatch;
    });

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    createCampaign(newCampaignName, newCampaignDesc);
    setNewCampaignName("");
    setNewCampaignDesc("");
    setShowCampaignModal(false);
  };

  const triggerFeedback = (leadId: string, message: string) => {
    setSavedFeedback(prev => ({ ...prev, [leadId]: message }));
    setTimeout(() => {
      setSavedFeedback(prev => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
    }, 2000);
  };

  const handleStatusChange = (leadId: string, newStatus: OutreachStatus) => {
    updateLeadStatus(leadId, newStatus);
    triggerFeedback(leadId, "Status updated!");
  };

  const handleNotesSave = (leadId: string, notes: string, followUpDate?: string) => {
    updateLeadNotes(leadId, notes, followUpDate);
    triggerFeedback(leadId, "Notes saved successfully!");
  };

  const getStatusColorClass = (status: OutreachStatus) => {
    switch (status) {
      case "Not Contacted": return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/25";
      case "Contacted": return "bg-blue-500/10 text-blue-400 border border-blue-500/25";
      case "Interested": return "bg-sky-500/10 text-sky-400 border border-sky-500/25";
      case "Not Interested": return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
      case "Meeting Scheduled": return "bg-teal-500/10 text-teal-400 border border-teal-500/25";
      case "Proposal Sent": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25";
      case "Follow Up": return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
      case "Fake": return "bg-orange-500/10 text-orange-400 border border-orange-500/25";
      case "Forwarded": return "bg-violet-500/10 text-violet-400 border border-violet-500/25";
      case "Won": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
      case "Lost": return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
      default: return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/25";
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 55) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Top Banner and Search Bar */}
      <div className="bg-card p-5 rounded-xl border border-border space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Outreach Saved Prospects</h2>
              <p className="text-xs text-text-muted mt-0.5">Manage statuses, log meeting/proposal notes, and contact leads directly</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCampaignModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-border hover:bg-card-hover border border-border text-text-primary text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-primary" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-border/40">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search leads by name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted shrink-0">Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Stages ({pipelineLeads.length})</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Campaign Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted shrink-0">Campaign:</span>
            <select
              value={selectedCampaignFilter}
              onChange={(e) => setSelectedCampaignFilter(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Prospects Counter info */}
          <div className="hidden lg:flex items-center justify-end text-xs text-text-muted font-semibold">
            <span>Matching: {pipelineLeads.length} prospects</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {pipelineLeads.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center space-y-2.5 select-none">
          <p className="text-xs text-text-muted italic">No saved leads match your current query or filters.</p>
          <p className="text-[11px] text-text-dark">Navigate to "Search Leads" to search and add businesses to your pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pipelineLeads.map((sl) => {
            const lead = sl.detail as Lead;
            const feedbackMsg = savedFeedback[sl.leadId];
            
            // Notes & follow up local tracking
            const currentNotes = localNotes[sl.leadId] !== undefined ? localNotes[sl.leadId] : (sl.notes || "");
            const currentFollowUp = localFollowUp[sl.leadId] !== undefined ? localFollowUp[sl.leadId] : (sl.followUpDate || "");

            return (
              <div 
                key={sl.leadId}
                className="bg-card border border-border rounded-xl p-5 flex flex-col space-y-4 hover:border-primary/50 transition-all duration-300 shadow-sm relative group"
              >
                {/* Header Row */}
                <div className="flex justify-between items-start gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/15">{lead.category}</span>
                    <h3 
                      onClick={() => onLeadClick(lead)}
                      className="font-extrabold text-text-primary text-sm tracking-tight leading-snug hover:text-primary transition-colors cursor-pointer mt-1.5"
                    >
                      {lead.businessName}
                    </h3>
                    <p className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3 w-3 text-text-muted/80 shrink-0" />
                      <span className="truncate max-w-[280px]">{lead.address}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${getScoreColorClass(lead.leadScore)}`}>
                      Score: {lead.leadScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSavedLead(lead.id)}
                      className="p-1 rounded text-text-muted hover:text-rose-400 hover:bg-rose-500/10 border border-border/40 transition cursor-pointer"
                      title="Remove Prospect"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Status Dropdown Selector */}
                <div className="space-y-1.5 bg-background/30 border border-border/40 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-text-muted">Outreach Stage Status</label>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        sl.status === "Won" ? "bg-emerald-400 shadow-[0_0_8px_#34D399]" :
                        sl.status === "Lost" ? "bg-rose-400" : "bg-primary"
                      }`} />
                      <span className="text-[11px] font-semibold text-text-primary">{sl.status}</span>
                    </div>
                  </div>

                  <select
                    value={sl.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value as OutreachStatus)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer text-left w-full sm:w-44 ${getStatusColorClass(sl.status)}`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt} className="bg-card text-text-primary font-semibold">{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Inline Notes Editor & Follow Up Calendar */}
                <div className="space-y-3 bg-background/50 border border-border/55 p-3 rounded-xl">
                  <div className="flex justify-between items-center select-none">
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-text-muted/95 tracking-wide">
                      <ClipboardEdit className="h-3.5 w-3.5 text-primary shrink-0" />
                      Client Outreach Notes
                    </span>
                    {feedbackMsg && (
                      <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse select-none">
                        <CheckCircle className="h-3 w-3 stroke-[2.5]" />
                        {feedbackMsg}
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={currentNotes}
                    onChange={(e) => setLocalNotes(prev => ({ ...prev, [sl.leadId]: e.target.value }))}
                    onBlur={() => handleNotesSave(lead.id, currentNotes, currentFollowUp)}
                    placeholder="Log outreach discussions, meeting details, customized services requested..."
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition leading-relaxed resize-none"
                  />

                  {/* Follow Up Date Picker & Action Save row */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 pt-1.5 border-t border-border/40">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Next Action:</span>
                      <input
                        type="date"
                        value={currentFollowUp}
                        onChange={(e) => {
                          setLocalFollowUp(prev => ({ ...prev, [sl.leadId]: e.target.value }));
                          handleNotesSave(lead.id, currentNotes, e.target.value);
                        }}
                        className="bg-card border border-border rounded px-2 py-0.5 text-[11px] text-text-primary focus:outline-none cursor-pointer font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleNotesSave(lead.id, currentNotes, currentFollowUp)}
                      className="btn-primary rounded-lg py-1 px-3.5 text-[10px] font-bold cursor-pointer transition select-none self-end sm:self-center"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>

                {/* Prospects Direct Contacts Links Bar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    {lead.phoneNumber && (
                      <a 
                        href={`tel:${lead.phoneNumber}`}
                        className="flex items-center gap-1 hover:text-text-primary transition font-mono text-[10px] text-text-muted bg-card hover:bg-card-hover border border-border px-2 py-1.5 rounded-lg"
                      >
                        <Phone className="h-3 w-3 text-primary shrink-0" />
                        <span>Call</span>
                      </a>
                    )}
                    
                    {lead.phoneNumber && (
                      <a 
                        href={`https://wa.me/${lead.phoneNumber.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-emerald-400 transition font-mono text-[10px] text-text-muted bg-card hover:bg-card-hover border border-border px-2 py-1.5 rounded-lg"
                      >
                        <MessageCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {lead.email && (
                      <a 
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1 hover:text-blue-400 transition text-[10px] text-text-muted bg-card hover:bg-card-hover border border-border px-2 py-1.5 rounded-lg"
                      >
                        <Mail className="h-3 w-3 text-blue-400 shrink-0" />
                        <span>Email</span>
                      </a>
                    )}

                    {lead.website && (
                      <a 
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition text-[10px] text-text-muted bg-card hover:bg-card-hover border border-border px-2 py-1.5 rounded-lg"
                      >
                        <Globe className="h-3 w-3 text-primary shrink-0" />
                        <span>Web</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onLeadClick(lead)}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer bg-primary/5 hover:bg-primary/10 border border-primary/15 px-2.5 py-1.5 rounded-lg"
                  >
                    <span>Analyze</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md select-none animate-fade-in p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary">Create New Campaign</h3>
              <button 
                onClick={() => setShowCampaignModal(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer p-1.5 rounded-lg border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-text-muted uppercase text-[9px] font-bold">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g. Chicago Dentists Cold Call"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-text-muted uppercase text-[9px] font-bold">Description / Goals</label>
                <textarea
                  rows={3}
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  placeholder="Describe target market and goals..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 bg-border hover:bg-card-hover border border-border rounded-lg text-text-primary font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 btn-primary rounded-lg font-semibold cursor-pointer"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
