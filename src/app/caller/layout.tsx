"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CallerShell } from "@/components/caller/CallerShell";
import { PublicUser } from "@/types/crm";
import {
  Clock,
  Download,
  LogOut,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function CallerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (!active) return;
        if (data.user?.role === "admin") {
          router.replace("/admin");
          return;
        }
        if (data.user?.role !== "caller") {
          router.replace("/login");
          return;
        }
        const u: PublicUser = data.user;
        setUser(u);
        setChecking(false);

        if (
          u.approvalStatus === "Pending" &&
          !u.agreementSigned &&
          pathname !== "/caller/agreement"
        ) {
          router.replace("/caller/agreement");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [router, pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch("/api/caller/agreement/pdf");
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `creightweb-agreement-${user?.username || "caller"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Signed Agreement PDF downloaded");
    } catch {
      toast.error("Could not download PDF");
    } finally {
      setDownloading(false);
    }
  }

  if (checking || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F3]">
        <div className="crm-card px-6 py-4 text-sm text-[#737370]">
          Loading your Creightweb panel...
        </div>
      </div>
    );
  }

  // Allow agreement page when Pending
  if (pathname === "/caller/agreement") {
    return (
      <div className="min-h-screen bg-[#F5F5F3] px-4 py-4">{children}</div>
    );
  }

  // Pending Verification Status Screen (no leads, no calling tabs)
  if (user.approvalStatus === "Pending") {
    const waMsg = `I am ${user.name}, I have signed the Creightweb caller agreement. Please verify and approve my account.`;
    const waHref = `https://wa.me/918808108802?text=${encodeURIComponent(waMsg)}`;
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center p-4">
        <div className="max-w-md w-full crm-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF7E6] text-[#B86B00] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <button
              onClick={handleLogout}
              className="btn-pill-light px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          <div>
            <h1 className="text-xl font-bold">Verification Pending</h1>
            <p className="text-xs sm:text-sm text-[#737370] mt-1 leading-relaxed">
              Your profile and signed agreement have been submitted. Creightweb
              Admin will verify and approve your account soon.
            </p>
          </div>

          <div className="bg-[#F9F9F7] rounded-2xl p-4 text-xs space-y-1.5">
            <div>
              <strong>Name:</strong> {user.name} (@{user.username})
            </div>
            <div>
              <strong>Mobile:</strong> {user.phone}
            </div>
            <div>
              <strong>City / Area:</strong>{" "}
              {user.preferredCallCityArea || user.homeCity}
            </div>
            <div>
              <strong>Agreement:</strong>{" "}
              <span className="text-[#12804A] font-semibold">
                Signed{" "}
                {user.agreementSignedAt
                  ? `(${new Date(user.agreementSignedAt).toLocaleDateString("en-IN")})`
                  : ""}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPdf}
              className="w-full btn-pill-dark py-3 text-xs inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {downloading ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download Signed Agreement PDF</span>
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-pill-orange py-3 text-xs inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Verification (8808108802)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Rejected Status Screen
  if (user.approvalStatus === "Rejected") {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center p-4">
        <div className="max-w-md w-full crm-card p-6 sm:p-8 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FEECEC] text-[#C92A2A] flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Application Not Approved</h1>
          <p className="text-xs sm:text-sm text-[#737370]">
            {user.rejectionReason ||
              "Your caller application was not approved by Creightweb."}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <a
              href="https://wa.me/918808108802"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill-light px-4 py-2 text-xs"
            >
              Contact 8808108802
            </a>
            <button
              onClick={handleLogout}
              className="btn-pill-dark px-4 py-2 text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <CallerShell user={user}>{children}</CallerShell>;
}
