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
                className={`bg-card border rounded-xl p-4.5 flex flex-col justify-between gap-4 transition-all duration-300 relative overflow-hidden ${
                  isAssignedToMe 
                    ? "border-primary/40 shadow-[0_0_15px_rgba(56,189,248,0.04)]" 
                    : isAssigned 
                    ? "opacity-60 border-border/40 bg-[#0c0c0d]" 
                    : "border-border hover:border-primary/40 hover:shadow-lg"
                }`}
              >
                {/* Task Header */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-text-primary text-xs leading-tight line-clamp-1">
                      {task.businessName}
                    </h4>
                    
                    {isAssignedToMe ? (
                      <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider shrink-0 ${getStatusStyle(task.status)}`}>
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
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Dispatched {new Date(task.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Lead Parameters Section */}
                <div className="space-y-2 text-xs border-y border-border/30 py-3">
                  <div className="flex items-start gap-2 text-text-muted">
                    <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span className="line-clamp-2">{task.address}</span>
                  </div>

                  {/* Contact Number (hidden or blurred if not accepted by current user) */}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-text-muted/70" />
                    {isAssignedToMe ? (
                      <a href={`tel:${task.phoneNumber}`} className="text-text-primary font-mono hover:text-primary font-medium">
                        {task.phoneNumber || "No phone listed"}
                      </a>
                    ) : (
                      <span className="text-text-dark font-mono blur-[3px] select-none">
                        +91 99999 88888
                      </span>
                    )}
                  </div>

                  {/* Map Link */}
                  {task.googleMapsUrl && (
                    <div className="pt-0.5">
                      {isAssignedToMe ? (
                        <a 
                          href={task.googleMapsUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-bold text-[10px]"
                        >
                          <span>Open in Google Maps</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-text-dark font-bold text-[10px] cursor-not-allowed">
                          Maps Link Locked
                        </span>
                      )}
                    </div>
                  )}

                  {/* PDF Download Indicator */}
                  {task.pdfUrl && (
                    <div className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 w-fit">
                      Attached Resource PDF
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-1.5 space-y-3">
                  {isAssignedToMe ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-text-muted">Update Progress Status</label>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                          className={`w-full rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-0 ${getStatusStyle(task.status)} bg-card cursor-pointer`}
                        >
                          <option value="Pending" className="bg-card text-zinc-500">Pending</option>
                          <option value="Contacted" className="bg-card text-blue-500">Contacted</option>
                          <option value="Interested" className="bg-card text-sky-500">Interested</option>
                          <option value="Not Interested" className="bg-card text-slate-500">Not Interested</option>
                          <option value="Won" className="bg-card text-emerald-500">Won</option>
                          <option value="Lost" className="bg-card text-rose-500">Lost</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-border/30">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-text-muted">Outreach Notes</label>
                        <textarea
                          defaultValue={task.notes || ""}
                          onBlur={(e) => {
                            if (e.target.value !== (task.notes || "")) {
                              updateTaskNotes(task.id, e.target.value);
                            }
                          }}
                          placeholder="Outreach notes... (Auto-saves on blur)"
                          rows={2}
                          className="w-full bg-[#111112] border border-[#1f1f21] rounded-lg p-2 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition resize-none leading-relaxed"
                        />
                      </div>
                    </>
                  ) : isAssigned ? (
                    <div className="bg-[#1a1311] border border-amber-500/10 text-amber-500/85 p-2 rounded-lg text-[10px] font-semibold flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span>Assigned to {task.acceptedByName}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => acceptTask(task.id)}
                      className="w-full bg-primary hover:bg-sky-400 text-[#0c0c0d] py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition duration-300 cursor-pointer shadow-[0_4px_12px_rgba(56,189,248,0.1)]"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
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
