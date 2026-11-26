"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, User } from "lucide-react";
import { Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Login failed";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${data.user?.name || "User"}!`);
      if (data.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/caller");
      }
    } catch {
      const msg = "Network error. Please try again.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md crm-card p-7 sm:p-9">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C1C] flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111111]">
              Creightweb CRM
            </h1>
            <p className="text-xs text-[#737370]">
              Sign in with your agency credentials
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#737370] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or caller username"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#111111] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#737370] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#737370] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#111111] focus:bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="bg-[#FEECEC] text-[#C92A2A] text-xs font-medium px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pill-dark py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#EBEBE7] flex items-center justify-between text-xs text-[#737370]">
          <span>No self sign-up. Accounts created by Admin.</span>
          <Link href="/" className="text-[#111111] font-medium hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
