"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Users,
  Inbox,
  Send,
  PhoneCall,
  Sparkles,
  CalendarClock,
  Trophy,
  ArrowUpRight,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface MetricsResponse {
  kpis: {
    totalLeads: number;
    unassigned: number;
    assignedToday: number;
    callsToday: number;
    interestedToday: number;
    followUpsDueToday: number;
    wonThisMonth: number;
  };
  chart14Days: {
    date: string;
    label: string;
    calls: number;
    interested: number;
  }[];
  callerToday: {
    id: string;
    name: string;
    username: string;
    homeCity: string;
    isActive: boolean;
    assigned: number;
    called: number;
    remaining: number;
    interested: number;
  }[];
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<MetricsResponse>({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed to load metrics");
      return res.json();
    },
    staleTime: 30_000,
  });

  const kpis = data?.kpis;

  const cards = [
    {
      label: "Total Leads",
      value: kpis?.totalLeads ?? 0,
      icon: Users,
      accent: false,
      href: "/admin/leads",
    },
    {
      label: "Unassigned",
      value: kpis?.unassigned ?? 0,
      icon: Inbox,
      accent: false,
      href: "/admin/batches",
    },
    {
      label: "Assigned Today",
      value: kpis?.assignedToday ?? 0,
      icon: Send,
      accent: false,
      href: "/admin/batches",
    },
    {
      label: "Calls Today",
      value: kpis?.callsToday ?? 0,
      icon: PhoneCall,
      accent: true,
      href: "/admin/history",
    },
    {
      label: "Interested Today",
      value: kpis?.interestedToday ?? 0,
      icon: Sparkles,
      accent: false,
      href: "/admin/history",
    },
    {
      label: "Follow-ups Due Today",
      value: kpis?.followUpsDueToday ?? 0,
      icon: CalendarClock,
      accent: false,
      href: "/admin/leads?status=Callback",
    },
    {
      label: "Won This Month",
      value: kpis?.wonThisMonth ?? 0,
      icon: Trophy,
      accent: false,
      href: "/admin/reports",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Agency Overview
          </h1>
          <p className="text-sm text-[#737370]">
            Live calling pipeline, lead pool, and team performance today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/import" className="btn-pill-light px-4 py-2 text-sm">
            Import CSV / Excel
          </Link>
          <Link href="/admin/batches" className="btn-pill-dark px-4 py-2 text-sm">
            Assign Today&apos;s Batches
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className={`rounded-3xl p-5 transition-transform hover:-translate-y-0.5 ${
                c.accent
                  ? "bg-[#FF5C1C] text-white shadow-[0_6px_20px_rgba(255,92,28,0.25)]"
                  : "crm-card"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-medium ${
                    c.accent ? "text-white/85" : "text-[#737370]"
                  }`}
                >
                  {c.label}
                </span>
                <Icon
                  className={`w-4 h-4 ${
                    c.accent ? "text-white" : "text-[#737370]"
                  }`}
                />
              </div>
              {isLoading ? (
                <Skeleton
                  className={`h-9 w-16 ${c.accent ? "bg-white/25" : ""}`}
                />
              ) : (
                <div className="text-3xl font-bold tracking-tight">
                  {c.value}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Chart + Per-caller today table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 crm-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold">Calls Per Day (Last 14 Days)</h2>
              <p className="text-xs text-[#737370]">
                Total call attempts vs positive outcomes
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-medium text-[#111111] inline-flex items-center gap-1 hover:underline"
            >
              Full Report <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.chart14Days || []}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEFEA" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#737370" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#737370" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #EBEBE7",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="calls"
                    name="Total Calls"
                    fill="#111111"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="interested"
                    name="Interested / Won"
                    fill="#FF5C1C"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Per-caller table for today */}
        <div className="lg:col-span-5 crm-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Telecallers Today</h2>
              <p className="text-xs text-[#737370]">
                Assigned, called, remaining &amp; interested
              </p>
            </div>
            <Link
              href="/admin/callers"
              className="text-xs font-medium text-[#FF5C1C] hover:underline"
            >
              Manage Callers
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !data?.callerToday || data.callerToday.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#737370]">
                No callers added yet.{" "}
                <Link href="/admin/callers" className="text-[#FF5C1C] font-medium underline">
                  Create your first caller
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#737370] border-b border-[#EBEBE7]">
                    <th className="pb-2.5 font-medium">Caller</th>
                    <th className="pb-2.5 font-medium text-right">Asg</th>
                    <th className="pb-2.5 font-medium text-right">Called</th>
                    <th className="pb-2.5 font-medium text-right">Left</th>
                    <th className="pb-2.5 font-medium text-right">Int.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2EE]">
                  {data.callerToday.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-[#111111] flex items-center gap-2">
                          <span>{c.name}</span>
                          {!c.isActive && <StatusBadge label="Inactive" />}
                        </div>
                        <div className="text-xs text-[#737370]">{c.homeCity}</div>
                      </td>
                      <td className="py-3 text-right font-medium">{c.assigned}</td>
                      <td className="py-3 text-right font-semibold text-[#111111]">
                        {c.called}
                      </td>
                      <td className="py-3 text-right text-[#737370]">
                        {c.remaining}
                      </td>
                      <td className="py-3 text-right font-semibold text-[#FF5C1C]">
                        {c.interested}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
