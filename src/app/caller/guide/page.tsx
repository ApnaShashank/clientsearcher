"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  PlayCircle,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { PricingRow } from "@/types/crm";
import { Skeleton } from "@/components/ui/Skeleton";

interface GuideResponse {
  pricingRows: PricingRow[];
  trainingVideoUrl: string;
  negotiationRules: string[];
}

function toDriveEmbedUrl(raw: string): string {
  const match = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return raw;
}

export default function CallerGuidePage() {
  const { data, isLoading } = useQuery<GuideResponse>({
    queryKey: ["caller-guide"],
    queryFn: async () => (await fetch("/api/admin/guide")).json(),
    staleTime: 2 * 60_000,
  });

  const embedUrl = data?.trainingVideoUrl
    ? toDriveEmbedUrl(data.trainingVideoUrl)
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
          Caller Guide &amp; Rate Card
        </h1>
        <p className="text-xs lg:text-sm text-[#737370]">
          Client se baat karne ka tarika, sahi rates, aur negotiation rules.
        </p>
      </div>

      {/* 1. Training Video */}
      <div className="crm-card p-4 lg:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-[#FF5C1C]" />
          <h2 className="text-sm lg:text-base font-bold">
            Pehle ye video dekho — client se baat kaise karni hai
          </h2>
        </div>
        {isLoading ? (
          <Skeleton className="aspect-video w-full" />
        ) : embedUrl ? (
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#111111]">
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              title="Creightweb Training Video"
            />
          </div>
        ) : null}
      </div>

      {/* 2. Price List */}
      <div className="space-y-3">
        <h2 className="text-base lg:text-lg font-bold">
          Price List (Rate Card)
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.pricingRows || []).map((row) => (
              <div
                key={row.id}
                className="crm-card p-5 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5C1C]">
                      {row.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        row.domainIncluded
                          ? "bg-[#E6F9EE] text-[#12804A]"
                          : "bg-[#FEECEC] text-[#C92A2A]"
                      }`}
                    >
                      {row.domainIncluded ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {row.domainIncluded
                        ? "Domain included"
                        : "Domain nahi milega"}
                    </span>
                  </div>
                  <div className="font-bold text-base">{row.packageName}</div>
                  <div className="text-2xl font-bold text-[#111111]">
                    ₹{row.priceMin.toLocaleString("en-IN")} – ₹
                    {row.priceMax.toLocaleString("en-IN")}
                  </div>
                </div>
                <p className="text-xs text-[#737370] leading-relaxed pt-2 border-t border-[#F2F2EE]">
                  {row.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Negotiation Rules */}
      <div className="crm-card p-5 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#FF5C1C]" />
          <h2 className="text-base lg:text-lg font-bold">
            Rate kaise rakhe — Negotiation Rules
          </h2>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {(data?.negotiationRules || []).map((rule, idx) => (
              <div
                key={idx}
                className="bg-[#F9F9F7] rounded-2xl p-3.5 text-xs sm:text-sm text-[#111111] leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-[#111111] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Showcase Shortcut */}
      <Link
        href="/caller/work"
        className="crm-card p-5 bg-[#FFF0EA] border-[#FFD3C0] flex items-center justify-between gap-4 hover:border-[#FF5C1C] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C1C] text-white flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm lg:text-base">
              Our Work Showcase
            </div>
            <div className="text-xs text-[#737370]">
              Client ko hamara kaam dikhana ho to ye kholo.
            </div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[#FF5C1C] shrink-0" />
      </Link>
    </div>
  );
}
