"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Eraser,
  MessageCircle,
  PenTool,
} from "lucide-react";
import { Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { PublicUser } from "@/types/crm";

const CLAUSES = [
  {
    title: "1. Role & Daily Responsibility",
    en: "Call assigned businesses from the Creightweb app and honestly update every call's outcome.",
    hi: "App me diye gaye businesses ko call karna aur har call ka sahi outcome update karna.",
  },
  {
    title: "2. Salary & Performance Incentives",
    en: "Monthly salary is ₹15,000–₹20,000 based on role/experience, plus performance incentives for interested leads, meetings, and closed clients.",
    hi: "Role aur experience ke hisab se ₹15,000–₹20,000 mahina salary + ache kaam par extra incentive.",
  },
  {
    title: "3. Zero Cash / Payment Collection Policy",
    en: "You will NEVER collect any money, advance, or payment from any client. All payments go directly to Creightweb (Shashank Gupta). Taking money from a client is fraud and ends the agreement immediately.",
    hi: "Client se kabhi bhi koi paisa ya advance nahi lena hai. Saara payment seedha Creightweb ko hoga.",
  },
  {
    title: "4. Data Confidentiality & Ownership",
    en: "Lead data is Creightweb's property: never share, sell, copy, or use it for personal or anyone else's work — during or after the job.",
    hi: "Leads aur client data Creightweb ki property hai — isse kabhi kisi ke saath share ya use nahi karna hai.",
  },
  {
    title: "5. Daily Honesty & Reporting",
    en: "Real outcomes only, no fake updates; daily report submission is mandatory.",
    hi: "Sirf sach aur asli call updates daalne hain; koi fake entry nahi aur roz report deni hai.",
  },
  {
    title: "6. Termination & Notice",
    en: "Creightweb may end the association anytime for fraud, data misuse, or repeated absence; the caller may leave with prior notice.",
    hi: "Fraud, data misuse ya lagatar absence par Creightweb agreement khatam kar sakta hai; caller notice dekar chhod sakta hai.",
  },
];

export default function CallerAgreementPage() {
  const router = useRouter();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [signedFullName, setSignedFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setSignedFullName(d.user.name || "");
        }
      })
      .catch(() => {});
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111111";
    setDrawing(true);
    setHasDrawn(true);
  }

  function moveDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() {
    setDrawing(false);
  }

  function clearPad() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!hasDrawn) {
      toast.error("Please draw your signature on the pad.");
      return;
    }
    if (!signedFullName.trim()) {
      toast.error("Please type your full name.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL("image/png");

    setSaving(true);
    try {
      const res = await fetch("/api/caller/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedFullName: signedFullName.trim(),
          signatureDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save agreement");
        return;
      }
      setUser(data.user);
      toast.success("Agreement signed! Download PDF & send on WhatsApp.");
    } catch {
      toast.error("Network error while saving agreement");
    } finally {
      setSaving(false);
    }
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

  const waMessage = `I am ${user?.name || signedFullName}, I have signed the Creightweb caller agreement. Please verify and approve my account.`;
  const waHref = `https://wa.me/918808108802?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div className="crm-card p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
            Step 2 of 2 · Digital Agreement
          </span>
          <h1 className="text-2xl font-bold mt-1">
            Creightweb Caller Agreement
          </h1>
          <p className="text-xs sm:text-sm text-[#737370] mt-1">
            Please read every clause carefully and sign below to submit your
            account for verification.
          </p>
        </div>

        <div className="space-y-3">
          {CLAUSES.map((c) => (
            <div
              key={c.title}
              className="bg-[#F9F9F7] border border-[#EBEBE7] rounded-2xl p-4 space-y-1"
            >
              <h2 className="text-sm font-bold text-[#111111]">{c.title}</h2>
              <p className="text-xs sm:text-sm text-[#111111] leading-relaxed">
                {c.en}
              </p>
              <p className="text-xs text-[#FF5C1C] font-medium">
                Hindi: {c.hi}
              </p>
            </div>
          ))}
        </div>

        {user?.agreementSigned ? (
          <div className="bg-[#E6F9EE] border border-[#C3EBD3] rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-[#12804A] font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                Agreement Signed on{" "}
                {user.agreementSignedAt
                  ? new Date(user.agreementSignedAt).toLocaleString("en-IN")
                  : "just now"}
              </span>
            </div>
            <p className="text-xs text-[#111111]">
              Download your signed PDF below and send it on WhatsApp to{" "}
              <strong>8808108802</strong> for verification &amp; approval.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadPdf}
                className="btn-pill-dark py-3 text-xs inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {downloading ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {downloading
                    ? "Downloading..."
                    : "Download Signed Agreement PDF"}
                </span>
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-orange py-3 text-xs inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send on WhatsApp (8808108802)</span>
              </a>
            </div>
            <button
              type="button"
              onClick={() => router.push("/caller")}
              className="w-full btn-pill-light py-2.5 text-xs font-semibold"
            >
              Go to Verification Status Screen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSign} className="space-y-4 pt-2 border-t border-[#EBEBE7]">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#111111] inline-flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#FF5C1C]" />
                  Draw Signature (Finger / Mouse) *
                </label>
                <button
                  type="button"
                  onClick={clearPad}
                  className="text-xs text-[#737370] hover:text-[#111111] inline-flex items-center gap-1"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={520}
                height={150}
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={endDraw}
                className="w-full h-36 bg-[#F9F9F7] border-2 border-dashed border-[#D8D8D2] rounded-2xl touch-none cursor-crosshair"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#737370] mb-1">
                Type Your Full Name to Confirm *
              </label>
              <input
                required
                value={signedFullName}
                onChange={(e) => setSignedFullName(e.target.value)}
                placeholder="Type your full name"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-pill-dark py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Spinner className="w-4 h-4" />
                  <span>Signing &amp; Saving...</span>
                </>
              ) : (
                <span>Sign &amp; Submit Agreement</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
