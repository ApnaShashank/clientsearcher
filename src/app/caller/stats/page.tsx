"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface StatBucket {
  assigned: number;
  callsDone: number;
  acceptanceRate: number;
  interested: number;
  meetings: number;
  won: number;
  callbacksPending: number;
}

interface StatsResponse {
  today: StatBucket;
  week: StatBucket;
  total: StatBucket;
  last7Days: {
    date: string;
    label: string;
    calls: number;
    interested: number;
  }[];
}

export default function CallerStatsPage() {
  const [period, setPeriod] = useState<"today" | "week" | "total">("today");

  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ["caller-stats"],
    queryFn: async () => (await fetch("/api/caller/stats")).json(),
  });

  const bucket = data?.[period];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">My Stats</h1>
        <div className="inline-flex bg-white border border-[#EBEBE7] rounded-full p-1">
          {(["today", "week", "total"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                period === p ? "bg-[#111111] text-white" : "text-[#737370]"
              }`}
            >
              {p === "week" ? "This Week" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl p-4 bg-[#FF5C1C] text-white">
          <div className="text-xs text-white/85">Calls Done</div>
          <div className="text-3xl font-bold mt-1">
            {isLoading ? "—" : bucket?.callsDone ?? 0}
          </div>
        </div>
        <div className="crm-card p-4">
          <div className="text-xs text-[#737370]">Assigned</div>
          <div className="text-3xl font-bold mt-1">
            {isLoading ? "—" : bucket?.assigned ?? 0}
          </div>
        </div>
        <div className="crm-card p-4">
          <div className="text-xs text-[#737370]">Interested</div>
          <div className="text-2xl font-bold text-[#12804A] mt-1">
            {isLoading ? "—" : bucket?.interested ?? 0}
          </div>
        </div>
        <div className="crm-card p-4">
          <div className="text-xs text-[#737370]">Meetings Fixed</div>
          <div className="text-2xl font-bold text-[#FF5C1C] mt-1">
            {isLoading ? "—" : bucket?.meetings ?? 0}
          </div>
        </div>
        <div className="crm-card p-4">
          <div className="text-xs text-[#737370]">Won Deals</div>
          <div className="text-2xl font-bold mt-1">
            {isLoading ? "—" : bucket?.won ?? 0}
          </div>
        </div>
        <div className="crm-card p-4">
          <div className="text-xs text-[#737370]">Callbacks Pending</div>
          <div className="text-2xl font-bold mt-1">
            {isLoading ? "—" : bucket?.callbacksPending ?? 0}
          </div>
        </div>
      </div>

      <div className="crm-card p-4 flex items-center justify-between">
        <span className="text-xs font-medium text-[#737370]">
          Queue Completion Rate
        </span>
        <span className="text-base font-bold text-[#111111]">
          {isLoading ? "—" : `${bucket?.acceptanceRate ?? 0}%`}
        </span>
      </div>

      {/* 7-day bar chart */}
      <div className="crm-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Last 7 Days</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data?.last7Days || []}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            >
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
              <Tooltip />
              <Bar
                dataKey="calls"
                name="Calls"
                fill="#111111"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="interested"
                name="Positive"
                fill="#FF5C1C"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
