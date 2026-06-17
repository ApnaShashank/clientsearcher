"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Lead, OutreachStatus } from "@/types/lead";
import { 
  ChevronLeft, ChevronRight, MessageSquare, Calendar, FolderKanban, 
  PlusCircle, GripVertical, FileText, ChevronUp, ChevronDown 
} from "lucide-react";

interface PipelineViewProps {
  onLeadClick: (lead: Lead) => void;
}

const statusColumns: OutreachStatus[] = [
  "Not Contacted", "Contacted", "Interested", "Not Interested", 
  "Fake", "Forwarded", "Won", "Lost"
];

// Helper X icon
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export default function PipelineView({ onLeadClick }: PipelineViewProps) {
  const { savedLeads, leads, updateLeadStatus, updateLeadNotes, campaigns, createCampaign } = useAppStore();
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState("all");
  
  // Mobile responsive active column stage tab
  const [activeStageMobile, setActiveStageMobile] = useState<OutreachStatus>("Not Contacted");

  // Track local inline notes modifications
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  // Track expanded note sections inside kanban cards to save layout space
  const [expandedCardNotes, setExpandedCardNotes] = useState<Record<string, boolean>>({});

  const toggleCardNotes = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCardNotes(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  // Move lead between stages helper
  const handleMoveStatus = (leadId: string, currentStatus: OutreachStatus, direction: "prev" | "next") => {
    const currentIndex = statusColumns.indexOf(currentStatus);
    let nextIndex = currentIndex;
    
    if (direction === "prev" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (direction === "next" && currentIndex < statusColumns.length - 1) {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex !== currentIndex) {
      updateLeadStatus(leadId, statusColumns[nextIndex]);
    }
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    createCampaign(newCampaignName, newCampaignDesc);
    setNewCampaignName("");
    setNewCampaignDesc("");
    setShowCampaignModal(false);
  };

  const getStatusColor = (status: OutreachStatus) => {
    switch (status) {
      case "Not Contacted": return "border-t-zinc-500 bg-zinc-500/[0.01]";
      case "Contacted": return "border-t-blue-500 bg-blue-500/[0.01]";
      case "Interested": return "border-t-sky-500 bg-sky-500/[0.01]";
      case "Not Interested": return "border-t-slate-500 bg-slate-500/[0.01]";
      case "Fake": return "border-t-orange-500 bg-orange-500/[0.01]";
      case "Forwarded": return "border-t-violet-500 bg-violet-500/[0.01]";
      case "Won": return "border-t-emerald-500 bg-emerald-500/[0.01]";
      case "Lost": return "border-t-rose-500 bg-rose-500/[0.01]";
      default: return "border-t-zinc-500 bg-zinc-500/[0.01]";
    }
  };

  const getStatusHeaderBg = (status: OutreachStatus) => {
    switch (status) {
      case "Not Contacted": return "border-t-zinc-500/80";
      case "Contacted": return "border-t-blue-500/80";
      case "Interested": return "border-t-sky-500/80";
      case "Not Interested": return "border-t-slate-500/80";
      case "Fake": return "border-t-orange-500/80";
      case "Forwarded": return "border-t-violet-500/80";
      case "Won": return "border-t-emerald-500/80";
      case "Lost": return "border-t-rose-500/80";
      default: return "border-t-zinc-500/80";
    }
  };

  const getStatusBadgeStyle = (status: OutreachStatus) => {
    switch (status) {
      case "Not Contacted": return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
      case "Contacted": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Interested": return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      case "Not Interested": return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
      case "Fake": return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "Forwarded": return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
      case "Won": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Lost": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    }
  };

  const getScoreStyle = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 55) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  // Build items mapping: matching savedLeads with lead details
  const pipelineLeads = savedLeads
    .map(sl => {
      const leadDetail = leads.find(l => l.id === sl.leadId);
      return {
        ...sl,
        detail: leadDetail
      };
    })
    .filter(item => {
      if (!item.detail) return false;
      if (selectedCampaignFilter !== "all" && item.campaignId !== selectedCampaignFilter) {
        return false;
      }
      return true;
    });

  const renderColumn = (colStatus: OutreachStatus) => {
    const colLeads = pipelineLeads.filter(l => l.status === colStatus);
    
    return (
      <div 
        key={colStatus} 
        className={`rounded-xl border border-border border-t-4 ${getStatusHeaderBg(colStatus)} ${getStatusColor(colStatus)} flex flex-col w-[280px] min-w-[280px] shrink-0 min-h-[580px] shadow-lg`}
      >
        {/* Column header */}
        <div className="p-3.5 border-b border-border bg-card-hover/20 flex justify-between items-center select-none">
          <span className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider truncate mr-1" title={colStatus}>
            {colStatus}
          </span>
          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${getStatusBadgeStyle(colStatus)}`}>
            {colLeads.length}
          </span>
        </div>

        {/* Column body */}
        <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
          {colLeads.length === 0 ? (
            <div className="text-center py-12 text-[10px] text-text-muted italic select-none">
              No leads in this stage
            </div>
          ) : (
            colLeads.map((sl) => {
              const lead = sl.detail as Lead;
              const isNotesExpanded = !!expandedCardNotes[sl.leadId];
              return (
                <div 
                  key={sl.leadId}
                  className="bg-card border border-border/80 rounded-xl p-3.5 space-y-3 hover:border-primary/45 transition-all duration-300 hover:shadow-xl relative group"
                  onClick={() => onLeadClick(lead)}
                >
                  {/* Grip Header / Top actions */}
                  <div className="flex items-center justify-between border-b border-border/30 pb-2 select-none">
                    <div className="flex items-center gap-1.5 text-text-dark cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-3.5 w-3.5 text-text-muted/65 group-hover:text-primary transition-colors" />
                      <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">{lead.category}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold shrink-0 ${getScoreStyle(lead.leadScore)}`}>
                      {lead.leadScore} Score
                    </span>
                  </div>

                  {/* Business Title */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-text-primary text-xs leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {lead.businessName}
                    </h4>
                    <p className="text-[9px] text-text-muted truncate" title={lead.address}>
                      {lead.address.split(",")[1] || lead.address}
                    </p>
                  </div>

                  {/* Note block - Collapsible or Inline Edit if Forwarded */}
                  {colStatus === "Forwarded" ? (
                    <div 
                      className="text-[10px] text-text-muted bg-background/50 p-2.5 rounded-lg border border-border/85 space-y-2"
                      onClick={(e) => e.stopPropagation()} // Prevent drawer click
                    >
                      <div className="flex items-center justify-between font-bold text-[9px] uppercase tracking-wider text-text-muted/80">
                        <span className="flex items-center gap-1.5 text-primary">
                          <FileText className="h-3 w-3 shrink-0" />
                          Client Notes
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={localNotes[sl.leadId] !== undefined ? localNotes[sl.leadId] : (sl.notes || "")}
                        onChange={(e) => setLocalNotes(prev => ({ ...prev, [sl.leadId]: e.target.value }))}
                        placeholder="Write client details, requirements, next steps..."
                        className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-[10px] text-text-primary focus:outline-none focus:border-primary transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateLeadNotes(sl.leadId, localNotes[sl.leadId] || "", sl.followUpDate);
                          alert("Client notes successfully updated!");
                        }}
                        className="w-full btn-primary rounded-lg py-1 text-[9px] font-bold cursor-pointer"
                      >
                        Save Client Notes
                      </button>
                    </div>
                  ) : (
                    sl.notes && (
                      <div className="text-[10px] text-text-muted bg-background p-2 rounded-lg border border-border/60 space-y-1">
                        <div 
                          onClick={(e) => toggleCardNotes(sl.leadId, e)}
                          className="flex items-center justify-between font-semibold text-[9px] uppercase tracking-wider text-text-muted/80 cursor-pointer select-none"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-primary" />
                            Outreach Notes
                          </span>
                          {isNotesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </div>

                        <p className={`leading-relaxed ${isNotesExpanded ? "block" : "line-clamp-2"}`}>
                          {sl.notes}
                        </p>
                      </div>
                    )
                  )}

                  {/* Follow up tag */}
                  {sl.followUpDate && (
                    <div className="flex items-center gap-1.5 text-[9px] text-amber-400 font-bold font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md w-fit select-none">
                      <Calendar className="h-3 w-3" />
                      <span>Follow Up: {sl.followUpDate}</span>
                    </div>
                  )}

                  {/* Column Phase navigation controls */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-border/40 select-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveStatus(sl.leadId, colStatus, "prev");
                      }}
                      disabled={colStatus === "Not Contacted"}
                      className="p-1.5 rounded bg-background border border-border hover:bg-card-hover/40 text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer transition"
                      title="Move back"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>

                    <span className="text-[9px] text-text-muted italic group-hover:text-text-primary transition-colors">
                      Click to analyze
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveStatus(sl.leadId, colStatus, "next");
                      }}
                      disabled={colStatus === "Lost"}
                      className="p-1.5 rounded bg-background border border-border hover:bg-card-hover/40 text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer transition"
                      title="Move forward"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Filters bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Outreach Sales Pipeline</h2>
            <p className="text-xs text-text-muted">Track communication stages and client conversions in real-time</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          {/* Campaign Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Campaign:</span>
            <select
              value={selectedCampaignFilter}
              onChange={(e) => setSelectedCampaignFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer text-left"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-1.5 bg-border hover:bg-card-hover border border-border text-text-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-primary" />
            New Campaign
          </button>
        </div>
      </div>

      {/* MOBILE STAGE NAVIGATION PILLS */}
      <div className="block md:hidden">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
          {statusColumns.map(stage => {
            const count = pipelineLeads.filter(l => l.status === stage).length;
            const isSelected = activeStageMobile === stage;
            return (
              <button
                key={stage}
                onClick={() => setActiveStageMobile(stage)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition cursor-pointer ${
                  isSelected
                    ? "bg-primary text-black border-primary font-bold"
                    : "bg-card text-text-muted border-border hover:text-text-primary"
                }`}
              >
                {stage} ({count})
              </button>
            );
          })}
        </div>
        
        {/* Render Single Selected Column on Mobile */}
        <div className="mt-4">
          {renderColumn(activeStageMobile)}
        </div>
      </div>

      {/* KANBAN BOARD LAYOUT FOR DESKTOP (PREMIUM HORIZONTAL SCROLL) */}
      <div className="hidden md:block">
        <div className="flex overflow-x-auto gap-5 pb-6 pt-2 scrollbar-thin select-none snap-x items-start">
          {statusColumns.map(col => renderColumn(col))}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="text-sm font-bold text-text-primary">Create New Campaign</h3>
              <button 
                onClick={() => setShowCampaignModal(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer p-1 rounded-lg border border-border"
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
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-text-muted uppercase text-[9px] font-bold">Description / Goals</label>
                <textarea
                  rows={3}
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  placeholder="Describe target market and goals..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary"
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
