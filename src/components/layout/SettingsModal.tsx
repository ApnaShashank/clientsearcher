"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { X, User, Lock, Shield, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { currentUser, updateCurrentUser } = useAppStore();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name);
      setPassword("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!name.trim()) {
        setError("Name cannot be empty");
        setLoading(false);
        return;
      }
      
      // Update name & password in store
      await updateCurrentUser(name, password || undefined);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md select-none animate-fade-in p-4">
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative scrollbar-none font-sans">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-card-hover transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-text-primary">
            Account Profile Settings
          </h2>
          <p className="text-xs text-text-muted">
            Update your account details. Administrator will be notified of alterations.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 stroke-[3]" />
            <span>Account settings updated successfully!</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Account Email</label>
            <input
              type="email"
              disabled
              value={currentUser.email}
              className="w-full bg-[#161616] border border-border/40 rounded-lg px-3 py-2.5 text-xs text-text-muted cursor-not-allowed select-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">New Password (Optional)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-3.5 w-3.5 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Leave blank to keep current)"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary rounded-lg py-2.5 font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading ? (
              <>
                <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Saving Settings...</span>
              </>
            ) : (
              <span>Save Account Settings</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
