"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { X, Mail, Lock, Shield, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRegister?: boolean;
}

export default function AuthModal({ isOpen, onClose, defaultRegister = false }: AuthModalProps) {
  const { login, register } = useAppStore();
  const [isRegister, setIsRegister] = useState(defaultRegister);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRegister(defaultRegister);
      setError("");
      setEmail("");
      setPassword("");
      setName("");
    }
  }, [isOpen, defaultRegister]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
      // Reset form states
      setEmail("");
      setPassword("");
      setName("");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md select-none animate-fade-in p-4">
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative scrollbar-none">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-card-hover transition cursor-pointer"
          aria-label="Close authentication modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand/Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-black font-bold text-lg mx-auto">
            L
          </div>
          <h2 className="text-lg font-bold text-text-primary">
            {isRegister ? "Create your account" : "Sign in to LocaLead"}
          </h2>
          <p className="text-xs text-text-muted">
            {isRegister 
              ? "Discover premium local leads instantly" 
              : "Enter credentials to access search engine"}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div className="space-y-1.5">
              <label htmlFor="auth-name" className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Full Name</label>
              <input
                type="text"
                id="auth-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-3.5 w-3.5 text-text-muted" />
              <input
                type="email"
                id="auth-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@localead or you@example.com"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-3.5 w-3.5 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                id="auth-password"
                required={email.toLowerCase() === "admin@localead" || isRegister}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-10 py-2.5 text-xs text-text-primary placeholder-text-dark focus:outline-none focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-text-muted hover:text-text-primary cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
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
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isRegister ? "Create Account" : "Access Workspace"}</span>
            )}
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-text-muted hover:text-primary transition text-xs font-semibold cursor-pointer"
          >
            {isRegister 
              ? "Already have an account? Sign In" 
              : "Don't have an account yet? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
