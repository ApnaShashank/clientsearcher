"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { X, Globe, MapPin, Tag, Search, ExternalLink, Sparkles, UserCheck } from "lucide-react";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PortfolioModal({ isOpen, onClose }: PortfolioModalProps) {
  const { portfolioWebsites } = useAppStore();
  const [activeTab, setActiveTab] = useState<"demo" | "client">("demo");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredSites = (portfolioWebsites || []).filter(site => {
    // Filter by type
    if (site.type !== activeTab) return false;
    
    // Filter by search query
    const q = searchQuery.toLowerCase();
    return (
      site.name.toLowerCase().includes(q) ||
      site.businessType.toLowerCase().includes(q) ||
      site.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md select-none animate-fade-in p-4">
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl relative scrollbar-none font-sans flex flex-col">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-card-hover transition cursor-pointer"
          aria-label="Close portfolio modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-text-primary flex items-center justify-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Our Website Portfolios & Demos
          </h2>
          <p className="text-xs text-text-muted">
            Explore ready-made demo templates and websites built for our active clients
          </p>
        </div>

        {/* Search & Tabs Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-border/40 pb-3">
          {/* Tabs Selector */}
          <div className="flex bg-[#161616] p-1 rounded-xl border border-border/50 shrink-0">
            <button
              onClick={() => {
                setActiveTab("demo");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "demo"
                  ? "bg-primary text-black"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Demo Templates
            </button>
            <button
              onClick={() => {
                setActiveTab("client");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "client"
                  ? "bg-primary text-black"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Client Portfolios
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search website catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary transition"
              aria-label="Search website catalog"
            />
          </div>
        </div>

        {/* Results Grid List */}
        <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-4">
          {filteredSites.length === 0 ? (
            <div className="text-center py-16 text-xs text-text-muted italic select-none">
              No portfolio websites match your search inputs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSites.map((site) => (
                <div 
                  key={site.id}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-primary/50 transition duration-300"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-extrabold text-text-primary text-xs leading-snug line-clamp-1">
                        {site.name}
                      </h3>
                      <span className="text-[9px] font-bold text-primary uppercase bg-primary/5 border border-primary/20 px-2 py-0.5 rounded tracking-wide shrink-0">
                        {site.businessType}
                      </span>
                    </div>

                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{site.address}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-[10px] font-mono text-text-dark font-medium truncate max-w-[190px]">
                      {site.url.replace("https://", "").replace("www.", "")}
                    </span>

                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      aria-label={`Visit live site for ${site.name}`}
                    >
                      <span>Visit Live Site</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
