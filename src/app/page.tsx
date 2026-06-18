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
import TaskBoard from "@/components/tasks/TaskBoard";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { Lead } from "@/types/lead";
import { 
  Sparkles, ShieldAlert, ArrowRight, ShieldCheck, Mail, Phone, 
  ExternalLink, Search, Briefcase, BarChart3, Star
} from "lucide-react";

export default function DashboardPage() {
  const mounted = useMounted();
  const { 
    currentUser, executeSearch, searchResults 
  } = useAppStore();
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>("search");
  
  // Selected lead for detail slide-out drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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

            {/* Horizontal Filter Panel */}
            <FilterPanel />

            {/* Leads Results Grid Table (Full Width) */}
            <ResultsTable onRowClick={(lead) => setSelectedLead(lead)} />
          </div>
        )}

        {/* MY LEADS TAB (CRM Pipeline Kanban) */}
        {activeTab === "my-leads" && (
          <PipelineView onLeadClick={(lead) => setSelectedLead(lead)} />
        )}

        {/* ADMIN TASKS BOARD TAB */}
        {activeTab === "tasks" && (
          <TaskBoard />
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
