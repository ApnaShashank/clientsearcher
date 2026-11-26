"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PhoneCall,
  CalendarClock,
  BarChart3,
  FileText,
  Briefcase,
  BookOpen,
  LogOut,
} from "lucide-react";
import { PublicUser } from "@/types/crm";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { DownloadAppButton } from "@/components/ui/DownloadAppButton";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const TABS = [
  { href: "/caller", label: "Today", icon: PhoneCall },
  { href: "/caller/followups", label: "Follow-ups", icon: CalendarClock },
  { href: "/caller/guide", label: "Guide", icon: BookOpen },
  { href: "/caller/work", label: "Our Work", icon: Briefcase },
  { href: "/caller/stats", label: "Stats", icon: BarChart3 },
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
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-[#F5F5F3]/95 backdrop-blur-md border-b border-[#EBEBE7]">
        <div className="max-w-md lg:max-w-6xl mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <div className="leading-tight">
              <div className="text-sm font-bold">{user.name}</div>
              <div className="text-[11px] text-[#737370]">Creightweb Caller</div>
            </div>
          </div>

          {/* Desktop Horizontal Nav Pills */}
          <nav className="hidden lg:flex items-center gap-1 bg-white border border-[#EBEBE7] rounded-full p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = isActive(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[#111111] text-white"
                      : "text-[#737370] hover:text-[#111111]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <DownloadAppButton
              compact
              className="lg:hidden p-2 rounded-full bg-white border border-[#EBEBE7] text-[#111111]"
            />
            <DownloadAppButton className="hidden lg:inline-flex btn-pill-light px-3.5 py-1.5 text-xs items-center gap-1.5" />
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-white border border-[#EBEBE7] text-[#737370] hover:text-[#C92A2A]"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md lg:max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-6 pb-24 lg:pb-10">
        {children}
      </main>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-[#EBEBE7] px-1 py-2 flex items-center justify-around z-30">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl min-w-[54px] transition-colors ${
                active ? "text-[#FF5C1C]" : "text-[#737370]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
