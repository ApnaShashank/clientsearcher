"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("creightweb_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("creightweb_theme", "light");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light Mode" : "Dark Mode"}
      className={`p-2 rounded-full bg-white border border-[#EBEBE7] hover:bg-[#F5F5F3] transition-colors ${className}`}
    >
      {dark ? (
        <Sun className="w-4 h-4 text-[#FF5C1C]" />
      ) : (
        <Moon className="w-4 h-4 text-[#111111]" />
      )}
    </button>
  );
}
