"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import SearchForm from "@/components/search/SearchForm";
import FilterPanel from "@/components/search/FilterPanel";
import ResultsTable from "@/components/search/ResultsTable";
import LeadDrawer from "@/components/leads/LeadDrawer";
import PipelineView from "@/components/crm/PipelineView";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import AdminPanel from "@/components/admin/AdminPanel";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { Lead } from "@/types/lead";
import { 
  Sparkles, ShieldAlert, ArrowRight, ShieldCheck, Mail, Phone, 
  ExternalLink, Search, Bookmark, Briefcase, BarChart3, Star, Trash2 
} from "lucide-react";

export default function DashboardPage() {
  const mounted = useMounted();
  const { 
    currentUser, savedLeads, leads, removeSavedLead, campaigns, executeSearch, searchResults 
  } = useAppStore();
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>("search");
  
  // Selected lead for detail slide-out drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Saved leads filtering states
  const [savedFilterCampaign, setSavedFilterCampaign] = useState<string>("all");
  const [savedSearchTerm, setSavedSearchTerm] = useState<string>("");

  // Seed default results on first load
  useEffect(() => {
    if (mounted && searchResults.length === 0) {
      executeSearch();
    }
  }, [mounted, executeSearch, searchResults]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0B0C] text-white select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider text-text-muted">Loading Localead...</span>
        </div>
      </div>
    );
  }

  const currentUserId = currentUser?.id || "guest";

  // Filtered Saved Leads
  const filteredSavedLeads = savedLeads
    .filter(sl => sl.userId === currentUserId)
    .map(sl => {
      const detail = leads.find(l => l.id === sl.leadId);
      return { ...sl, detail };
    })
    .filter(sl => {
      if (!sl.detail) return false;
      
      const matchesSearch = sl.detail.businessName.toLowerCase().includes(savedSearchTerm.toLowerCase()) ||
                            sl.detail.category.toLowerCase().includes(savedSearchTerm.toLowerCase());
      
      const matchesCampaign = savedFilterCampaign === "all" || sl.campaignId === savedFilterCampaign;
      
      return matchesSearch && matchesCampaign;
    });


  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans select-none">
      {/* Dynamic Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main SaaS App Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 pb-20 md:pb-8 animate-fade-in">
        
        {/* SEARCH TAB */}
        {activeTab === "search" && (
          <div className="space-y-6">
            {/* Inputs Panel */}
            <SearchForm />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <FilterPanel />
              </div>

              {/* Leads Results Grid Table */}
              <div className="lg:col-span-3">
                <ResultsTable onRowClick={(lead) => setSelectedLead(lead)} />
              </div>
            </div>
          </div>
        )}

        {/* MY LEADS TAB (CRM Pipeline Kanban) */}
        {activeTab === "my-leads" && (
          <PipelineView onLeadClick={(lead) => setSelectedLead(lead)} />
        )}

        {/* SAVED BUSINESSES TAB */}
        {activeTab === "saved" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card p-4 rounded-xl border border-border">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Saved Prospects Directory</h2>
                <p className="text-xs text-text-muted mt-0.5">Organize saved businesses, edit follow-up calendars, and delete leads</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <input
                  type="text"
                  value={savedSearchTerm}
                  onChange={(e) => setSavedSearchTerm(e.target.value)}
                  placeholder="Filter saved prospects..."
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary"
                />

                {/* Campaign */}
                <select
                  value={savedFilterCampaign}
                  onChange={(e) => setSavedFilterCampaign(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer text-left"
                >
                  <option value="all">All Campaigns</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Saved list table */}
            {filteredSavedLeads.length === 0 ? (
              <div className="rounded-xl border border-border bg-card py-16 text-center space-y-4 shadow-sm">
                <Bookmark className="h-6 w-6 text-text-muted mx-auto" />
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">No Saved Leads Match</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Try clearing filters or save new leads from the finder engine.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-background text-text-muted font-medium select-none">
                        <th className="py-3 px-4 min-w-[200px]">Business Details</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Website</th>
                        <th className="py-3 px-4">CRM Status</th>
                        <th className="py-3 px-4">Notes Log</th>
                        <th className="py-3 px-4">Follow up</th>
                        <th className="py-3 px-4 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredSavedLeads.map((sl) => {
                        const lead = sl.detail as Lead;
                        return (
                          <tr 
                            key={lead.id}
                            className="hover:bg-card-hover/30 transition cursor-pointer select-none"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <td className="py-3 px-4">
                              <div className="font-semibold text-text-primary">{lead.businessName}</div>
                              <div className="text-[10px] text-text-muted mt-0.5">
                                {lead.category} • {lead.address.split(",")[1] || lead.address}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-text-muted">
                              {lead.phoneNumber ? (
                                <a href={`tel:${lead.phoneNumber}`} className="hover:text-primary flex items-center gap-1">
                                  <Phone className="h-3 w-3 opacity-60" />
                                  {lead.phoneNumber}
                                </a>
                              ) : (
                                <span className="text-text-dark font-mono">None</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {lead.website ? (
                                <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                  <span>Visit site</span>
                                  <ExternalLink className="h-2.5 w-2.5 opacity-55" />
                                </a>
                              ) : (
                                <span className="text-text-dark font-mono">None</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold capitalize">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                sl.status === "Won" ? "bg-emerald-500/10 text-emerald-400" :
                                sl.status === "Lost" ? "bg-rose-500/10 text-rose-400" :
                                sl.status === "Contacted" ? "bg-blue-500/10 text-blue-400" :
                                sl.status === "Interested" ? "bg-sky-500/10 text-sky-400" :
                                "bg-zinc-500/10 text-zinc-400"
                              }`}>
                                {sl.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-text-muted max-w-[200px] truncate" title={sl.notes}>
                              {sl.notes || <span className="text-text-dark italic">No notes logged</span>}
                            </td>
                            <td className="py-3 px-4 text-text-muted font-mono">
                              {sl.followUpDate || "—"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Are you sure you want to remove this lead?")) {
                                    removeSavedLead(lead.id);
                                  }
                                }}
                                className="text-text-dark hover:text-rose-400 p-1.5 transition cursor-pointer"
                                title="Delete Prospect"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <AnalyticsDashboard />
        )}

        {/* ADMIN TAB */}
        {activeTab === "admin" && currentUser?.role === "admin" && (
          <AdminPanel />
        )}

      </main>

      {/* Floating Side Drawer details for Lead insights and AI copy generation */}
      <LeadDrawer 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)} 
      />

      {/* Footnote branding */}
      <footer className="py-8 border-t border-border mt-16 bg-card/40 text-center select-none text-[11px] text-text-muted">
        <p>© 2026 Localead Inc. Designed for agencies and consultants. Powered by Gemini & OpenAI.</p>
      </footer>
    </div>
  );
}
