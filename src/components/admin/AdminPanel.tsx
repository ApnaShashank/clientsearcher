"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { 
  ShieldAlert, Users, Search, DollarSign, Ban, Trash2, 
  MapPin, Tag, RefreshCw, Key, ChevronDown, ChevronUp, Check, Play, Bell,
  UploadCloud, FileText, ClipboardList, UserCheck, Lock, ExternalLink, X
} from "lucide-react";

export default function AdminPanel() {
  const mounted = useMounted();
  const { 
    currentUser, adminTasks, createTask, fetchTasks, 
    sendSystemNotification, systemNotifications, fetchNotifications,
    portfolioWebsites, addPortfolioWebsite, deletePortfolioWebsite
  } = useAppStore();
  const [metrics, setMetrics] = useState<any>(null);
  
  // Custom API key inputs
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [tavilyKeyInput, setTavilyKeyInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Notification Broadcast states
  const [notifRecipient, setNotifRecipient] = useState("all");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifSendSuccess, setNotifSendSuccess] = useState(false);

  // Portfolio States
  const [portName, setPortName] = useState("");
  const [portUrl, setPortUrl] = useState("");
  const [portBusinessType, setPortBusinessType] = useState("");
  const [portAddress, setPortAddress] = useState("");
  const [portType, setPortType] = useState<"demo" | "client">("demo");
  const [portLoading, setPortLoading] = useState(false);
  const [portSuccess, setPortSuccess] = useState(false);

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portName || !portUrl || !portBusinessType || !portAddress) {
      alert("All fields are required!");
      return;
    }
    setPortLoading(true);
    setPortSuccess(false);
    try {
      await addPortfolioWebsite(portName, portUrl, portBusinessType, portAddress, portType);
      setPortSuccess(true);
      setPortName("");
      setPortUrl("");
      setPortBusinessType("");
      setPortAddress("");
      setPortType("demo");
      setTimeout(() => setPortSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to add website:", err);
    } finally {
      setPortLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) {
      alert("Title and Message are required!");
      return;
    }
    try {
      await sendSystemNotification(notifRecipient, notifTitle, notifMessage);
      setNotifSendSuccess(true);
      setNotifTitle("");
      setNotifMessage("");
      setTimeout(() => setNotifSendSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  };

  // Task Dispatcher states
  const [taskName, setTaskName] = useState("");
  const [taskPhone, setTaskPhone] = useState("");
  const [taskMapsUrl, setTaskMapsUrl] = useState("");
  const [taskAddress, setTaskAddress] = useState("");
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Forwarded leads & payouts states
  const [fwdNotes, setFwdNotes] = useState<Record<string, string>>({});
  const [receiptScreenshots, setReceiptScreenshots] = useState<Record<string, string>>({});
  const [notifSubTab, setNotifSubTab] = useState<"broadcast" | "logs" | "audits">("broadcast");
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<any>(null);

  const handleUpdateForwardedStatus = async (leadId: string, status: string, notesText?: string) => {
    try {
      const res = await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateForwardedLeadStatus",
          payload: { leadId, status, notes: notesText }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics((prev: any) => ({ ...prev, forwardedLeads: data.forwardedLeads || [] }));
        alert(`Lead status updated to ${status} successfully!`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update forwarded lead status");
    }
  };

  const handleApproveWithdrawal = async (userId: string) => {
    const receiptUrl = receiptScreenshots[userId];
    if (!receiptUrl) {
      alert("Please upload/mock a payment receipt screenshot first!");
      return;
    }
    try {
      const res = await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approveWithdrawal",
          payload: { userId, paymentReceiptUrl: receiptUrl }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics((prev: any) => ({ ...prev, users: data.users || [] }));
        setReceiptScreenshots(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        alert("Withdrawal payout approved successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to approve payout");
    }
  };

  const handleReceiptUpload = (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptScreenshots(prev => ({ ...prev, [userId]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Batch parsed leads preview state
  const [parsedLeadsPreview, setParsedLeadsPreview] = useState<Array<{
    businessName: string;
    phoneNumber: string;
    googleMapsUrl: string;
    address: string;
  }>>([]);

  const mockPdfTemplates = [
    {
      businessName: "Tata Coffee Grand",
      phoneNumber: "+91 80 2356 7890",
      googleMapsUrl: "https://maps.google.com/?cid=12345678901234567",
      address: "Tata Coffee Corporate Office, No. 57, Railway Parallel Road, Kumara Park West, Bengaluru, Karnataka 560020"
    },
    {
      businessName: "Apollo Pharmacy Delhi",
      phoneNumber: "+91 11 4156 7800",
      googleMapsUrl: "https://maps.google.com/?cid=98765432109876543",
      address: "Shop No. 12, Ground Floor, Connaught Circus, Block G, Connaught Place, New Delhi, Delhi 110001"
    },
    {
      businessName: "Geetanjali Salon Mumbai",
      phoneNumber: "+91 22 2640 0500",
      googleMapsUrl: "https://maps.google.com/?cid=11223344556677889",
      address: "Waterfield Road, Bandra West, Mumbai, Maharashtra 400050"
    },
    {
      businessName: "Clove Dental Clinic Noida",
      phoneNumber: "+91 120 422 3344",
      googleMapsUrl: "https://maps.google.com/?cid=99887766554433221",
      address: "Sector 18, Block K, Noida, Uttar Pradesh 201301"
    }
  ];

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfName(file.name);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/parse-pdf", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse PDF");
      }

      const data = await res.json();
      setParsedLeadsPreview(data.leads || []);
    } catch (err: any) {
      console.error("PDF upload failed:", err);
      alert(err.message || "Failed to parse PDF. Please try again or use manual input.");
      setPdfName("");
      setParsedLeadsPreview([]);
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleDispatchTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !taskAddress) {
      alert("Business Name and Address are required!");
      return;
    }

    try {
      await createTask(taskName, taskPhone, taskMapsUrl, taskAddress, pdfName ? `uploaded_${pdfName}` : undefined);
      setDispatchSuccess(true);
      setTaskName("");
      setTaskPhone("");
      setTaskMapsUrl("");
      setTaskAddress("");
      setPdfName("");
      setTimeout(() => setDispatchSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to dispatch task:", err);
    }
  };

  const handleDispatchBatch = async () => {
    if (parsedLeadsPreview.length === 0) return;
    
    try {
      for (const lead of parsedLeadsPreview) {
        await createTask(
          lead.businessName,
          lead.phoneNumber,
          lead.googleMapsUrl,
          lead.address,
          `uploaded_${pdfName}`
        );
      }
      setDispatchSuccess(true);
      setParsedLeadsPreview([]);
      setPdfName("");
      setTimeout(() => setDispatchSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to dispatch batch:", err);
    }
  };

  const handleRemovePreviewLead = (index: number) => {
    setParsedLeadsPreview(prev => prev.filter((_, i) => i !== index));
  };

  const exportLogsToCSV = () => {
    if (!metrics || !metrics.searchLogs || metrics.searchLogs.length === 0) {
      alert("No search logs available to export.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Log ID,User Name,User ID,Query,City,Category,Timestamp,Results Count,Lead Business Name,Lead Phone,Lead Email,Lead Website,Lead Score\n";

    metrics.searchLogs.forEach((log: any) => {
      const escapedUserName = `"${log.userName.replace(/"/g, '""')}"`;
      const escapedQuery = `"${log.query.replace(/"/g, '""')}"`;
      const escapedCity = `"${log.city.replace(/"/g, '""')}"`;
      const escapedCategory = `"${log.category.replace(/"/g, '""')}"`;

      if (log.leads && log.leads.length > 0) {
        log.leads.forEach((lead: any) => {
          const escapedLeadName = `"${lead.businessName.replace(/"/g, '""')}"`;
          const escapedLeadPhone = `"${(lead.phoneNumber || "").replace(/"/g, '""')}"`;
          const escapedLeadEmail = `"${(lead.email || "").replace(/"/g, '""')}"`;
          const escapedLeadWebsite = `"${(lead.website || "").replace(/"/g, '""')}"`;
          
          csvContent += `${log.id},${escapedUserName},${log.userId},${escapedQuery},${escapedCity},${escapedCategory},${log.timestamp},${log.resultsCount},${escapedLeadName},${escapedLeadPhone},${escapedLeadEmail},${escapedLeadWebsite},${lead.leadScore}\n`;
        });
      } else {
        csvContent += `${log.id},${escapedUserName},${log.userId},${escapedQuery},${escapedCity},${escapedCategory},${log.timestamp},${log.resultsCount},,,,,,\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `search_logs_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "Contacted": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Interested": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Not Interested": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "Won": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Lost": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<"users" | "logs" | "activities" | "keys" | "notifications" | "tasks" | "rewards" | "portfolio">("users");


  
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
    fetchNotifications();
    const interval = setInterval(() => {
      fetchMetrics();
      fetchNotifications();
    }, 3000);
    return () => clearInterval(interval);
  }, [mounted, fetchNotifications]);

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
          <p className="text-sm font-extrabold text-primary truncate mt-0.5">
            India
          </p>
        </div>
      </div>

      {/* Main Admin Section */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Tab selection */}
        <div className="grid grid-cols-2 gap-1 p-2 md:flex md:gap-0 md:p-0 md:px-4 border-b border-border bg-card-hover/20 select-none overflow-x-auto md:overflow-visible scrollbar-none">
          {[
            { id: "users", label: "Users Registry" },
            { id: "keys", label: "API Configuration Overrides" },
            { id: "notifications", label: "Notifications & Audits Center" },
            { id: "tasks", label: "Task Dispatcher" },
            { id: "rewards", label: "Commissions & Payouts" },
            { id: "portfolio", label: "Portfolio Manager" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-2 px-3 md:py-3 md:px-4 text-[10px] md:text-xs font-semibold text-center rounded-lg md:rounded-none md:border-b-2 transition cursor-pointer md:whitespace-nowrap ${
                activeSubTab === tab.id
                  ? "bg-primary/10 text-primary md:bg-transparent md:border-primary"
                  : "bg-transparent text-text-muted hover:text-text-primary md:border-transparent"
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
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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

              {/* Mobile Card-Based Grid View */}
              <div className="block md:hidden space-y-4">
                {metrics.users.map((u: any) => (
                  <div key={u.id} className="bg-background border border-border rounded-xl p-4.5 space-y-3.5 shadow-sm">
                    {/* User profile & email */}
                    <div className="flex justify-between items-start gap-2 border-b border-border/40 pb-2.5">
                      <div>
                        <div className="font-extrabold text-text-primary text-sm leading-snug">{u.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5 font-mono">{u.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        u.isBanned 
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      }`}>
                        {u.isBanned ? "Banned" : "Active"}
                      </span>
                    </div>

                    {/* Meta info grid */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] text-text-muted">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-text-dark/80">Role</span>
                        <span className="font-semibold text-text-primary capitalize mt-0.5 block">{u.role}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-text-dark/80">Joined Date</span>
                        <span className="font-mono mt-0.5 block text-text-primary">{u.joinedAt}</span>
                      </div>
                      
                      <div className="col-span-2 space-y-1">
                        <label className="block text-[9px] uppercase tracking-wider font-bold text-text-dark/80">Change Subscription Plan</label>
                        <select
                          value={u.plan}
                          onChange={(e) => handleUpdatePlan(u.id, e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none cursor-pointer"
                        >
                          <option value="Free">Free Plan</option>
                          <option value="Pro">Pro Plan ($49)</option>
                          <option value="Enterprise">Enterprise Plan ($249)</option>
                        </select>
                      </div>
                    </div>

                    {/* Actions button bar */}
                    <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-border/30">
                      <button
                        onClick={() => handleToggleBan(u.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          u.isBanned 
                            ? "bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>{u.isBanned ? "Lift Ban" : "Ban Account"}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background hover:bg-rose-500/10 text-rose-500 border border-border text-[10px] font-bold transition cursor-pointer"
                        title="Delete User permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SEARCH LOGS AND AUDITS ARE CONSOLIDATED INSIDE THE NOTIFICATIONS TAB */}

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

          {/* SYSTEM BROADCASTS & ALERTS TAB */}
          {activeSubTab === "notifications" && (
            <div className="space-y-5 animate-fade-in font-sans">
              
              {/* Sub-tab selection menu */}
              <div className="flex flex-wrap border border-border bg-card/60 p-1 rounded-xl w-full sm:w-fit gap-1 shadow-sm">
                {[
                  { id: "broadcast", label: "Broadcast Alerts & Emails" },
                  { id: "logs", label: "Search Logs Monitor" },
                  { id: "audits", label: "System Audits Logs" }
                ].map((sTab) => (
                  <button
                    key={sTab.id}
                    onClick={() => setNotifSubTab(sTab.id as any)}
                    className={`py-1.5 px-3 flex-1 sm:flex-none text-[9px] sm:text-[10px] uppercase font-bold rounded-lg transition cursor-pointer text-center whitespace-nowrap ${
                      notifSubTab === sTab.id
                        ? "bg-primary text-[#0B0B0C] shadow-md"
                        : "text-text-muted hover:text-text-primary hover:bg-card-hover/20"
                    }`}
                  >
                    {sTab.label}
                  </button>
                ))}
              </div>

              {/* SECTION 1: BROADCAST ALERTS */}
              {notifSubTab === "broadcast" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form to Compose Alerts */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-background border border-border rounded-xl p-4.5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                        <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">Send System Announcement</h3>
                        <span className="text-[10px] text-text-muted font-mono">Real-time Push</span>
                      </div>

                      {notifSendSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-2">
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Alert broadcasted successfully!</span>
                        </div>
                      )}

                      <form onSubmit={handleSendNotification} className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Target Recipient</label>
                          <select
                            value={notifRecipient}
                            onChange={(e) => setNotifRecipient(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition cursor-pointer"
                          >
                            <option value="all">Broadcast to All Operators (Public)</option>
                            {metrics.users.filter((u: any) => u.role !== "admin").map((u: any) => (
                              <option key={u.id} value={u.id}>Direct Message: {u.name} ({u.email})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Alert Title</label>
                          <input
                            type="text"
                            required
                            value={notifTitle}
                            onChange={(e) => setNotifTitle(e.target.value)}
                            placeholder="e.g. Server Maintenance Notice"
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Message Alert</label>
                          <textarea
                            required
                            rows={4}
                            value={notifMessage}
                            onChange={(e) => setNotifMessage(e.target.value)}
                            placeholder="Type the message description to push..."
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition resize-none leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full btn-primary py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_4px_12px_rgba(56,189,248,0.1)]"
                        >
                          <Bell className="h-3.5 w-3.5 text-[#0c0c0d]" />
                          <span>Transmit Notification Alert</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Alerts Monitor logs */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Panel 1: Sent System Alerts */}
                    <div className="bg-background border border-border rounded-xl p-4.5 space-y-3.5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                        <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">Broadcast History Logs</h3>
                        <span className="text-[10px] bg-border px-2 py-0.5 rounded text-text-primary font-bold font-mono">
                          {systemNotifications.length} logs
                        </span>
                      </div>

                      {systemNotifications.length === 0 ? (
                        <div className="text-center py-10 text-xs text-text-muted italic select-none">
                          No system alerts recorded yet.
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                          {systemNotifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => setSelectedNotifDetail(notif)}
                              className="bg-card border border-border/85 hover:border-primary/50 transition-all rounded-xl p-3.5 space-y-1.5 text-xs cursor-pointer"
                              title="Click to view details in large window"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-text-primary text-[11px] truncate">{notif.title}</span>
                                <span className="text-[9px] text-text-muted font-mono">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-text-muted leading-relaxed text-[10px] line-clamp-1">{notif.message}</p>
                              <div className="flex justify-between items-center text-[9px] text-text-muted font-mono pt-1">
                                <span>Recipient: {notif.recipientId === "all" ? "All" : notif.recipientId === "admin" ? "Admin" : notif.recipientId}</span>
                                <span className="text-primary hover:underline">Click to view details</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Panel 2: Forwarded Leads alerts log */}
                    <div className="bg-background border border-border rounded-xl p-4.5 space-y-3.5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                        <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">Forwarded Leads (shashank8808108802@gmail.com)</h3>
                        <span className="text-[10px] bg-border px-2 py-0.5 rounded text-text-primary font-bold font-mono">
                          {(metrics.notifications || []).length} alerts
                        </span>
                      </div>

                      {(!metrics.notifications || metrics.notifications.length === 0) ? (
                        <div className="text-center py-10 text-xs text-text-muted italic select-none">
                          No forwarded lead alerts received yet.
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                          {metrics.notifications.map((notif: any) => (
                            <div 
                              key={notif.id} 
                              onClick={() => setSelectedNotifDetail({
                                ...notif,
                                title: `Lead Forwarded: ${notif.businessName}`,
                                message: `Employee "${notif.userName}" has forwarded lead "${notif.businessName}" under the category "${notif.category}" for review.`
                              })}
                              className="bg-card border border-border/85 hover:border-primary/50 transition-all rounded-xl p-3.5 space-y-2 cursor-pointer"
                              title="Click to view details in large window"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-text-primary text-[11px] truncate">{notif.businessName}</span>
                                <span className="text-[9px] text-text-muted font-mono">
                                  {notif.timestamp.replace('T', ' ').split('.')[0]}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted">
                                <div><strong className="text-text-primary">Operator:</strong> {notif.userName}</div>
                                <div><strong className="text-text-primary">Category:</strong> {notif.category}</div>
                              </div>
                              <div className="text-right text-[9px] text-primary hover:underline mt-1">
                                Click to view details
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: SEARCH LOGS MONITOR */}
              {notifSubTab === "logs" && (
                <div className="space-y-4 font-sans animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs text-text-muted border-b border-border/50 pb-2">
                    <span>Detailed search queries run by users and matching leads found</span>
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={exportLogsToCSV}
                        className="flex items-center gap-1.5 px-3 py-1 bg-primary text-black font-bold rounded hover:bg-sky-400 transition cursor-pointer text-[10px]"
                      >
                        Export Logs to CSV
                      </button>
                      <span className="font-mono">{metrics.searchLogs.length} logs</span>
                    </div>
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
                                <>
                                  {/* Desktop view */}
                                  <div className="hidden md:block overflow-x-auto rounded border border-border/60">
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

                                  {/* Mobile View */}
                                  <div className="block md:hidden space-y-2.5">
                                    {log.leads.map((l: any, idx: number) => (
                                      <div key={idx} className="bg-background border border-border/50 rounded-lg p-3 space-y-2 text-[11px]">
                                        <div className="flex justify-between items-start gap-2 border-b border-border/30 pb-1.5">
                                          <span className="font-extrabold text-text-primary">{l.businessName}</span>
                                          <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] shrink-0">
                                            Score: {l.leadScore}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5 text-text-muted">
                                          <div>
                                            <span className="text-[9px] uppercase text-text-dark font-bold block">Phone</span>
                                            <span className="font-mono text-text-primary">{l.phoneNumber || "None"}</span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] uppercase text-text-dark font-bold block">Email</span>
                                            <span className="font-mono text-text-primary truncate max-w-[120px] block" title={l.email}>{l.email || "None"}</span>
                                          </div>
                                          <div className="col-span-2">
                                            <span className="text-[9px] uppercase text-text-dark font-bold block">Website</span>
                                            {l.website ? (
                                              <a href={l.website} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono truncate block max-w-[260px]">
                                                {l.website}
                                              </a>
                                            ) : <span className="text-text-primary">None</span>}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
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

              {/* SECTION 3: SYSTEM AUDITS LOGS */}
              {notifSubTab === "audits" && (
                <div className="space-y-4 animate-fade-in">
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

            </div>
          )}

          {/* TASK DISPATCHER TAB */}
          {activeSubTab === "tasks" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
              {/* Left Column: Form */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-background border border-border rounded-xl p-4.5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">Dispatch New Lead Task</h3>
                    <span className="text-[10px] text-text-muted font-mono">Operator Broadcast</span>
                  </div>

                  {dispatchSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-2">
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Task forwarded to all operators successfully!</span>
                    </div>
                  )}

                  {/* PDF Upload Area */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Extract Info from PDF (Optional)</label>
                    <div className="border border-dashed border-border/80 hover:border-primary/50 transition-all rounded-lg p-4 text-center relative cursor-pointer bg-card/25 group">
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={handlePdfUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={isParsingPdf}
                      />
                      {isParsingPdf ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                          <span className="text-[11px] text-text-muted animate-pulse font-semibold">Scanning PDF document...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <UploadCloud className="h-6 w-6 text-text-muted group-hover:text-primary transition" />
                          <span className="text-xs font-semibold text-text-primary">Click to upload lead PDF</span>
                          <span className="text-[10px] text-text-muted font-mono">Extract multiple leads from document</span>
                        </div>
                      )}
                    </div>
                    {pdfName && !isParsingPdf && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded w-fit">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{pdfName} parsed</span>
                      </div>
                    )}
                  </div>

                  {parsedLeadsPreview.length > 0 ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wide">
                          <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>Extracted Leads ({parsedLeadsPreview.length})</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setParsedLeadsPreview([]);
                            setPdfName("");
                          }}
                          className="text-[10px] text-rose-400 hover:underline cursor-pointer font-bold"
                        >
                          Cancel & Manual Input
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                        {parsedLeadsPreview.map((lead, idx) => (
                          <div 
                            key={idx}
                            className="bg-card p-3 rounded-lg border border-border flex items-start justify-between gap-3 text-xs relative"
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-text-primary text-[11px] leading-tight">
                                {lead.businessName}
                              </h4>
                              {lead.phoneNumber && <p className="text-[10px] text-text-muted font-mono">{lead.phoneNumber}</p>}
                              <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">{lead.address}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemovePreviewLead(idx)}
                              className="text-text-dark hover:text-rose-500 p-1.5 rounded transition cursor-pointer shrink-0"
                              title="Remove lead"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleDispatchBatch}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0c0c0d] py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Forward All {parsedLeadsPreview.length} Leads to Operators</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleDispatchTask} className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Business Name *</label>
                        <input
                          type="text"
                          required
                          value={taskName}
                          onChange={(e) => setTaskName(e.target.value)}
                          placeholder="e.g. Apollo Pharmacy Delhi"
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Contact Number</label>
                        <input
                          type="text"
                          value={taskPhone}
                          onChange={(e) => setTaskPhone(e.target.value)}
                          placeholder="e.g. +91 11 4156 7800"
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Google Maps Link</label>
                        <input
                          type="url"
                          value={taskMapsUrl}
                          onChange={(e) => setTaskMapsUrl(e.target.value)}
                          placeholder="e.g. https://maps.google.com/..."
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Physical Address *</label>
                        <textarea
                          required
                          rows={3}
                          value={taskAddress}
                          onChange={(e) => setTaskAddress(e.target.value)}
                          placeholder="e.g. Block G, Connaught Place, New Delhi..."
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full btn-primary py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_4px_12px_rgba(56,189,248,0.1)]"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Forward to Operators</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Column: Tracking Board Monitor */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-background border border-border rounded-xl p-4.5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Active Assignments Monitor
                    </h3>
                    <span className="text-[10px] bg-border px-2.5 py-1 rounded-full text-text-primary font-bold font-mono">
                      {adminTasks.length} Dispatched
                    </span>
                  </div>

                  {adminTasks.length === 0 ? (
                    <div className="text-center py-16 text-xs text-text-muted italic select-none">
                      No tasks dispatched yet. Fill out the form or scan a PDF to broadcast tasks to operators.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {adminTasks.map((task) => {
                        const isAssigned = task.acceptedBy !== null;
                        return (
                          <div 
                            key={task.id} 
                            className="bg-card border border-border hover:border-border/80 transition rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1.5 max-w-[70%]">
                              <h4 className="font-bold text-text-primary text-xs leading-snug truncate">
                                {task.businessName}
                              </h4>
                              <p className="text-[10px] text-text-muted line-clamp-1">{task.address}</p>
                              
                              <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono">
                                <span className="text-text-muted">
                                  Dispatched {new Date(task.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {task.pdfUrl && (
                                  <span className="text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 text-[9px] uppercase font-bold tracking-wider">
                                    PDF Resource
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                              {isAssigned ? (
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-text-primary bg-background px-2 py-1 rounded border border-border">
                                  <UserCheck className="h-3 w-3 text-primary" />
                                  <span>{task.acceptedByName}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                                  <Lock className="h-3 w-3" />
                                  <span>Unassigned</span>
                                </div>
                              )}

                              <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PORTFOLIO MANAGER TAB */}
          {activeSubTab === "portfolio" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in font-sans">
              {/* Left Column: Form to Add Portfolio */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-background border border-border rounded-xl p-4.5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">Add Demo & Client Websites</h3>
                    <span className="text-[10px] text-text-muted font-mono">Portfolio Manager</span>
                  </div>

                  {portSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-2">
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Website successfully added to catalog!</span>
                    </div>
                  )}

                  <form onSubmit={handleCreatePortfolio} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Website Name *</label>
                      <input
                        type="text"
                        required
                        value={portName}
                        onChange={(e) => setPortName(e.target.value)}
                        placeholder="e.g. Delhi Dental Clinic Hub"
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Website URL Link *</label>
                      <input
                        type="url"
                        required
                        value={portUrl}
                        onChange={(e) => setPortUrl(e.target.value)}
                        placeholder="e.g. https://delhidentalclinic.com"
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Business / Category Type *</label>
                      <input
                        type="text"
                        required
                        value={portBusinessType}
                        onChange={(e) => setPortBusinessType(e.target.value)}
                        placeholder="e.g. Dental Clinic, Hotel, Bakery"
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Business Address *</label>
                      <input
                        type="text"
                        required
                        value={portAddress}
                        onChange={(e) => setPortAddress(e.target.value)}
                        placeholder="e.g. Connaught Place, New Delhi"
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Website Type *</label>
                      <select
                        value={portType}
                        onChange={(e) => setPortType(e.target.value as "demo" | "client")}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition cursor-pointer"
                      >
                        <option value="demo">Demo Template Website (Built for display)</option>
                        <option value="client">Client Website (Clients who bought from us)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={portLoading}
                      className="w-full btn-primary py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Add Website to Portfolio</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Tracking Board Monitor */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-background border border-border rounded-xl p-4.5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      Active Catalog
                    </h3>
                    <span className="text-[10px] bg-border px-2.5 py-1 rounded-full text-text-primary font-bold font-mono">
                      {portfolioWebsites ? portfolioWebsites.length : 0} items
                    </span>
                  </div>

                  {!portfolioWebsites || portfolioWebsites.length === 0 ? (
                    <div className="text-center py-16 text-xs text-text-muted italic select-none">
                      No websites registered in the portfolio catalog. Add one using the form.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {portfolioWebsites.map((site) => (
                        <div 
                          key={site.id} 
                          className="bg-card border border-border hover:border-border/80 transition rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1.5 max-w-[80%]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-text-primary text-xs leading-snug">
                                {site.name}
                              </h4>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold uppercase tracking-wider ${
                                site.type === "demo" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}>
                                {site.type === "demo" ? "Demo Site" : "Built Client"}
                              </span>
                            </div>
                            <a 
                              href={site.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline font-mono inline-flex items-center gap-1.5"
                            >
                              <span>{site.url}</span>
                            </a>
                            <p className="text-[10px] text-text-muted">
                              Category: <strong className="text-text-primary">{site.businessType}</strong> | Address: <strong className="text-text-primary">{site.address}</strong>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => deletePortfolioWebsite(site.id)}
                            className="p-2 text-text-dark hover:text-rose-500 border border-border/40 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Delete Website"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* COMMISSIONS & PAYOUTS TAB */}
          {activeSubTab === "rewards" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in font-sans text-xs">
              {/* Left Column: Forwarded Leads review */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-background border border-border rounded-xl p-4.5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">
                      Employee Forwarded Leads (रिव्यू और स्टेटस बदलें)
                    </h3>
                    <span className="text-[10px] bg-border px-2.5 py-1 rounded-full text-text-primary font-bold font-mono">
                      {metrics.forwardedLeads ? metrics.forwardedLeads.length : 0} Leads
                    </span>
                  </div>

                  {!metrics.forwardedLeads || metrics.forwardedLeads.length === 0 ? (
                    <div className="text-center py-16 text-xs text-text-muted italic select-none">
                      No forwarded leads found.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {metrics.forwardedLeads.map((lead: any) => {
                        const isPendingReview = lead.status === "Under Review" || lead.status === "In Talk with Client";
                        return (
                          <div 
                            key={lead.id}
                            className={`border rounded-xl p-4 space-y-3 transition-all ${
                              isPendingReview 
                                ? "border-amber-500/40 bg-amber-500/[0.02] shadow-[0_0_15px_rgba(245,158,11,0.03)]" 
                                : "border-border bg-card"
                            }`}
                          >
                            {/* Header */}
                            <div className="flex justify-between items-start gap-2 border-b border-border/40 pb-2">
                              <div>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/15">
                                  {lead.category}
                                </span>
                                <h4 className="font-bold text-text-primary text-xs leading-snug mt-1.5">{lead.businessName}</h4>
                                <p className="text-[10px] text-text-muted mt-0.5">
                                  Forwarded by: <span className="text-text-primary font-semibold">{lead.forwardedByName}</span>
                                </p>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  lead.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                  lead.status === "Rejected" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                  "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {lead.status}
                                </span>
                                <span className="text-[9px] font-mono text-text-muted">
                                  {new Date(lead.forwardedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-muted">
                              <div><strong>Address:</strong> {lead.address}</div>
                              <div><strong>Phone:</strong> {lead.phoneNumber || "N/A"}</div>
                              {lead.website && (
                                <div className="sm:col-span-2">
                                  <strong>Website:</strong>{" "}
                                  <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">
                                    {lead.website}
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Actions and Notes Input */}
                            <div className="bg-background/40 border border-border/50 p-3 rounded-lg space-y-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold tracking-wider text-text-muted">Admin Notes / Feedback to Operator</label>
                                <textarea
                                  value={fwdNotes[lead.id] !== undefined ? fwdNotes[lead.id] : (lead.notes || "")}
                                  onChange={(e) => setFwdNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                  placeholder="Enter feedback or status notes..."
                                  rows={2}
                                  className="w-full bg-card border border-border rounded-lg p-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition resize-none"
                                />
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateForwardedStatus(lead.id, "Under Review", fwdNotes[lead.id] !== undefined ? fwdNotes[lead.id] : lead.notes)}
                                  className="px-3 py-1.5 rounded bg-background hover:bg-card-hover border border-border font-semibold text-[10px] text-text-primary cursor-pointer transition"
                                >
                                  Mark Under Review
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateForwardedStatus(lead.id, "In Talk with Client", fwdNotes[lead.id] !== undefined ? fwdNotes[lead.id] : lead.notes)}
                                  className="px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 font-semibold text-[10px] text-blue-400 cursor-pointer transition"
                                >
                                  Client Talk in Progress
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateForwardedStatus(lead.id, "Approved", fwdNotes[lead.id] !== undefined ? fwdNotes[lead.id] : lead.notes)}
                                  className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 font-bold text-[10px] text-[#0B0B0C] cursor-pointer transition"
                                >
                                  Approve Client (₹500 Reward)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateForwardedStatus(lead.id, "Rejected", fwdNotes[lead.id] !== undefined ? fwdNotes[lead.id] : lead.notes)}
                                  className="px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 font-semibold text-[10px] text-rose-400 cursor-pointer transition"
                                >
                                  Reject Lead
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Withdrawal & Payouts registry */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-background border border-border rounded-xl p-4.5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">
                      UPI Withdrawal Requests (पैसे ट्रांसफर करें)
                    </h3>
                  </div>

                  {metrics.users.filter((u: any) => u.withdrawalStatus === "Pending" || u.withdrawalStatus === "Paid").length === 0 ? (
                    <div className="text-center py-16 text-xs text-text-muted italic select-none">
                      No active withdrawal requests from operators.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {metrics.users
                        .filter((u: any) => u.withdrawalStatus === "Pending" || u.withdrawalStatus === "Paid")
                        .map((u: any) => {
                          const isPending = u.withdrawalStatus === "Pending";
                          return (
                            <div key={u.id} className="border border-border bg-card rounded-xl p-4 space-y-3.5">
                              {/* Header info */}
                              <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-2">
                                <div>
                                  <h4 className="font-bold text-text-primary text-xs">{u.name}</h4>
                                  <p className="text-[10px] text-text-muted mt-0.5">{u.email}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  isPending ? "bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                }`}>
                                  {isPending ? "Pending ₹" : "Paid ✓"}
                                </span>
                              </div>

                              {/* QR Code display */}
                              {isPending && u.qrCodeUrl && (
                                <div className="space-y-1.5">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">UPI QR Code:</span>
                                  <div className="border border-border/60 rounded-lg p-2 bg-background flex flex-col items-center">
                                    <img src={u.qrCodeUrl} alt="Operator QR Code" className="max-h-48 object-contain rounded-md" />
                                    <span className="text-[9px] text-text-muted font-mono mt-1">Scan to make manual payment</span>
                                  </div>
                                </div>
                              )}

                              {/* Manual Payout Screenshot receipt uploader */}
                              {isPending ? (
                                <div className="space-y-3 pt-2 border-t border-border/30">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">Upload Payment Screenshot *</label>
                                    <div className="border border-dashed border-border/80 hover:border-primary/50 transition-all rounded-lg p-3 text-center relative bg-background/50 cursor-pointer group">
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleReceiptUpload(u.id, e)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                      />
                                      {receiptScreenshots[u.id] ? (
                                        <div className="text-emerald-400 font-bold text-[10px] truncate max-w-[200px] mx-auto">
                                          Screenshot Attached! Click to change
                                        </div>
                                      ) : (
                                        <div className="text-text-muted group-hover:text-primary transition text-[10px]">
                                          Click to attach payment receipt image
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {receiptScreenshots[u.id] && (
                                    <div className="border border-border/60 rounded-lg p-2 bg-background flex flex-col items-center">
                                      <img src={receiptScreenshots[u.id]} alt="Receipt Preview" className="max-h-36 object-contain rounded-md" />
                                    </div>
                                  )}

                                  <button
                                    onClick={() => handleApproveWithdrawal(u.id)}
                                    disabled={!receiptScreenshots[u.id]}
                                    className="w-full btn-primary py-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    Confirm Manual Payout & Approve
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-1.5 pt-2 border-t border-border/30">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">Uploaded Payment Receipt:</span>
                                  {u.paymentReceiptUrl && (
                                    <div className="border border-border/60 rounded-lg p-2 bg-background/50 flex flex-col items-center">
                                      <img src={u.paymentReceiptUrl} alt="Payment Receipt" className="max-h-36 object-contain rounded-md" />
                                    </div>
                                  )}
                                  <p className="text-[10px] text-text-muted italic select-none">
                                    Payout completed manually. Receipt is visible on operator's panel.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Expanded Notification Details Modal (बड़ा नोटिफिकेशन विंडो) */}
      {selectedNotifDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-primary" />
                <span>Notification Audit Details</span>
              </h3>
              <button 
                onClick={() => setSelectedNotifDetail(null)}
                className="text-text-muted hover:text-text-primary cursor-pointer p-1.5 rounded-lg border border-border"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="bg-background/60 p-4.5 rounded-xl border border-border/80 space-y-3.5">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <span className="font-extrabold text-text-primary text-sm tracking-tight">
                    {selectedNotifDetail.title || selectedNotifDetail.businessName || "Notification Logs"}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono font-bold bg-border/60 px-2 py-0.5 rounded">
                    {selectedNotifDetail.timestamp ? new Date(selectedNotifDetail.timestamp).toLocaleString() : "Time N/A"}
                  </span>
                </div>

                <div className="border-t border-border/40 pt-3 text-text-muted font-medium text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedNotifDetail.message || `Lead notification acquired:
• Business: ${selectedNotifDetail.businessName}
• Category: ${selectedNotifDetail.category}
• Forwarded by: ${selectedNotifDetail.userName} (${selectedNotifDetail.userEmail})`}
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-text-muted font-mono bg-card-hover/20 px-3 py-2 rounded-lg border border-border/30">
                <span>Sender: <strong className="text-text-primary">{selectedNotifDetail.senderName || selectedNotifDetail.userName || "System"}</strong></span>
                {selectedNotifDetail.recipientId && (
                  <span>Recipient: <strong className="text-text-primary">{selectedNotifDetail.recipientId}</strong></span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedNotifDetail(null)}
                className="btn-primary px-5 py-2.5 rounded-lg font-bold text-xs cursor-pointer"
              >
                Close details / ठीक है
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
