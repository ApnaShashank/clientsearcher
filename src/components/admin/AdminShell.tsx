"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  Layers,
  Upload,
  History,
  FileBarChart2,
  CheckSquare,
  Settings,
  LogOut,
  Plus,
  Menu,
  X,
  Search,
} from "lucide-react";
import { PublicUser } from "@/types/crm";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/batches", label: "Assign", icon: Layers },
  { href: "/admin/callers", label: "Callers", icon: PhoneCall },
  { href: "/admin/history", label: "History", icon: History },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart2 },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleGlobalSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchText.trim()) {
      router.push(`/admin/leads?q=${encodeURIComponent(searchText.trim())}`);
    }
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F3] text-[#111111]">
      {/* Desktop Slim Icon + Label Sidebar */}
      <aside className="hidden lg:flex flex-col w-20 hover:w-56 transition-all duration-200 group bg-white border-r border-[#EBEBE7] py-5 px-3 sticky top-0 h-screen z-30 shrink-0">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-2.5 mb-7 overflow-hidden"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#FF5C1C] flex items-center justify-center text-white font-bold text-base shrink-0">
            C
          </div>
          <span className="font-bold text-base tracking-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Creightweb
          </span>
        </Link>

        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors overflow-hidden ${
                  active
                    ? "bg-[#111111] text-white"
                    : "text-[#737370] hover:bg-[#F5F5F3] hover:text-[#111111]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-[#737370] hover:bg-[#FEECEC] hover:text-[#C92A2A] transition-colors overflow-hidden mt-2"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Logout
          </span>
        </button>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full p-5 flex flex-col z-10 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FF5C1C] flex items-center justify-center text-white font-bold">
                  C
                </div>
                <span className="font-bold text-base">Creightweb</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full hover:bg-[#F5F5F3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium ${
                      active
                        ? "bg-[#111111] text-white"
                        : "text-[#737370] hover:bg-[#F5F5F3] hover:text-[#111111]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-[#C92A2A] hover:bg-[#FEECEC] mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-[#F5F5F3]/90 backdrop-blur-md border-b border-[#EBEBE7] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-[#EBEBE7]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <form onSubmit={handleGlobalSearch} className="relative flex-1">
              <Search className="w-4 h-4 text-[#737370] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search leads by name or phone..."
                className="w-full bg-white border border-[#EBEBE7] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#111111]"
              />
            </form>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/leads/new"
              className="btn-pill-dark px-4 py-2 text-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </Link>
            <Link
              href="/admin/batches"
              className="btn-pill-orange px-4 py-2 text-sm hidden sm:inline-flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Assign Batch</span>
            </Link>
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-[#E2E2DC]">
              <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-bold">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold">{user.name}</p>
                <p className="text-[11px] text-[#737370]">Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
