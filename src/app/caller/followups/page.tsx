"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, ChevronRight } from "lucide-react";
import { CallCardFlow, CallerLeadItem } from "@/components/caller/CallCardFlow";
import { Skeleton } from "@/components/ui/Skeleton";

interface FollowupsResponse {
  dueToday: CallerLeadItem[];
  upcoming: CallerLeadItem[];
}

export default function CallerFollowupsPage() {
  const queryClient = useQueryClient();
  const [activeLead, setActiveLead] = useState<CallerLeadItem | null>(null);

  const { data, isLoading } = useQuery<FollowupsResponse>({
    queryKey: ["caller-followups"],
    queryFn: async () => (await fetch("/api/caller/followups")).json(),
  });

  const dueToday = data?.dueToday || [];
  const upcoming = data?.upcoming || [];

  const renderList = (items: CallerLeadItem[], isDue: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2.5">
      {items.map((item) => {
        const selected = activeLead?.id === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveLead(item)}
            className={`w-full crm-card p-4 flex items-center justify-between gap-3 text-left transition-all ${
              selected ? "ring-2 ring-[#111111]" : "hover:border-[#111111]"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate">
                  {item.businessName}
                </span>
                {isDue && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0EA] text-[#FF5C1C]">
                    DUE
                  </span>
                )}
              </div>
              <div className="text-xs text-[#737370] mt-0.5">
                {item.category} · {item.area || item.city}
                {item.followUpDate ? ` · ${item.followUpDate.slice(0, 10)}` : ""}
              </div>
              {item.lastNote && (
                <div className="text-xs text-[#111111] mt-1 truncate">
                  Note: {item.lastNote}
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-[#737370] shrink-0" />
          </button>
        );
      })}
    </div>
  );

  // Mobile-only focused view when a lead is tapped
  if (activeLead) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          <h1 className="text-xl font-bold tracking-tight">Follow-ups</h1>
          {dueToday.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
                Due Today ({dueToday.length})
              </h2>
              {renderList(dueToday, true)}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#737370]">
                Upcoming ({upcoming.length})
              </h2>
              {renderList(upcoming, false)}
            </div>
          )}
        </div>
        <div className="lg:col-span-7 space-y-4">
          <button
            onClick={() => setActiveLead(null)}
            className="lg:hidden btn-pill-light px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Follow-ups
          </button>
          <CallCardFlow
            key={activeLead.id}
            lead={activeLead}
            onSaved={() => {
              setActiveLead(null);
              queryClient.invalidateQueries({ queryKey: ["caller-followups"] });
              queryClient.invalidateQueries({ queryKey: ["caller-stats"] });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Follow-ups</h1>
        <p className="text-xs lg:text-sm text-[#737370]">
          Tap any callback lead to call and log the new outcome.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : dueToday.length === 0 && upcoming.length === 0 ? (
        <div className="crm-card p-8 lg:p-12 text-center space-y-2">
          <CalendarClock className="w-8 h-8 text-[#737370] mx-auto" />
          <p className="text-sm font-semibold">No pending callbacks</p>
          <p className="text-xs text-[#737370]">
            Leads marked as Callback will appear here on their scheduled date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dueToday.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
                Due Today ({dueToday.length})
              </h2>
              {renderList(dueToday, true)}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#737370]">
                Upcoming ({upcoming.length})
              </h2>
              {renderList(upcoming, false)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
