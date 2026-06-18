"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { 
  Search, Briefcase, Bookmark, BarChart3, Shield, LogOut, User as UserIcon, Settings, RefreshCw, Sun, Moon, ClipboardList,
  Bell, Download, Globe
} from "lucide-react";
import AuthModal from "./AuthModal";
import SettingsModal from "./SettingsModal";
import PortfolioModal from "./PortfolioModal";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const mounted = useMounted();
  const { 
    currentUser, onlineUsers, tickOnlineUsers, logout, theme, toggleTheme, 
    fetchTasks, fetchNotifications, systemNotifications, markNotificationRead, markAllNotificationsRead,
    fetchPortfolio
  } = useAppStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [authDefaultRegister, setAuthDefaultRegister] = useState(false);

  const unreadCount = systemNotifications ? systemNotifications.filter(n => !n.read).length : 0;

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
    fetchTasks();
    fetchPortfolio();
    if (currentUser) {
      fetchNotifications();
    }
    const timer = setInterval(() => {
      tickOnlineUsers();
      fetchTasks();
      if (currentUser) {
        fetchNotifications();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [tickOnlineUsers, fetchTasks, fetchNotifications, fetchPortfolio, currentUser]);

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
    { id: "search", label: "Search Leads", shortLabel: "Search", icon: Search },
    { id: "my-leads", label: "My Leads", shortLabel: "Leads", icon: Briefcase },
    { id: "tasks", label: "Admin Tasks", shortLabel: "Tasks", icon: ClipboardList },
    { id: "analytics", label: "Analytics", shortLabel: "Analytics", icon: BarChart3 },
  ];

  if (currentUser?.role === "admin") {
    navItems.push({ id: "admin", label: "Admin Panel", shortLabel: "Admin", icon: Shield });
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
              aria-label="Toggle theme mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>

            {/* System notifications bell */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotificationsMenu(!showNotificationsMenu);
                    setShowProfileMenu(false);
                  }}
                  className="p-2 rounded-lg border border-border bg-card text-text-muted hover:text-text-primary hover:bg-card-hover transition cursor-pointer relative"
                  title="System notifications"
                  aria-label="System notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-lg animate-pulse select-none">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotificationsMenu && (
                  <div className="absolute right-0 mt-2.5 w-80 rounded-lg border border-border bg-card p-2 shadow-2xl animate-fade-in z-50">
                    <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs select-none">
                      <span className="font-bold text-text-primary">System Alerts</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsRead()}
                          className="text-primary hover:underline font-semibold text-[10px] cursor-pointer"
                          aria-label="Mark all alerts as read"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="py-1 max-h-64 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                      {systemNotifications.length === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-text-muted italic select-none">
                          No notifications at the moment
                        </div>
                      ) : (
                        systemNotifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              if (!notif.read) markNotificationRead(notif.id);
                            }}
                            className={`p-2.5 text-xs transition-all duration-200 cursor-pointer ${
                              notif.read ? "opacity-75 hover:bg-card-hover/20" : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-text-primary text-[11px] truncate max-w-[70%]">
                                {notif.title}
                              </span>
                              <span className="text-[9px] text-text-muted font-mono shrink-0">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{notif.message}</p>
                            <span className="text-[8px] uppercase tracking-wider font-bold text-text-muted mt-1 block">
                              From: {notif.senderName}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotificationsMenu(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 transition hover:bg-card-hover"
                  aria-label="User profile menu"
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
                  <div className="absolute right-0 mt-2.5 w-56 rounded-lg border border-border bg-card p-2 shadow-2xl animate-fade-in z-50">
                    <div className="border-b border-border px-3 py-2 text-xs text-text-muted">
                      Logged in as <p className="font-semibold text-text-primary">{currentUser.email}</p>
                    </div>
                    <div className="py-1.5 divide-y divide-border/30">
                      <div className="pb-1.5 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsOpen(true);
                            setShowProfileMenu(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-text-muted hover:bg-card-hover hover:text-text-primary transition cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5 text-text-muted" />
                          <span>Profile Settings</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsPortfolioOpen(true);
                            setShowProfileMenu(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-text-muted hover:bg-card-hover hover:text-text-primary transition cursor-pointer"
                        >
                          <Globe className="h-3.5 w-3.5 text-text-muted" />
                          <span>Demo & Client Websites</span>
                        </button>
                        
                        <a
                          href="/downloads/localead-app.zip"
                          download="localead-app.zip"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-text-muted hover:bg-card-hover hover:text-text-primary transition cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5 text-text-muted" />
                          <span>Offline Download</span>
                        </a>
                      </div>
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setShowProfileMenu(false);
                            setActiveTab("search"); // switch back to search on logout
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setAuthDefaultRegister(false);
                    setIsAuthOpen(true);
                  }}
                  className="text-xs font-medium text-text-muted hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthDefaultRegister(true);
                    setIsAuthOpen(true);
                  }}
                  className="hidden min-[400px]:block btn-primary rounded-lg px-4 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Interactive Authentication Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} defaultRegister={authDefaultRegister} />

      {/* Profile Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Portfolio & Demo Websites Modal */}
      <PortfolioModal isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />


      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-45 bg-[#111111]/95 backdrop-blur-md border-t border-border flex flex-row flex-nowrap justify-between items-center h-14 px-1 shadow-2xl select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center h-full px-1 text-[10px] font-bold tracking-tight transition-colors cursor-pointer flex-1 min-w-0 ${
                isActive
                  ? "text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
              aria-label={item.label}
            >
              <Icon className="h-4.5 w-4.5 mb-0.5 shrink-0" />
              <span className="truncate w-full text-center block text-[9px] uppercase tracking-wider leading-none mt-0.5">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
