"use client";

import React, { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { useToast } from "./Toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function DownloadAppButton({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const toast = useToast();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("Creightweb CRM installed!");
      }
      setDeferredPrompt(null);
      return;
    }
    setShowInstructions(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        title="Download App"
        className={
          className ||
          "btn-pill-light px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        {!compact && <span>Download App</span>}
      </button>

      {showInstructions && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="crm-card p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FFF0EA] text-[#FF5C1C] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold">Install Creightweb App</h3>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1.5 rounded-full hover:bg-[#F5F5F3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#737370] leading-relaxed">
              Install this CRM directly on your phone or laptop for fast,
              app-like access:
            </p>
            <div className="bg-[#F9F9F7] rounded-2xl p-4 text-xs space-y-2 text-[#111111]">
              <div>
                <strong>Android (Chrome):</strong> Browser menu (⋮) →{" "}
                <em>Install app</em> / <em>Add to Home Screen</em>
              </div>
              <div>
                <strong>iPhone (Safari):</strong> Share button (↑) →{" "}
                <em>Add to Home Screen</em>
              </div>
              <div>
                <strong>Laptop (Chrome / Edge):</strong> Address bar install icon
                → <em>Install</em>
              </div>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full btn-pill-dark py-2.5 text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
