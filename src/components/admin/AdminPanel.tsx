"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { 
  ShieldAlert, Users, Search, DollarSign, Ban, Trash2, 
  MapPin, Tag, RefreshCw, Key, ChevronDown, ChevronUp, Check, Play, Bell
} from "lucide-react";

export default function AdminPanel() {
  const mounted = useMounted();
  const { currentUser } = useAppStore();
  const [metrics, setMetrics] = useState<any>(null);
  
  // Custom API key inputs
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [tavilyKeyInput, setTavilyKeyInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<"users" | "logs" | "activities" | "keys" | "notifications">("users");

  
  // Search logs expansion tracker
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Poll metrics from the Next.js server memory
  useEffect(() => {
    if (!mounted) return;

    async function fetchMetrics() {
      try {
        const res = await fetch("/api/admin/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
          // Sync keys to local inputs if they are configured
          if (data.customApiKeys) {
            setOpenaiKeyInput(data.customApiKeys.OPENAI_API_KEY || "");
            setTavilyKeyInput(data.customApiKeys.TAVILY_API_KEY || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin metrics:", err);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted || !metrics) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="h-14 bg-card rounded-xl border border-border" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-card rounded-xl border border-border" />
          ))}
        </div>
        <div className="h-64 bg-card rounded-xl border border-border" />
      </div>
    );
  }

  // Handle saving customized API keys config
  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateKeys",
          payload: {
            OPENAI_API_KEY: openaiKeyInput,
            TAVILY_API_KEY: tavilyKeyInput
          }
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Perform CRM updates directly synced on the server state
  const handleUpdatePlan = async (userId: string, plan: string) => {
    try {
      await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateUserPlan", payload: { userId, plan } })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBan = async (userId: string) => {
    if (currentUser?.id === userId) {
      alert("You cannot ban yourself!");
      return;
    }
    try {
      await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleBanUser", payload: { userId } })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      alert("You cannot delete yourself!");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteUser", payload: { userId } })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate Admin Metrics from Real serverState Data
  const totalUsers = metrics.users.length;
  const activeUsers = metrics.users.filter((u: any) => !u.isBanned).length;
  const totalSearches = metrics.searchLogs.length;
  const onlineUsers = metrics.onlineUsers;
  
  // Calculate Revenue Analytics
  let calculatedMonthlyRevenue = 0;
  metrics.users.forEach((u: any) => {
    if (u.isBanned) return;
    if (u.plan === "Pro") calculatedMonthlyRevenue += 49;
    if (u.plan === "Enterprise") calculatedMonthlyRevenue += 249;
  });

  // Top Search Calculations
  const cityCount: Record<string, number> = {};
  const categoryCount: Record<string, number> = {};
  metrics.searchLogs.forEach((log: any) => {
    if (log.city) cityCount[log.city] = (cityCount[log.city] || 0) + 1;
    if (log.category) categoryCount[log.category] = (categoryCount[log.category] || 0) + 1;
  });

  const mostSearchedCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "New York City";
  const mostSearchedCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Dental Clinic";

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Admin Panel Header */}
      <div className="bg-[#111111] border border-[#1F1F1F] p-4 rounded-xl flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 text-rose-500" />
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Localead Administration Dashboard</h2>
          <p className="text-xs text-text-muted">Monitor system stats, track active sessions, verify user actions, and customize integrations</p>
        </div>
      </div>

      {/* Admin metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            Total/Active Users
          </p>
          <p className="text-lg font-extrabold text-text-primary">
            {totalUsers} <span className="text-xs text-text-muted font-normal">/ {activeUsers} Active</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Online Count
          </p>
          <p className="text-lg font-extrabold text-text-primary">
            {onlineUsers} Active
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
            <Search className="h-3.5 w-3.5 text-primary" />
            Search Queries
          </p>
          <p className="text-lg font-extrabold text-text-primary">
            {totalSearches} <span className="text-xs text-text-muted font-normal">total logs</span>
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            Monthly Revenue
          </p>
          <p className="text-lg font-extrabold text-emerald-500">${calculatedMonthlyRevenue}/mo</p>
        </div>

        {/* Metric 5 */}
        <div className="bg-card border border-border p-4 rounded-xl space-y-1 col-span-2 lg:col-span-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Top Location Target</p>
          <p className="text-xs font-bold text-text-primary truncate mt-0.5">
            {mostSearchedCategory} ({mostSearchedCity})
          </p>
        </div>
      </div>

      {/* Main Admin Section */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Tab selection */}
        <div className="flex border-b border-border bg-card-hover/20 px-4">
          {[
            { id: "users", label: "Users Registry" },
            { id: "logs", label: "Search Logs & Leads details" },
            { id: "activities", label: "System Audits" },
            { id: "keys", label: "API Configuration Overrides" },
            { id: "notifications", label: "Forward Alerts" }
          ].map((tab) => (

            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="p-5">
          {/* USER MANAGEMENT TAB */}
          {activeSubTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-background text-text-muted font-semibold">
                    <th className="py-2.5 px-4">User Email / Account Name</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Subscription Plan</th>
                    <th className="py-2.5 px-4">Account Status</th>
                    <th className="py-2.5 px-4">Date Joined</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {metrics.users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-card-hover/20 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text-primary">{u.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-semibold text-text-primary">
                        {u.role}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.plan}
                          onChange={(e) => handleUpdatePlan(u.id, e.target.value)}
                          className="bg-background border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none cursor-pointer"
                        >
                          <option value="Free">Free</option>
                          <option value="Pro">Pro ($49)</option>
                          <option value="Enterprise">Enterprise ($249)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.isBanned 
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        }`}>
                          {u.isBanned ? "Suspended / Banned" : "Active"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted font-mono">{u.joinedAt}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleBan(u.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-background text-rose-500 hover:bg-rose-500/10 border border-border text-[10px] font-semibold transition cursor-pointer"
                          >
                            <Ban className="h-3 w-3" />
                            {u.isBanned ? "Lift Ban" : "Ban Account"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 text-text-dark hover:text-rose-500 transition cursor-pointer"
                            title="Delete User permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SEARCH HISTORY LOGS WITH DETAILS */}
          {activeSubTab === "logs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-text-muted border-b border-border/50 pb-2">
                <span>Detailed search queries run by users and matching leads found</span>
                <span className="font-mono">{metrics.searchLogs.length} logs</span>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {metrics.searchLogs.map((log: any) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <div key={log.id} className="bg-background border border-border rounded-lg overflow-hidden transition hover:border-border">
                      {/* Log Header Row */}
                      <div 
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-card-hover/25 transition select-none"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary">{log.userName}</span>
                            <span className="text-text-muted font-mono text-[10px]">({log.userId})</span>
                            <span className="text-text-muted">•</span>
                            <span className="font-mono text-text-muted text-[10px]">{log.timestamp.replace('T', ' ').split('.')[0]}</span>
                          </div>
                          <p className="text-text-primary">
                            Ran query: <strong className="text-primary">"{log.query}"</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-text-muted">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {log.city}
                          </span>
                          <span className="bg-border px-2 py-0.5 rounded font-mono font-bold text-text-primary">
                            {log.resultsCount} leads
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Log Leads Details Sub-Table */}
                      {isExpanded && (
                        <div className="border-t border-border bg-card/40 p-4 space-y-3 animate-fade-in">
                          <h4 className="text-[10px] uppercase font-bold text-primary tracking-wider">Leads Found in this Search:</h4>
                          {log.leads && log.leads.length > 0 ? (
                            <div className="overflow-x-auto rounded border border-border/60">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-background border-b border-border text-text-muted font-medium">
                                    <th className="py-2 px-3">Lead Business Name</th>
                                    <th className="py-2 px-3">Phone</th>
                                    <th className="py-2 px-3">Email Address</th>
                                    <th className="py-2 px-3">Website</th>
                                    <th className="py-2 px-3 text-center">Score</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 bg-card/20">
                                  {log.leads.map((l: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-card-hover/20">
                                      <td className="py-2 px-3 font-semibold text-text-primary">{l.businessName}</td>
                                      <td className="py-2 px-3 text-text-muted font-mono">{l.phoneNumber || "None"}</td>
                                      <td className="py-2 px-3 text-text-muted font-mono">{l.email || "None"}</td>
                                      <td className="py-2 px-3 text-primary">
                                        {l.website ? (
                                          <a href={l.website} target="_blank" rel="noreferrer" className="hover:underline">
                                            {l.website.replace("https://www.", "").replace("http://www.", "")}
                                          </a>
                                        ) : "None"}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                          {l.leadScore}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-[11px] text-text-muted italic">No leads stored in this search payload.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AUDIT TRAILS */}
          {activeSubTab === "activities" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-text-muted border-b border-border/50 pb-2">
                <span>Timeline of global actions, authentication details, and pipeline logs</span>
                <span className="font-mono">{metrics.activities.length} audit logs</span>
              </div>
              
              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                {metrics.activities.map((act: any) => (
                  <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_#38BDF8]"></div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">{act.leadName}</span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {act.timestamp.replace('T', ' ').split('.')[0]}
                        </span>
                      </div>
                      <p className="text-text-muted">{act.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC API CONFIGURATION CONFIGURATOR */}
          {activeSubTab === "keys" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Key className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Dynamic Integrations Configurator</h3>
              </div>

              {/* API Key Counter Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background border border-border p-4 rounded-xl space-y-1.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">OpenAI GPT-4o usage</p>
                  <p className="text-2xl font-extrabold text-text-primary flex items-baseline gap-1">
                    {metrics.apiKeyUsage?.["OpenAI GPT-4o"] || 0}
                    <span className="text-xs text-text-muted font-normal">requests</span>
                  </p>
                </div>

                <div className="bg-background border border-border p-4 rounded-xl space-y-1.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Tavily Live Search usage</p>
                  <p className="text-2xl font-extrabold text-text-primary flex items-baseline gap-1">
                    {metrics.apiKeyUsage?.["Tavily Search"] || 0}
                    <span className="text-xs text-text-muted font-normal">scrapes</span>
                  </p>
                </div>
              </div>

              {/* Update form */}
              <form onSubmit={handleSaveKeys} className="space-y-4 text-xs bg-background p-5 rounded-xl border border-border">
                <h4 className="font-semibold text-text-primary">Customize System-wide Active API Keys</h4>
                <p className="text-[11px] text-text-muted">Update keys dynamically to route searches through another key. Defaults to .env.local keys if empty.</p>
                
                {saveSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>API override configurations saved successfully! Future searches will use these keys immediately.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">OpenAI API Key Override</label>
                    <input
                      type="password"
                      value={openaiKeyInput}
                      onChange={(e) => setOpenaiKeyInput(e.target.value)}
                      placeholder="sk-proj-... (Leaves default if empty)"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Tavily API Key Override</label>
                    <input
                      type="password"
                      value={tavilyKeyInput}
                      onChange={(e) => setTavilyKeyInput(e.target.value)}
                      placeholder="tvly-... (Leaves default if empty)"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="btn-primary rounded-lg px-5 py-2.5 font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? "Saving Keys..." : "Apply API Keys Config"}
                </button>
              </form>
            </div>
          )}

          {/* FORWARD NOTIFICATIONS TAB */}
          {activeSubTab === "notifications" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-text-muted border-b border-border/50 pb-2">
                <span>Alerts for clients forwarded by local operators to shashank8808108802@gmail.com</span>
                <span className="font-mono">{(metrics.notifications || []).length} alerts</span>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {(!metrics.notifications || metrics.notifications.length === 0) ? (
                  <div className="text-center py-12 text-xs text-text-muted italic select-none">
                    No forwarded lead alerts received yet
                  </div>
                ) : (
                  metrics.notifications.map((notif: any) => (
                    <div 
                      key={notif.id} 
                      className="bg-background border border-border/80 rounded-xl p-4.5 space-y-3.5 hover:border-primary/45 transition-all duration-300 relative"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-violet-400 shrink-0" />
                          <h4 className="font-bold text-text-primary text-xs truncate">
                            {notif.businessName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-text-muted">{notif.timestamp.replace('T', ' ').split('.')[0]}</span>
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-bold border border-violet-500/20">
                            Client Acquired
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1 bg-card/40 p-2.5 rounded-lg border border-border/50">
                          <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">Lead Information</span>
                          <p className="text-text-primary"><strong className="text-text-muted">Category:</strong> {notif.category}</p>
                          <p className="text-text-primary"><strong className="text-text-muted">Lead ID:</strong> {notif.leadId}</p>
                        </div>
                        <div className="space-y-1 bg-card/40 p-2.5 rounded-lg border border-border/50">
                          <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">Forwarded By</span>
                          <p className="text-text-primary"><strong className="text-text-muted">Operator:</strong> {notif.userName}</p>
                          <p className="text-text-primary"><strong className="text-text-muted">Email:</strong> {notif.userEmail}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
