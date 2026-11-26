"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, ChevronRight } from "lucide-react";
import { CallCardFlow, CallerLeadItem } from "@/components/caller/CallCardFlow";

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

  if (activeLead) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveLead(null)}
          className="btn-pill-light px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Follow-ups
        </button>
        <CallCardFlow
          lead={activeLead}
          onSaved={() => {
            setActiveLead(null);
            queryClient.invalidateQueries({ queryKey: ["caller-followups"] });
            queryClient.invalidateQueries({ queryKey: ["caller-stats"] });
          }}
        />
      </div>
    );
  }

  const dueToday = data?.dueToday || [];
  const upcoming = data?.upcoming || [];

  const renderList = (items: CallerLeadItem[], isDue: boolean) => (
    <div className="space-y-2.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveLead(item)}
          className="w-full crm-card p-4 flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-transform"
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
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Follow-ups</h1>
        <p className="text-xs text-[#737370]">
          Tap any callback lead to call and log the new outcome.
        </p>
      </div>

      {isLoading ? (
        <div className="crm-card p-8 text-center text-sm text-[#737370]">
          Loading follow-ups...
        </div>
      ) : dueToday.length === 0 && upcoming.length === 0 ? (
        <div className="crm-card p-8 text-center space-y-2">
          <CalendarClock className="w-8 h-8 text-[#737370] mx-auto" />
          <p className="text-sm font-semibold">No pending callbacks</p>
          <p className="text-xs text-[#737370]">
            Leads marked as Callback will appear here on their scheduled date.
          </p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
