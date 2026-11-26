"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { AppNotification } from "@/types/crm";
import { useToast } from "./Toast";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const { data } = useQuery<{
    notifications: AppNotification[];
    unreadCount: number;
  }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked read");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full bg-white border border-[#EBEBE7] hover:bg-[#F5F5F3] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[#111111]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5C1C] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#EBEBE7] rounded-3xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#EBEBE7] flex items-center justify-between">
              <span className="text-sm font-bold">
                Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={markingAll}
                  onClick={markAllRead}
                  className="text-xs font-semibold text-[#FF5C1C] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {markingAll ? "Marking..." : "Mark all read"}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#F2F2EE]">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737370]">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.isRead) markRead(n.id);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      n.isRead ? "bg-white" : "bg-[#FFF8F5] hover:bg-[#FFF0EA]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#111111]">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#FF5C1C] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-[#737370] mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-[#9A9A95] mt-1">
                      {new Date(n.createdAt).toLocaleString("en-IN")}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
