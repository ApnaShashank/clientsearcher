"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PhoneCall, CalendarClock, BarChart3, FileText, LogOut } from "lucide-react";
import { PublicUser } from "@/types/crm";

const TABS = [
  { href: "/caller", label: "Today", icon: PhoneCall },
  { href: "/caller/followups", label: "Follow-ups", icon: CalendarClock },
  { href: "/caller/stats", label: "My Stats", icon: BarChart3 },
  { href: "/caller/report", label: "Report", icon: FileText },
];

export function CallerShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isActive = (href: string) => {
    if (href === "/caller") return pathname === "/caller";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111] flex flex-col max-w-md mx-auto relative shadow-[0_0_40px_rgba(0,0,0,0.04)]">
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-20 bg-[#F5F5F3]/95 backdrop-blur-md px-4 py-3.5 flex items-center justify-between border-b border-[#EBEBE7]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF5C1C] text-white font-bold text-sm flex items-center justify-center">
            C
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">{user.name}</div>
            <div className="text-[11px] text-[#737370]">Creightweb Caller</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-white border border-[#EBEBE7] text-[#737370] hover:text-[#C92A2A]"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 pb-24">{children}</main>

      {/* Fixed Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-[#EBEBE7] px-2 py-2 flex items-center justify-around z-30">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl min-w-[72px] transition-colors ${
                active ? "text-[#FF5C1C]" : "text-[#737370]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
