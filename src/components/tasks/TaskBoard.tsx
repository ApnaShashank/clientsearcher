"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { 
  ClipboardList, Clock, MapPin, Phone, UserCheck, Lock, ExternalLink, ShieldAlert 
} from "lucide-react";

export default function TaskBoard() {
  const mounted = useMounted();
  const { adminTasks, currentUser, acceptTask, updateTaskStatus, updateTaskNotes } = useAppStore();

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="h-16 bg-card rounded-xl border border-border" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-card rounded-xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center space-y-4 shadow-lg select-none">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background text-text-muted">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Authentication Required</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            Please sign in to view dispatched tasks, lock assignments, and track outreach status.
          </p>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      case "Contacted": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Interested": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Not Interested": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "Won": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Lost": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Admin Tasks Board</h2>
            <p className="text-xs text-text-muted">Accept dispatched leads and handle conversions cooperatively</p>
          </div>
        </div>
        <div className="text-[11px] text-text-muted font-mono bg-background px-3 py-1.5 rounded-lg border border-border">
          {adminTasks.length} Dispatched Tasks
        </div>
      </div>

      {adminTasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center space-y-4 shadow-sm">
          <ClipboardList className="h-6 w-6 text-text-muted mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">No Active Dispatches</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              Administrator has not dispatched any leads yet. Once a lead task is forwarded, it will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminTasks.map((task) => {
            const isAssigned = task.acceptedBy !== null;
            const isAssignedToMe = task.acceptedBy === currentUser.id;

            return (
              <div 
                key={task.id}
                className={`bg-card border rounded-xl p-5 flex flex-col space-y-4 hover:border-primary/50 transition-all duration-300 shadow-sm relative group ${
                  isAssignedToMe 
                    ? "border-primary/40 shadow-[0_0_15px_rgba(56,189,248,0.04)]" 
                    : isAssigned 
                    ? "opacity-60 border-border/40 bg-[#0c0c0d]" 
                    : "border-border hover:border-primary/40 hover:shadow-lg"
                }`}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/15">
                        Admin Dispatched
                      </span>
                      {task.pdfUrl && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/15">
                          PDF Attached
                        </span>
                      )}
                    </div>
                    
                    <h3 
                      className="font-extrabold text-text-primary text-sm tracking-tight leading-snug mt-1.5"
                    >
                      {task.businessName}
                    </h3>
                    
                    <p className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3 w-3 text-text-muted/80 shrink-0" />
                      <span className="truncate max-w-[280px]">{task.address}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {isAssignedToMe ? (
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                        {task.status}
                      </span>
                    ) : isAssigned ? (
                      <span className="px-2 py-0.5 rounded border border-border/40 text-text-dark text-[9px] font-bold bg-[#111] shrink-0">
                        Taken
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded border border-primary/20 text-primary text-[9px] font-bold bg-primary/10 shrink-0">
                        Open
                      </span>
                    )}

                    {isAssignedToMe ? (
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-text-primary bg-background px-1.5 py-0.5 rounded border border-border">
                        <UserCheck className="h-2.5 w-2.5 text-primary" />
                        <span>Me</span>
                      </div>
                    ) : isAssigned ? (
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-text-muted bg-background px-1.5 py-0.5 rounded border border-border">
                        <Lock className="h-2.5 w-2.5 text-text-dark" />
                        <span>{task.acceptedByName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                        <span>Open</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Contacts Links Bar */}
                <div className="flex items-center gap-2 text-xs">
                  {isAssignedToMe ? (
                    <>
                      {task.phoneNumber && (
                        <a 
                          href={`tel:${task.phoneNumber}`}
                          className="flex items-center gap-1 hover:text-text-primary transition font-mono text-[10px] text-text-muted bg-card hover:bg-card-hover border border-border px-2.5 py-1.5 rounded-lg"
                        >
                          <Phone className="h-3 w-3 text-primary shrink-0" />
                          <span>Call</span>
                        </a>
                      )}
                      
                      {task.phoneNumber && (
                        <a 
                          href={`https://wa.me/${task.phoneNumber.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-emerald-400 transition font-mono text-[10px] text-text-muted bg-card hover:bg-card-hover border border-border px-2.5 py-1.5 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {task.googleMapsUrl && (
                        <a 
                          href={task.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition text-[10px] text-text-muted bg-card hover:bg-card-hover border border-border px-2.5 py-1.5 rounded-lg"
                        >
                          <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                          <span>Maps</span>
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-text-dark select-none bg-background/30 border border-border/20 px-2 py-1 rounded-lg">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Accept task to unlock contact & maps details</span>
                    </div>
                  )}
                </div>

                {/* Actions and Status Section */}
                <div className="pt-2 border-t border-border/30">
                  {isAssignedToMe ? (
                    <div className="space-y-4">
                      {/* Status select dropdown */}
                      <div className="space-y-1.5 bg-background/30 border border-border/40 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-text-muted">Task Status</label>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-[11px] font-semibold text-text-primary">{task.status}</span>
                          </div>
                        </div>

                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer text-left w-full sm:w-44 ${getStatusStyle(task.status)}`}
                        >
                          <option value="Pending" className="bg-card text-zinc-500">Pending</option>
                          <option value="Contacted" className="bg-card text-blue-500">Contacted</option>
                          <option value="Interested" className="bg-card text-sky-500">Interested</option>
                          <option value="Not Interested" className="bg-card text-slate-500">Not Interested</option>
                          <option value="Won" className="bg-card text-emerald-500">Won</option>
                          <option value="Lost" className="bg-card text-rose-500">Lost</option>
                        </select>
                      </div>

                      {/* Notes textarea */}
                      <div className="space-y-3 bg-background/50 border border-border/55 p-3 rounded-xl">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-text-muted/95 tracking-wide">
                          Task Outreach Notes
                        </span>
                        <textarea
                          defaultValue={task.notes || ""}
                          onBlur={(e) => {
                            if (e.target.value !== (task.notes || "")) {
                              updateTaskNotes(task.id, e.target.value);
                            }
                          }}
                          placeholder="Log outreach discussions, meeting details, client responses..."
                          rows={3}
                          className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition leading-relaxed resize-none"
                        />
                        <div className="text-right text-[9px] text-text-dark">
                          * Note saves automatically when you click outside the box
                        </div>
                      </div>
                    </div>
                  ) : isAssigned ? (
                    <div className="bg-[#1a1311] border border-amber-500/10 text-amber-500/85 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Lock className="h-4 w-4 shrink-0" />
                      <span>This task is locked. Assigned to operator {task.acceptedByName}.</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => acceptTask(task.id)}
                      className="w-full bg-primary hover:bg-sky-400 text-[#0c0c0d] py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition duration-300 cursor-pointer shadow-[0_4px_12px_rgba(56,189,248,0.1)]"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Accept Task Assignment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
