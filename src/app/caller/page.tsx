"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { CallCardFlow, CallerLeadItem } from "@/components/caller/CallCardFlow";
import { Skeleton } from "@/components/ui/Skeleton";

interface TodayResponse {
  queue: CallerLeadItem[];
  progress: {
    doneToday: number;
    remaining: number;
    totalToday: number;
  };
}

export default function CallerTodayPage() {
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<TodayResponse>({
    queryKey: ["caller-today"],
    queryFn: async () => {
      const res = await fetch("/api/caller/today");
      if (!res.ok) throw new Error("Failed to load queue");
      return res.json();
    },
  });

  const progress = data?.progress || {
    doneToday: 0,
    remaining: 0,
    totalToday: 0,
  };
  const pct =
    progress.totalToday > 0
      ? Math.round((progress.doneToday / progress.totalToday) * 100)
      : 0;
  const queue = data?.queue || [];
  const currentLead =
    queue.find((l) => l.id === selectedLeadId) || queue[0] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column: Progress + Desktop Queue List */}
      <div className="lg:col-span-5 space-y-4">
        <div className="crm-card p-4 lg:p-5 space-y-2.5">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2.5 w-full" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs lg:text-sm">
                <span className="font-bold text-[#111111]">
                  {progress.doneToday} of {progress.totalToday} done today
                </span>
                <span className="font-semibold text-[#FF5C1C]">{pct}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#F2F2EE] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF5C1C] rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Desktop/Laptop Queue Sidebar */}
        <div className="hidden lg:block crm-card p-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold">Today&apos;s Queue</h2>
            <span className="text-xs text-[#737370] font-medium">
              {queue.length} left
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <p className="text-xs text-[#737370] py-6 text-center">
              Queue is empty.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
              {queue.map((item, idx) => {
                const active = currentLead?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedLeadId(item.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-colors flex items-center justify-between gap-2 ${
                      active
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-[#F9F9F7] text-[#111111] border-transparent hover:border-[#E2E2DC]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {idx + 1}. {item.businessName}
                      </div>
                      <div
                        className={`text-[11px] truncate mt-0.5 ${
                          active ? "text-white/75" : "text-[#737370]"
                        }`}
                      >
                        {item.category} · {item.area || item.city}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Lead Card */}
      <div className="lg:col-span-7">
        {isLoading ? (
          <div className="crm-card p-6 space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-14 w-full" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-14 col-span-2" />
              <Skeleton className="h-14" />
            </div>
          </div>
        ) : !currentLead ? (
          <div className="crm-card p-8 lg:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E6F9EE] text-[#12804A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">All caught up!</h2>
            <p className="text-xs lg:text-sm text-[#737370] max-w-sm mx-auto">
              No more fresh leads in your Today queue. Check Follow-ups or ask
              Admin for a new batch.
            </p>
          </div>
        ) : (
          <CallCardFlow
            key={currentLead.id}
            lead={currentLead}
            onSaved={() => {
              setSelectedLeadId(null);
              queryClient.invalidateQueries({ queryKey: ["caller-today"] });
              queryClient.invalidateQueries({ queryKey: ["caller-stats"] });
              queryClient.invalidateQueries({ queryKey: ["caller-followups"] });
            }}
          />
        )}
      </div>
    </div>
  );
}
