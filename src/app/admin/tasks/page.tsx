"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Circle, Trash2, AlertCircle } from "lucide-react";
import { AdminTask } from "@/types/crm";
import { Skeleton, Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function AdminTasksPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ tasks: AdminTask[] }>({
    queryKey: ["admin-tasks"],
    queryFn: async () => (await fetch("/api/tasks")).json(),
  });

  const tasks = data?.tasks || [];
  const todayStr = new Date().toISOString().slice(0, 10);

  const overdueTasks = tasks.filter(
    (t) => t.status === "To Do" && t.dueDate && t.dueDate < todayStr
  );
  const todoTasks = tasks.filter(
    (t) => t.status === "To Do" && (!t.dueDate || t.dueDate >= todayStr)
  );
  const doneTasks = tasks.filter((t) => t.status === "Done");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate: dueDate || null }),
      });
      if (!res.ok) {
        toast.error("Failed to add task");
        return;
      }
      setTitle("");
      setDueDate("");
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success("Task added");
    } finally {
      setAdding(false);
    }
  }

  async function toggleTask(t: AdminTask) {
    setBusyId(t.id);
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: t.id,
          status: t.status === "Done" ? "To Do" : "Done",
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success(t.status === "Done" ? "Moved to To Do" : "Marked Done");
    } finally {
      setBusyId(null);
    }
  }

  async function removeTask(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast.success("Task deleted");
    } finally {
      setBusyId(null);
    }
  }

  const renderGroup = (
    heading: string,
    items: AdminTask[],
    accent?: "overdue" | "done"
  ) => (
    <div className="crm-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className={`text-sm font-bold flex items-center gap-2 ${
            accent === "overdue" ? "text-[#C92A2A]" : "text-[#111111]"
          }`}
        >
          {accent === "overdue" && <AlertCircle className="w-4 h-4" />}
          {heading}
        </h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F5F3] text-[#737370] font-medium">
          {items.length}
        </span>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-[#737370] py-4 text-center">No tasks here.</p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#F9F9F7]"
            >
              <button
                disabled={busyId === t.id}
                onClick={() => toggleTask(t)}
                className="flex items-center gap-3 text-left flex-1 disabled:opacity-50"
              >
                {busyId === t.id ? (
                  <Spinner className="w-5 h-5 shrink-0" />
                ) : t.status === "Done" ? (
                  <CheckCircle2 className="w-5 h-5 text-[#12804A] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#737370] shrink-0" />
                )}
                <div>
                  <div
                    className={`text-sm font-medium ${
                      t.status === "Done" ? "line-through text-[#737370]" : ""
                    }`}
                  >
                    {t.title}
                  </div>
                  {t.dueDate && (
                    <div className="text-[11px] text-[#737370]">
                      Due: {t.dueDate}
                    </div>
                  )}
                </div>
              </button>
              <button
                disabled={busyId === t.id}
                onClick={() => removeTask(t.id)}
                className="p-1.5 rounded-full text-[#737370] hover:text-[#C92A2A] hover:bg-[#FEECEC] disabled:opacity-50"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Tasks</h1>
        <p className="text-sm text-[#737370]">
          Your personal agency checklist — imports, callbacks, and follow-ups.
        </p>
      </div>

      <form onSubmit={handleAdd} className="crm-card p-4 flex flex-wrap gap-3">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Import Lucknow clinic leads"
          className="flex-1 min-w-[220px] bg-[#F9F9F7] border border-[#E2E2DC] rounded-full px-4 py-2.5 text-sm"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="bg-[#F9F9F7] border border-[#E2E2DC] rounded-full px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="btn-pill-dark px-5 py-2.5 text-sm inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {adding ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {adding ? "Adding..." : "Add Task"}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {renderGroup("To Do", todoTasks)}
        {renderGroup("Pending / Overdue", overdueTasks, "overdue")}
        {renderGroup("Done", doneTasks, "done")}
      </div>
    </div>
  );
}
