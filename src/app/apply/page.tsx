"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Spinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function ApplyPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [villageArea, setVillageArea] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [preferredCallCityArea, setPreferredCallCityArea] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [currentOccupation, setCurrentOccupation] = useState("");
  const [languagesSpoken, setLanguagesSpoken] = useState("Hindi, Hinglish");
  const [idProofType, setIdProofType] = useState<"Aadhaar" | "PAN">("Aadhaar");
  const [idProofNumber, setIdProofNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          phone,
          whatsappNumber: whatsappNumber || phone,
          email,
          villageArea,
          city,
          state: stateName,
          pinCode,
          preferredCallCityArea,
          workExperience,
          currentOccupation,
          languagesSpoken: languagesSpoken
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          idProofType,
          idProofNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Registration failed";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      toast.success("Account created! Please sign the agreement next.");
      router.push("/caller/agreement");
    } catch {
      const msg = "Network error. Please try again.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo size="md" />
            <span className="font-bold text-lg">Creightweb</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link href="/login" className="text-xs font-semibold hover:underline">
              Already registered? Login
            </Link>
          </div>
        </div>

        <div className="crm-card p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF5C1C] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Step 1 of 2 · Caller Registration (Free)</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Apply for Creightweb Calling Job
            </h1>
            <p className="text-xs sm:text-sm text-[#737370] mt-1">
              Fill your details honestly. Next, you will digitally sign the
              Creightweb Caller Agreement.
            </p>
          </div>

          {error && (
            <div className="bg-[#FEECEC] text-[#C92A2A] text-xs font-medium px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#737370] mb-1">
                  Full Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#737370] mb-1">
                  Choose Username *
                </label>
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rohit_sharma"
                  className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#737370] mb-1">
                  Create Password *
                </label>
                <input
                  required
                  type="password"
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#737370] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#737370] mb-1">
                  Mobile Number *
                </label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#737370] mb-1">
                  WhatsApp Number
                </label>
                <input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Same as mobile if blank"
                  className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#EBEBE7]">
              <h2 className="text-sm font-bold mb-3">Home Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    Village / Area / Mohalla *
                  </label>
                  <input
                    required
                    value={villageArea}
                    onChange={(e) => setVillageArea(e.target.value)}
                    placeholder="e.g. Civil Lines"
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    City *
                  </label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Azamgarh"
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    State *
                  </label>
                  <input
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    PIN Code *
                  </label>
                  <input
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="6-digit PIN"
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EBEBE7]">
              <h2 className="text-sm font-bold mb-3">
                Work &amp; Verification Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    City / Area you want to call in *
                  </label>
                  <input
                    required
                    value={preferredCallCityArea}
                    onChange={(e) => setPreferredCallCityArea(e.target.value)}
                    placeholder="e.g. Lucknow, Azamgarh"
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    Languages Spoken *
                  </label>
                  <input
                    required
                    value={languagesSpoken}
                    onChange={(e) => setLanguagesSpoken(e.target.value)}
                    placeholder="Hindi, Hinglish, English"
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    What do you currently do?
                  </label>
                  <input
                    value={currentOccupation}
                    onChange={(e) => setCurrentOccupation(e.target.value)}
                    placeholder="e.g. Student / Job / Freelancer"
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    Previous Calling / Job Experience
                  </label>
                  <input
                    value={workExperience}
                    onChange={(e) => setWorkExperience(e.target.value)}
                    placeholder="e.g. Fresher or 1 year telecalling"
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    ID Proof Type *
                  </label>
                  <select
                    value={idProofType}
                    onChange={(e) =>
                      setIdProofType(e.target.value as "Aadhaar" | "PAN")
                    }
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#737370] mb-1">
                    {idProofType} Number *
                  </label>
                  <input
                    required
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                    placeholder={`Enter ${idProofType} number`}
                    className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-pill-dark py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Spinner className="w-4 h-4" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Continue to Agreement</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
