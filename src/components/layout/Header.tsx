"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { 
  Search, Briefcase, Bookmark, BarChart3, Shield, LogOut, User as UserIcon, Settings, RefreshCw, Sun, Moon 
} from "lucide-react";
import AuthModal from "./AuthModal";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const mounted = useMounted();
  const { currentUser, onlineUsers, tickOnlineUsers, logout, theme, toggleTheme } = useAppStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Sync theme class with document root and body on mount/change
  useEffect(() => {
    if (mounted) {
      const elements = [document.documentElement, document.body];
      elements.forEach(el => {
        if (theme === "light") {
          el.classList.add("light");
        } else {
          el.classList.remove("light");
        }
      });
    }
  }, [mounted, theme]);

  // Online users ticker real ping scheduler
  useEffect(() => {
    tickOnlineUsers(); // immediate ping
    const timer = setInterval(() => {
      tickOnlineUsers();
    }, 5000);
    return () => clearInterval(timer);
  }, [tickOnlineUsers]);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary"></div>
            <span className="font-semibold text-white">Localead</span>
          </div>
          <div className="h-8 w-24 rounded bg-border animate-pulse"></div>
        </div>
      </header>
    );
  }

  const navItems = [
    { id: "search", label: "Search Leads", icon: Search },
    { id: "my-leads", label: "My Leads", icon: Briefcase },
    { id: "saved", label: "Saved Leads", icon: Bookmark },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (currentUser?.role === "admin") {
    navItems.push({ id: "admin", label: "Admin Panel", icon: Shield });
  }

  return (
    <>
      <header className="sticky top-0 z-45 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Left: Brand logo */}
          <div className="flex items-center gap-8">
            <div 
              onClick={() => setActiveTab("search")} 
              className="flex cursor-pointer items-center gap-2.5 transition hover:opacity-90"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-[#0B0B0C]">
                L
              </div>
              <span className="font-bold tracking-tight text-text-primary text-lg">
                Localead
              </span>
            </div>

            {/* Center: Navigation menu (hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-card text-primary border border-border"
                        : "text-text-muted hover:bg-card/50 hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Counters & Auth actions */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Online count (hidden on mobile) */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-text-muted bg-card px-2.5 py-1.5 rounded-full border border-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{onlineUsers} Users Online</span>
            </div>

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-card text-text-muted hover:text-text-primary hover:bg-card-hover transition cursor-pointer"
              title="Toggle theme mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 transition hover:bg-card-hover"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary font-medium text-xs">
                    {currentUser.name[0]}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-text-primary leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-text-muted leading-tight">{currentUser.role === "admin" ? "Admin" : "Pro Plan"}</p>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-lg border border-border bg-card p-2 shadow-2xl animate-fade-in">
                    <div className="border-b border-border px-3 py-2 text-xs text-text-muted">
                      Logged in as <p className="font-semibold text-text-primary">{currentUser.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                          setActiveTab("search"); // switch back to search on logout
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="text-xs font-medium text-text-muted hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="hidden min-[400px]:block btn-primary rounded-lg px-4 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Authentication Modal */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-45 bg-[#111111]/95 backdrop-blur-md border-t border-border flex justify-around items-center py-2 px-1 shadow-2xl select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 py-1.5 px-2 text-[10px] font-semibold transition-colors cursor-pointer w-full ${
                isActive
                  ? "text-primary font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon className="h-4.5 w-4.5 mb-1" />
              <span className="truncate max-w-[70px]">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
