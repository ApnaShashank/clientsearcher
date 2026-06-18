"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { Filter, RotateCcw, Check, Star } from "lucide-react";

export default function FilterPanel() {
  const { filters, setFilters, resetFilters, executeSearch } = useAppStore();

  const handleToggle = (name: keyof typeof filters) => {
    const updated = !filters[name];
    setFilters({ [name]: updated });
  };

  const handleRatingSelect = (rating: number) => {
    setFilters({ minRating: filters.minRating === rating ? 0 : rating });
  };

  const handleReviewsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setFilters({ minReviews: val });
  };


  const filterSections = [
    {
      title: "Business Status",
      items: [
        { key: "onlyVerified" as const, label: "Only Verified (Rating > 4.0)" },
        { key: "onlyPopular" as const, label: "Only Popular (Reviews > 100)" },
        { key: "recentlyOpened" as const, label: "Recently Opened (< 30 reviews)" },
        { key: "highReviewCount" as const, label: "High Review Count (> 250)" },
        { key: "premiumLeadScore" as const, label: "Premium Lead Score (> 80)" },
      ]
    },
    {
      title: "Website & Security",
      items: [
        { key: "hasWebsite" as const, label: "Has Website" },
        { key: "noWebsite" as const, label: "No Website" },
        { key: "oldWebsite" as const, label: "Old/Outdated SEO (< 65 score)" },
        { key: "noSsl" as const, label: "No SSL Encryption" },
      ]
    },
    {
      title: "Outreach & Contacts",
      items: [
        { key: "hasContactNumber" as const, label: "Has Contact Number" },
        { key: "hasEmail" as const, label: "Has Email Address" },
        { key: "noGoogleReviews" as const, label: "No Google Reviews" },
        { key: "noSocialMedia" as const, label: "No Social Media Profiles" },
      ]
    }
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Lead Filters</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            resetFilters();
          }}
          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary transition cursor-pointer"
          aria-label="Reset all lead filters"
        >
          <RotateCcw className="h-3 w-3" />
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filterSections.map((section, idx) => (
          <div key={idx} className="space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted border-b border-border/30 pb-1">
              {section.title}
            </h4>
            <div className="space-y-2">
              {section.items.map((item) => {
                const isChecked = filters[item.key] as boolean;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => handleToggle(item.key)}
                    className="flex w-full items-center justify-between text-left text-xs text-text-muted hover:text-text-primary transition-colors py-0.5 group cursor-pointer"
                    aria-label={item.label}
                  >
                    <span className={isChecked ? "text-primary font-medium" : ""}>
                      {item.label}
                    </span>
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                      isChecked 
                        ? "bg-primary border-primary text-black" 
                        : "border-border bg-background group-hover:border-primary/50"
                    }`}>
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Ratings and Reviews filters */}
        <div className="space-y-3.5 lg:border-l lg:border-border/30 lg:pl-6">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted border-b border-border/30 pb-1">
            Ratings & Reviews
          </h4>
          
          {/* Min Rating */}
          <div className="space-y-1.5">
            <label id="rating-label" className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Minimum Rating</label>
            <div className="flex items-center gap-1.5" role="group" aria-labelledby="rating-label">
              {[3.5, 4.0, 4.5].map((stars) => {
                const isSelected = filters.minRating === stars;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => handleRatingSelect(stars)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] transition cursor-pointer ${
                      isSelected
                        ? "bg-border text-primary border-primary/20"
                        : "bg-background text-text-muted border-border hover:text-text-primary"
                    }`}
                    aria-label={`Minimum rating ${stars} stars`}
                    aria-pressed={isSelected}
                  >
                    <Star className={`h-3 w-3 ${isSelected ? "fill-primary text-primary" : "text-text-muted"}`} />
                    <span>{stars}+</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min Reviews Count */}
          <div className="space-y-1.5">
            <label htmlFor="filter-min-reviews" className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Minimum Reviews Count</label>
            <input
              type="number"
              id="filter-min-reviews"
              value={filters.minReviews || ""}
              onChange={handleReviewsInput}
              placeholder="e.g. 50 reviews"
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
