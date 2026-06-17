"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { 
  BarChart3, CheckCircle2, TrendingUp, Calendar, 
  FileSpreadsheet, Award, Target, HelpCircle 
} from "lucide-react";

export default function AnalyticsDashboard() {
  const mounted = useMounted();
  const { savedLeads: storeSavedLeads, leads, campaigns, currentUser } = useAppStore();
  const currentUserId = currentUser?.id || "guest";
  const savedLeads = storeSavedLeads.filter(sl => sl.userId === currentUserId);


  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-card rounded-xl border border-border animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-card rounded-xl border border-border animate-pulse"></div>
          <div className="h-64 bg-card rounded-xl border border-border animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Calculate CRM Metrics
  const totalSaved = savedLeads.length;
  const contacted = savedLeads.filter(sl => sl.status !== "Not Contacted").length;
  const meetings = savedLeads.filter(sl => sl.status === "Meeting Scheduled").length;
  const proposals = savedLeads.filter(sl => sl.status === "Proposal Sent").length;
  const won = savedLeads.filter(sl => sl.status === "Won").length;
  const lost = savedLeads.filter(sl => sl.status === "Lost").length;
  const conversionRate = totalSaved > 0 ? Math.round((won / totalSaved) * 100) : 0;

  // 1. Pipeline Funnel Data
  const funnelData = [
    { name: "Saved", count: totalSaved },
    { name: "Contacted", count: contacted },
    { name: "Proposals", count: proposals + meetings + won },
    { name: "Meetings", count: meetings + won },
    { name: "Won", count: won }
  ];

  // 2. Category Breakdown data
  const categoryCount: Record<string, number> = {};
  savedLeads.forEach(sl => {
    const leadDetail = leads.find(l => l.id === sl.leadId);
    if (leadDetail) {
      categoryCount[leadDetail.category] = (categoryCount[leadDetail.category] || 0) + 1;
    }
  });

  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 5); // top 5

  // 3. City Breakdown data
  const cityCount: Record<string, number> = {};
  savedLeads.forEach(sl => {
    const leadDetail = leads.find(l => l.id === sl.leadId);
    if (leadDetail) {
      const city = leadDetail.address.split(",")[1]?.trim() || "Local";
      cityCount[city] = (cityCount[city] || 0) + 1;
    }
  });

  const cityData = Object.entries(cityCount).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const COLORS = ["#38BDF8", "#0EA5E9", "#0284C7", "#0369A1", "#075985"];

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Outreach Performance Dashboard</h2>
            <p className="text-xs text-text-muted">Real-time charts and lead generation analytics</p>
          </div>
        </div>
        
        {/* Export Data */}
        <button
          onClick={() => {
            if (savedLeads.length === 0) {
              alert("No leads saved yet to export!");
              return;
            }
            const csvRows = [
              ["Lead ID", "Business Name", "Category", "Rating", "Reviews", "Phone", "Website", "Status", "Notes"],
              ...savedLeads.map(sl => {
                const l = leads.find(lead => lead.id === sl.leadId);
                return [
                  sl.leadId,
                  l?.businessName || "Unknown",
                  l?.category || "Unknown",
                  l?.rating || 0,
                  l?.reviewsCount || 0,
                  `"${l?.phoneNumber || ""}"`,
                  l?.website || "",
                  sl.status,
                  `"${sl.notes.replace(/"/g, '""')}"`
                ];
              })
            ];
            const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `localead_outreach_leads_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center gap-1.5 bg-border hover:bg-card-hover border border-border text-text-primary text-xs font-semibold px-3.5 py-2 rounded-lg transition self-start sm:self-center cursor-pointer"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
          Export Saved Leads CSV
        </button>
      </div>

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Widget 1: Saved Leads */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
            <Target className="h-3 w-3 text-primary" />
            Saved Leads
          </p>
          <p className="text-xl font-extrabold text-text-primary">{totalSaved}</p>
        </div>

        {/* Widget 2: Contacted */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Contacted</p>
          <p className="text-xl font-extrabold text-text-primary">{contacted}</p>
        </div>

        {/* Widget 3: Meetings */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Meetings</p>
          <p className="text-xl font-extrabold text-text-primary">{meetings}</p>
        </div>

        {/* Widget 4: Proposals */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Proposals</p>
          <p className="text-xl font-extrabold text-text-primary">{proposals}</p>
        </div>

        {/* Widget 5: Won */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
            <Award className="h-3 w-3 text-emerald-500" />
            Won Leads
          </p>
          <p className="text-xl font-extrabold text-emerald-500">{won}</p>
        </div>

        {/* Widget 6: Lost */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Lost</p>
          <p className="text-xl font-extrabold text-rose-500">{lost}</p>
        </div>

        {/* Widget 7: Conv Rate */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            Conv. Rate
          </p>
          <p className="text-xl font-extrabold text-text-primary">{conversionRate}%</p>
        </div>
      </div>

      {/* Recharts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Funnel Analysis */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">
            Conversion Funnel Analysis
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: -10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text-primary)" }} 
                  labelStyle={{ color: "var(--text-primary)" }}
                  itemStyle={{ color: "#38BDF8" }}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">
            Category Breakdown (Top 5)
          </h3>
          <div className="h-60 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="text-xs text-text-muted italic">Save leads to see category breakdown</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    itemStyle={{ color: "var(--text-primary)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {categoryData.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-[10px] text-text-muted pt-1">
              {categoryData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span>{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 3: City Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">
            City Breakdown (Top 5)
          </h3>
          <div className="h-60 w-full">
            {cityData.length === 0 ? (
              <div className="text-center py-24 text-xs text-text-muted italic">Save leads to see city breakdown</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} margin={{ left: -25, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text-primary)" }} 
                    labelStyle={{ color: "var(--text-primary)" }}
                    itemStyle={{ color: "#38BDF8" }}
                  />
                  <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
