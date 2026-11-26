"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { CallCardFlow, CallerLeadItem } from "@/components/caller/CallCardFlow";

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
  const currentLead = data?.queue?.[0];

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="crm-card p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
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
      </div>

      {isLoading ? (
        <div className="crm-card p-8 text-center text-sm text-[#737370]">
          Loading today&apos;s leads...
        </div>
      ) : !currentLead ? (
        <div className="crm-card p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E6F9EE] text-[#12804A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">All caught up!</h2>
          <p className="text-xs text-[#737370]">
            No more fresh leads in your Today queue. Check Follow-ups or ask Admin for a new batch.
          </p>
        </div>
      ) : (
        <CallCardFlow
          key={currentLead.id}
          lead={currentLead}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["caller-today"] });
            queryClient.invalidateQueries({ queryKey: ["caller-stats"] });
            queryClient.invalidateQueries({ queryKey: ["caller-followups"] });
          }}
        />
      )}
    </div>
  );
}
