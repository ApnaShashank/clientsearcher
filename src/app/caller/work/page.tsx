"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Briefcase } from "lucide-react";
import { ShowcaseItem } from "@/types/crm";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CallerWorkPage() {
  const { data, isLoading } = useQuery<{ items: ShowcaseItem[] }>({
    queryKey: ["caller-showcase"],
    queryFn: async () => (await fetch("/api/admin/showcase")).json(),
    staleTime: 2 * 60_000,
  });

  const items = data?.items || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
          Our Work — Show Clients
        </h1>
        <p className="text-xs lg:text-sm text-[#737370]">
          Open any live Creightweb website or demo to show the client during a
          call.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="crm-card p-8 text-center space-y-2">
          <Briefcase className="w-8 h-8 text-[#737370] mx-auto" />
          <p className="text-sm font-semibold">No showcase items yet</p>
          <p className="text-xs text-[#737370]">
            Admin can add client websites and demos from Admin → Showcase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="crm-card overflow-hidden flex flex-col justify-between"
            >
              {item.previewImage && (
                <div className="aspect-video bg-[#F9F9F7] border-b border-[#EBEBE7] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewImage}
                    alt={item.businessName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 lg:p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  {item.logoImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.logoImage}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-[#EBEBE7] shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF0EA] text-[#FF5C1C]">
                      {item.category} · {item.type === "demo" ? "Demo" : "Client"}
                    </span>
                    <h2 className="font-bold text-base mt-1 truncate">
                      {item.businessName}
                    </h2>
                    <p className="text-xs text-[#737370]">{item.title}</p>
                  </div>
                </div>

                <a
                  href={item.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill-dark w-full py-3 text-xs inline-flex items-center justify-center gap-2"
                >
                  <span>Open Live Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
