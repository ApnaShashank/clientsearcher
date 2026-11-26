"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const value: ToastContextValue = {
    success: useCallback((m) => push("success", m), [push]),
    error: useCallback((m) => push("error", m), [push]),
    info: useCallback((m) => push("info", m), [push]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-20 lg:bottom-5 right-4 left-4 sm:left-auto sm:w-96 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium transition-all ${
              t.type === "success"
                ? "bg-[#111111] text-white border-[#111111]"
                : t.type === "error"
                ? "bg-[#FEECEC] text-[#C92A2A] border-[#F8C8C8]"
                : "bg-white text-[#111111] border-[#EBEBE7]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {t.type === "success" && (
                <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-4 h-4 text-[#C92A2A] shrink-0" />
              )}
              {t.type === "info" && (
                <Info className="w-4 h-4 text-[#FF5C1C] shrink-0" />
              )}
              <span className="truncate">{t.message}</span>
            </div>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== t.id))
              }
              className="opacity-70 hover:opacity-100 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
