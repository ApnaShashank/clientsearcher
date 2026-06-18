"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useMounted } from "@/hooks/useMounted";
import { 
  Award, Wallet, Clock, AlertCircle, CheckCircle2, Upload, FileText, Image as ImageIcon, X
} from "lucide-react";

export default function RewardsDashboard() {
  const mounted = useMounted();
  const { 
    currentUser, forwardedLeads, fetchForwardedLeads, submitWithdrawalRequest 
  } = useAppStore();

  const [qrCodeFile, setQrCodeFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (mounted) {
      fetchForwardedLeads();
      const interval = setInterval(() => {
        fetchForwardedLeads();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchForwardedLeads]);

  if (!mounted || !currentUser) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-card rounded-xl border border-border" />
          ))}
        </div>
        <div className="h-64 bg-card rounded-xl border border-border" />
      </div>
    );
  }

  // Filter leads forwarded by this user (email or ID match)
  const myForwarded = forwardedLeads.filter(
    lead => lead.forwardedBy === currentUser.id || lead.forwardedBy.toLowerCase() === currentUser.email.toLowerCase()
  );

  const totalWon = currentUser.totalEarnings || 0;
  const pendingBalance = currentUser.pendingEarnings || 0;
  const withdrawalStatus = currentUser.withdrawalStatus || "None";

  // Base64 file reader for QR code
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodeFile(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!qrCodeFile) {
      alert("Please upload your UPI QR Code image first!");
      return;
    }
    try {
      await submitWithdrawalRequest(currentUser.id, qrCodeFile);
      setQrCodeFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Under Review":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            Under Review (चेक हो रहा है)
          </span>
        );
      case "In Talk with Client":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">
            Client Talk (बात चल रही है)
          </span>
        );
      case "Approved":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            Approved (सफल हुआ - 500 Rs Won)
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            Rejected (कैंसिल हुआ)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/25">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in font-sans">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card p-5 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Operator Commissions & Rewards Portal</h2>
            <p className="text-xs text-text-muted mt-0.5">Leads forward karein, client final hone par 500 Rs reward paayein!</p>
          </div>
        </div>
        <div className="text-[11px] font-bold font-mono bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full">
          Standard commission: ₹500 per approved client
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Won */}
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Total Earnings Won</span>
            <p className="text-2xl font-extrabold text-emerald-400">₹{totalWon}</p>
            <p className="text-[10px] text-text-muted">Approved leads ka total reward bonus</p>
          </div>
          <Award className="h-10 w-10 text-emerald-500/15 shrink-0" />
        </div>

        {/* Pending Balance */}
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Withdrawal Balance</span>
            <p className="text-2xl font-extrabold text-primary">₹{pendingBalance}</p>
            <p className="text-[10px] text-text-muted">Amount available to request payout</p>
          </div>
          <Wallet className="h-10 w-10 text-primary/15 shrink-0" />
        </div>

        {/* Withdrawal Status */}
        <div className="bg-card border border-border p-5 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Payout Request Status</span>
            <div className="mt-1 flex items-center gap-1.5">
              {withdrawalStatus === "None" && (
                <span className="text-sm font-bold text-text-muted">No Active Request</span>
              )}
              {withdrawalStatus === "Pending" && (
                <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5 animate-pulse">
                  <Clock className="h-4 w-4" /> Pending Payout
                </span>
              )}
              {withdrawalStatus === "Paid" && (
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Paid (सफल)
                </span>
              )}
            </div>
            <p className="text-[10px] text-text-muted">Latest withdrawal request process details</p>
          </div>
          <Clock className="h-10 w-10 text-text-muted/10 shrink-0" />
        </div>
      </div>

      {/* Main Grid: Withdrawal Flow & Forwarded Leads List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Withdrawal Section */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="border-b border-border/50 pb-2.5">
              <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">UPI Withdrawal Request (पैसे निकालें)</h3>
            </div>

            {/* Paid State */}
            {withdrawalStatus === "Paid" && currentUser.paymentReceiptUrl && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4.5 space-y-3.5 animate-fade-in text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>Aapka payment safalta purvak transfer ho gaya hai!</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Admin ne payment karke niche transaction receipt attach kar di hai. Please verify kijiye:
                </p>
                <div className="border border-border/60 rounded-lg overflow-hidden bg-background p-2 flex flex-col items-center gap-2">
                  <img 
                    src={currentUser.paymentReceiptUrl} 
                    alt="Payment Receipt" 
                    className="max-h-48 object-contain rounded-md"
                  />
                  <span className="text-[10px] text-text-muted font-mono">Receipt Screenshot Attached by Admin</span>
                </div>
                <p className="text-[10px] text-text-dark italic select-none">
                  Naye rewards add hone par yah section automatic reset ho jayega. Keep searching!
                </p>
              </div>
            )}

            {/* Pending State */}
            {withdrawalStatus === "Pending" && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4.5 space-y-3.5 animate-fade-in text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Clock className="h-4.5 w-4.5 animate-pulse" />
                  <span>Request Sent! Payment Pending.</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Aapki UPI payout request admin ko bhej di gayi hai. Admin manually payment karke receipt yahan upload karenge.
                </p>
                {currentUser.qrCodeUrl && (
                  <div className="border border-border/60 rounded-lg bg-background/50 p-2 flex flex-col items-center gap-1.5">
                    <img 
                      src={currentUser.qrCodeUrl} 
                      alt="Uploaded QR Code" 
                      className="max-h-36 object-contain rounded-md"
                    />
                    <span className="text-[9px] text-text-muted font-mono">Your Uploaded QR Code</span>
                  </div>
                )}
              </div>
            )}

            {/* Request Payout Form */}
            {withdrawalStatus === "None" && (
              <>
                {pendingBalance === 0 ? (
                  <div className="text-center py-10 text-xs text-text-muted select-none leading-relaxed flex flex-col items-center gap-2">
                    <AlertCircle className="h-7 w-7 text-text-dark" />
                    <p>Aapke paas abhi withdraw karne ke liye koi balance nahi hai.</p>
                    <p className="text-[11px] text-text-dark max-w-[280px]">
                      Search page par jaakar leads save karein aur unhe <strong>Forward</strong> karein. Jab admin client se deal final kar lenge tab ₹500 reward milega.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in text-xs">
                    <p className="text-text-muted leading-relaxed">
                      Aapke paas <strong className="text-text-primary">₹{pendingBalance}</strong> pending balance hai. Ise bank me transfer karne ke liye apna QR Code upload karein.
                    </p>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">Upload QR Code Screenshot *</label>
                      
                      <div className="border border-dashed border-border/80 hover:border-primary/50 transition-all rounded-lg p-5 text-center relative bg-card/25 group cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleQrUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Clock className="h-5 w-5 text-primary animate-spin" />
                            <span className="text-[11px] text-text-muted animate-pulse">Scanning QR image...</span>
                          </div>
                        ) : qrCodeFile ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <ImageIcon className="h-6 w-6 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">QR Screenshot Selected!</span>
                            <span className="text-[10px] text-text-muted font-mono truncate max-w-[200px]">Click or drag to change image</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <Upload className="h-6 w-6 text-text-muted group-hover:text-primary transition" />
                            <span className="text-xs font-bold text-text-primary">Click to select UPI QR image</span>
                            <span className="text-[9px] text-text-muted">PhonePe, GPay, Paytm QR screenshots supported</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {qrCodeFile && (
                      <div className="border border-border/60 rounded-lg p-2.5 bg-background flex flex-col items-center gap-2 animate-fade-in">
                        <img 
                          src={qrCodeFile} 
                          alt="QR Preview" 
                          className="max-h-40 object-contain rounded-md"
                        />
                        <button 
                          onClick={() => setQrCodeFile(null)} 
                          className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <X className="h-3 w-3" /> Remove image
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleRequestWithdrawal}
                      disabled={!qrCodeFile}
                      className="w-full btn-primary py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Wallet className="h-4 w-4 text-[#0c0c0d]" />
                      <span>Request ₹{pendingBalance} Payout</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Forwarded Leads List */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-card border border-border rounded-xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <h3 className="font-bold text-text-primary text-xs uppercase tracking-wider">My Forwarded Leads (मेरे फॉरवर्ड किये हुए लीड्स)</h3>
              <span className="text-[10px] bg-border px-2.5 py-1 rounded-full text-text-primary font-bold font-mono">
                {myForwarded.length} leads
              </span>
            </div>

            {myForwarded.length === 0 ? (
              <div className="text-center py-20 text-xs text-text-muted italic select-none leading-relaxed">
                <FileText className="h-8 w-8 text-text-dark mx-auto mb-2" />
                <p>Aapne abhi tak koi lead forward nahi ki hai.</p>
                <p className="text-[11px] text-text-dark mt-1">
                  Saved leads (CRM) me jaakar client lead ka status <strong>Forwarded</strong> set karein!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {myForwarded.map((lead) => (
                  <div 
                    key={lead.id} 
                    className="bg-background border border-border hover:border-border/80 transition rounded-xl p-4 space-y-3 text-xs"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/15">
                          {lead.category}
                        </span>
                        <h4 className="font-bold text-text-primary text-xs leading-snug mt-1">{lead.businessName}</h4>
                      </div>
                      <div className="shrink-0">{getStatusBadge(lead.status)}</div>
                    </div>

                    {/* Meta Parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-muted">
                      <div>
                        <strong className="text-text-primary font-bold">Address:</strong> {lead.address}
                      </div>
                      <div>
                        <strong className="text-text-primary font-bold">Phone:</strong> {lead.phoneNumber || "N/A"}
                      </div>
                      <div className="sm:col-span-2">
                        <strong className="text-text-primary font-bold">Forwarded On:</strong> {new Date(lead.forwardedAt).toLocaleDateString([], { dateStyle: 'medium' })}
                      </div>
                    </div>

                    {/* Admin notes feedback */}
                    {lead.notes && (
                      <div className="bg-card p-2.5 rounded-lg border border-border/80 text-[11px] leading-relaxed">
                        <strong className="text-text-primary font-bold block mb-1">Admin Response / Comments:</strong>
                        <p className="text-text-muted italic">"{lead.notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
