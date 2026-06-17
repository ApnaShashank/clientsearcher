"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Search, MapPin, Layers, Sparkles, Database, X } from "lucide-react";
import { locationDatabase, categories } from "@/lib/locationData";

interface SearchFormProps {
  onSearchComplete?: () => void;
}

export default function SearchForm({ onSearchComplete }: SearchFormProps) {
  const { searchParams, setSearchParams, executeSearch, isSearching, currentUser } = useAppStore();
  const [isLiveSearch, setIsLiveSearch] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  // Suggestion focus/active states
  const [activeField, setActiveField] = useState<"country" | "state" | "city" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      setElapsedTime(0);
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Click outside suggestions list resolver
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "country") {
      setSearchParams({ country: value, state: "", city: "" });
    } else if (name === "state") {
      setSearchParams({ state: value, city: "" });
    } else {
      setSearchParams({ [name]: value });
    }
  };

  const selectSuggestion = (field: "country" | "state" | "city", val: string) => {
    if (field === "country") {
      setSearchParams({
        country: val,
        state: "",
        city: ""
      });
    } else if (field === "state") {
      setSearchParams({
        state: val,
        city: ""
      });
    } else if (field === "city") {
      setSearchParams({
        city: val
      });
    }
    setActiveField(null);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setActiveField(null);

    if (!searchParams.city.trim()) {
      setSearchError("Please specify a City to run search.");
      return;
    }

    const cat = searchParams.category === "Custom" ? searchParams.customCategory : searchParams.category;
    if (!cat.trim()) {
      setSearchError("Please select or type a business category.");
      return;
    }

    if (isLiveSearch) {
      try {
        const response = await fetch("/api/leads/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: searchParams.country,
            state: searchParams.state,
            city: searchParams.city,
            category: searchParams.category,
            customCategory: searchParams.customCategory,
            limit: searchParams.limit,
            userId: currentUser?.id || "anonymous",
            userName: currentUser?.name || "Anonymous User"
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed live API search");
        }

        const data = await response.json();
        executeSearch(data.leads);
      } catch (err: any) {
        console.error("Live Search failed, running database fallback:", err);
        setSearchError("Live search encountered an issue (API limit/timeout). Loaded high-quality directory database leads instead.");
        executeSearch();
      }
    } else {
      executeSearch();
    }

    if (onSearchComplete) {
      onSearchComplete();
    }
  };

  // Filter countries
  const filteredCountries = Object.keys(locationDatabase).filter(c =>
    c.toLowerCase().includes(searchParams.country.toLowerCase())
  );

  // Dynamic state suggestions list based on selected Country
  const getStatesForSuggestions = (): string[] => {
    const selectedCountry = searchParams.country.trim();
    
    // Find matching country key case-insensitively
    const dbKey = Object.keys(locationDatabase).find(
      key => key.toLowerCase() === selectedCountry.toLowerCase()
    );

    if (dbKey) {
      return locationDatabase[dbKey].states;
    }

    return [];
  };

  const filteredStates = getStatesForSuggestions().filter(s =>
    s.toLowerCase().includes(searchParams.state.toLowerCase())
  );

  // Dynamic city suggestions list based on selected State & Country
  const getCitiesForSuggestions = (): string[] => {
    const selectedCountry = searchParams.country.trim();
    const selectedState = searchParams.state.trim();

    // Match country key first
    const dbCountryKey = Object.keys(locationDatabase).find(
      key => key.toLowerCase() === selectedCountry.toLowerCase()
    );

    if (dbCountryKey && selectedState) {
      const countryData = locationDatabase[dbCountryKey];
      const dbStateKey = countryData.states.find(
        s => s.toLowerCase() === selectedState.toLowerCase()
      );
      if (dbStateKey && countryData.cities[dbStateKey]) {
        return countryData.cities[dbStateKey];
      }
    }

    return [];
  };

  const filteredCities = getCitiesForSuggestions().filter(ci =>
    ci.toLowerCase().includes(searchParams.city.toLowerCase())
  );

  return (
    <form onSubmit={handleSearchSubmit} className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <Search className="h-4 w-4 text-primary" />
            Lead Search Parameters
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Specify location details and target business type</p>
        </div>

        {/* Live Search vs Database Toggle */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setIsLiveSearch(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              !isLiveSearch
                ? "bg-border text-primary border-primary/20"
                : "bg-transparent text-text-muted border-transparent hover:text-text-primary"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Database Search
          </button>
          <button
            type="button"
            onClick={() => setIsLiveSearch(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isLiveSearch
                ? "bg-border text-primary border-primary/20"
                : "bg-transparent text-text-muted border-transparent hover:text-text-primary"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            Live AI Search
          </button>
        </div>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
        {/* Country input with Autocomplete */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Country</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              name="country"
              value={searchParams.country}
              onChange={handleInputChange}
              onFocus={() => setActiveField("country")}
              placeholder="e.g. India or United States"
              autoComplete="off"
              className="w-full bg-background border border-border rounded-lg pl-8.5 pr-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
            />
          </div>
          {activeField === "country" && filteredCountries.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-xl z-30 select-none divide-y divide-border/40">
              {filteredCountries.map((c) => (
                <div
                  key={c}
                  onClick={() => selectSuggestion("country", c)}
                  className="px-3.5 py-2 text-xs text-text-primary hover:bg-card-hover hover:text-primary cursor-pointer font-medium"
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* State input with Autocomplete */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">State / Region</label>
          <input
            type="text"
            name="state"
            value={searchParams.state}
            onChange={handleInputChange}
            onFocus={() => setActiveField("state")}
            placeholder="e.g. Uttar Pradesh, California"
            autoComplete="off"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
          />
          {activeField === "state" && (
            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-xl z-30 select-none divide-y divide-border/40">
              {filteredStates.length > 0 ? (
                filteredStates.map((s) => (
                  <div
                    key={s}
                    onClick={() => selectSuggestion("state", s)}
                    className="px-3.5 py-2 text-xs text-text-primary hover:bg-card-hover hover:text-primary cursor-pointer font-medium"
                  >
                    {s}
                  </div>
                ))
              ) : (
                <div className="px-3.5 py-2.5 text-xs text-text-muted italic">
                  {!searchParams.country.trim() 
                    ? "Please enter/select a Country first" 
                    : "No matching states found"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* City input with Autocomplete */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">City *</label>
          <input
            type="text"
            name="city"
            value={searchParams.city}
            onChange={handleInputChange}
            onFocus={() => setActiveField("city")}
            placeholder="e.g. Lucknow, Noida, New York"
            autoComplete="off"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition font-semibold"
          />
          {activeField === "city" && (
            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-xl z-30 select-none divide-y divide-border/40">
              {filteredCities.length > 0 ? (
                filteredCities.map((ci) => (
                  <div
                    key={ci}
                    onClick={() => selectSuggestion("city", ci)}
                    className="px-3.5 py-2 text-xs text-text-primary hover:bg-card-hover hover:text-primary cursor-pointer font-semibold"
                  >
                    {ci}
                  </div>
                ))
              ) : (
                <div className="px-3.5 py-2.5 text-xs text-text-muted italic">
                  {!searchParams.state.trim() 
                    ? "Please enter/select a State first" 
                    : "No matching cities found"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Category *</label>
          <div className="relative">
            <Layers className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
            <select
              name="category"
              value={searchParams.category}
              onChange={handleInputChange}
              className="w-full bg-background border border-border rounded-lg pl-8.5 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition appearance-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-card text-text-primary">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Category / Pin Code */}
        {searchParams.category === "Custom" ? (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Custom Category</label>
            <input
              type="text"
              name="customCategory"
              value={searchParams.customCategory}
              onChange={handleInputChange}
              placeholder="e.g. Pet Salon, Bakery"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Pin / ZIP Code (Optional)</label>
            <input
              type="text"
              name="pinCode"
              value={searchParams.pinCode}
              onChange={handleInputChange}
              placeholder="e.g. 10001"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
        {searchError ? (
          <p className="text-xs text-amber-500 font-semibold self-start sm:self-center">{searchError}</p>
        ) : (
          <p className="text-[11px] text-text-muted">
            {isLiveSearch 
              ? "⚡ Live AI Search crawls real-time web listings using GPT-4o."
              : "💻 Database Search queries the global client search index."}
          </p>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Result Count Selector */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Show:</span>
            <select
              name="limit"
              value={searchParams.limit}
              onChange={handleInputChange}
              className="bg-background border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary transition cursor-pointer"
            >
              {[10, 25, 50, 100, 250].map((v) => (
                <option key={v} value={v} className="bg-card">{v}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="flex-1 sm:flex-initial btn-primary rounded-lg px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Searching... ({elapsedTime}s)</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Search Leads</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
