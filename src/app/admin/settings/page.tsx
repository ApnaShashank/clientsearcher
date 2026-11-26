"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Save } from "lucide-react";
import { AppSettings } from "@/types/crm";

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery<{ settings: AppSettings }>({
    queryKey: ["crm-settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
  });

  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [newCity, setNewCity] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newService, setNewService] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (data?.settings) {
      setCities(data.settings.cities);
      setCategories(data.settings.categories);
      setServices(data.settings.servicesToPitch);
    }
  }, [data]);

  async function handleSave() {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cities,
          categories,
          servicesToPitch: services,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["crm-settings"] });
        setSavedMsg("Settings saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  function renderTagEditor(
    title: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>,
    inputVal: string,
    setInputVal: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string
  ) {
    const addItem = () => {
      const val = inputVal.trim();
      if (val && !items.includes(val)) {
        setItems([...items, val]);
        setInputVal("");
      }
    };

    return (
      <div className="crm-card p-6 space-y-4">
        <h2 className="text-base font-bold">{title}</h2>
        <div className="flex gap-2">
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-[#F9F9F7] border border-[#E2E2DC] rounded-full px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addItem}
            className="btn-pill-light px-4 py-2 text-sm inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F3] text-xs font-medium"
            >
              {item}
              <button
                type="button"
                onClick={() => setItems(items.filter((x) => x !== item))}
                className="text-[#737370] hover:text-[#C92A2A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Settings</h1>
          <p className="text-sm text-[#737370]">
            Manage dropdown options used across lead forms, filters, and callers.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-pill-dark px-5 py-2.5 text-sm inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {savedMsg && (
        <div className="bg-[#E6F9EE] text-[#12804A] text-sm font-medium px-4 py-3 rounded-2xl">
          {savedMsg}
        </div>
      )}

      {renderTagEditor(
        "Cities",
        cities,
        setCities,
        newCity,
        setNewCity,
        "Add a city (e.g. Gorakhpur)"
      )}

      {renderTagEditor(
        "Business Categories",
        categories,
        setCategories,
        newCategory,
        setNewCategory,
        "Add a category (e.g. Jewellery Store)"
      )}

      {renderTagEditor(
        "Services to Pitch",
        services,
        setServices,
        newService,
        setNewService,
        "Add a service (e.g. SEO)"
      )}
    </div>
  );
}
