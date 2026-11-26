"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  PhoneCall,
  IndianRupee,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Sparkles,
  FileCheck2,
  HelpCircle,
  MessageCircle,
  Mail,
} from "lucide-react";
import { ShowcaseItem } from "@/types/crm";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface PublicData {
  showcase: ShowcaseItem[];
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    instagramUrl: string;
    facebookUrl: string;
    linkedinUrl: string;
    otherSocials: string;
  };
}

export default function LandingPage() {
  const { data } = useQuery<PublicData>({
    queryKey: ["public-showcase"],
    queryFn: async () => (await fetch("/api/public/showcase")).json(),
    staleTime: 60_000,
  });

  const showcase = data?.showcase || [];
  const contact = data?.contact || {
    phone: "8808108802",
    whatsapp: "8808108802",
    email: "shashank8808108802@gmail.com",
    instagramUrl: "",
    facebookUrl: "",
    linkedinUrl: "",
    otherSocials: "",
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-[#F5F5F3]/90 backdrop-blur-md border-b border-[#EBEBE7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="md" />
            <span className="font-bold text-base sm:text-lg tracking-tight">
              Creightweb
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="btn-pill-light px-4 py-2 text-xs sm:text-sm"
            >
              Login
            </Link>
            <Link
              href="/apply"
              className="btn-pill-dark px-4 sm:px-5 py-2 text-xs sm:text-sm inline-flex items-center gap-1.5"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-14">
        {/* 1. Hero — centered hero-caller.png at reduced opacity behind hero text & buttons */}
        <section className="relative overflow-hidden py-10 sm:py-16 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <Image
              src="/illustrations/hero-caller.png"
              alt="Creightweb remote telecaller working from home with headset and phone"
              width={1200}
              height={700}
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
              className="w-full max-w-3xl h-auto opacity-20 dark:opacity-15 object-contain"
            />
          </div>

          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-[#EBEBE7] text-xs font-semibold text-[#111111]">
              <IndianRupee className="w-3.5 h-3.5 text-[#FF5C1C]" />
              <span>₹15,000 – ₹20,000 / month + Performance Incentives</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
              Work From Home — Calling Job
            </h1>

            <p className="text-base sm:text-lg text-[#737370] max-w-2xl mx-auto leading-relaxed">
              Join Creightweb as a Remote Telecaller. Call local businesses from
              your smartphone using our simple CRM app, pitch websites, and
              earn a fixed monthly salary plus incentives.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/apply"
                className="btn-pill-orange px-8 py-4 text-base inline-flex items-center gap-2 shadow-[0_8px_24px_rgba(255,92,28,0.28)]"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="btn-pill-light px-6 py-4 text-sm font-semibold"
              >
                Already Registered? Login
              </Link>
            </div>
          </div>
        </section>

        {/* 2. About Creightweb — text left & about-businesses.png right inside the same card */}
        <section className="crm-card p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
              About Creightweb
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">
              We build websites for local Indian businesses.
            </h2>
            <p className="text-sm sm:text-base text-[#737370] leading-relaxed">
              Creightweb helps restaurants, clinics, hospitals, salons, gyms,
              coaching institutes, and local shops go online with modern,
              affordable websites, digital menus, Google Business setups, and
              social media. Our telecallers connect with business owners over
              the phone and help them see how a professional website brings
              more customers.
            </p>
          </div>
          <div className="lg:col-span-6">
            <Image
              src="/illustrations/about-businesses.png"
              alt="Local restaurant, dental clinic, and salon connected to a modern website"
              width={1200}
              height={700}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full h-auto max-w-lg mx-auto"
            />
          </div>
        </section>

        {/* 3. What you will do — daily-work-app.jpg reveals on hovering the cards */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
              Daily Work
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">
              What you will do
            </h2>
            <p className="text-sm text-[#737370] mt-1 max-w-md">
              Simple, guided daily calling directly from your phone — no
              complicated spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Daily Calling from App",
                desc: "Open the Creightweb app on your phone, see your daily leads with a ready pitch hint, and tap Call Now.",
                icon: PhoneCall,
              },
              {
                title: "One-Tap Outcomes",
                desc: "After every call, tap the honest outcome (Interested, Callback, Not Interested, etc.) in one tap.",
                icon: CheckCircle2,
              },
              {
                title: "Follow-ups",
                desc: "Call back interested owners on their scheduled date from your Follow-ups tab.",
                icon: Sparkles,
              },
              {
                title: "Daily PDF Report",
                desc: "Download your daily work summary PDF in one click and share it on WhatsApp.",
                icon: FileCheck2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative crm-card p-5 space-y-2.5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF5C1C]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF0EA] text-[#FF5C1C] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-[#737370] leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="pointer-events-none absolute inset-0 bg-[#FFFFFF]/95 dark:bg-[#18181B]/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-3">
                    <Image
                      src="/illustrations/daily-work-app.jpg"
                      alt="Smartphone with Creightweb calling app and one-tap call button"
                      width={600}
                      height={600}
                      sizes="220px"
                      className="w-40 h-auto rounded-2xl shadow-md"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. What you get — prominent salary card beside salary-growth.png */}
        <section className="space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
              Benefits
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">What you get</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-3xl p-6 bg-[#FF5C1C] text-white space-y-2 shadow-[0_8px_24px_rgba(255,92,28,0.25)]">
                <div className="text-xs font-bold uppercase tracking-wider text-white/85">
                  Fixed Monthly Pay
                </div>
                <h3 className="font-bold text-2xl">
                  ₹15,000 – ₹20,000 / month
                </h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  Fixed monthly salary based on your role and experience, plus
                  performance incentives for interested leads, fixed meetings,
                  and closed clients.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="crm-card p-5 space-y-1.5">
                  <h3 className="font-bold text-base">Performance Incentives</h3>
                  <p className="text-xs sm:text-sm text-[#737370]">
                    Earn extra money for interested leads, meetings, and closed
                    clients.
                  </p>
                </div>
                <div className="crm-card p-5 space-y-1.5">
                  <h3 className="font-bold text-base">100% Work From Home</h3>
                  <p className="text-xs sm:text-sm text-[#737370]">
                    Work comfortably from home with your smartphone and internet.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <Image
                src="/illustrations/salary-growth.png"
                alt="Growing earnings chart, calendar, and monthly salary coins"
                width={1200}
                height={700}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-auto max-w-lg mx-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Ready-Made Business Leads",
                desc: "No searching needed — verified local business numbers are delivered to your app daily.",
              },
              {
                title: "Demo Websites & Portfolio",
                desc: "Show live Creightweb websites to clients right from your phone during the call.",
              },
              {
                title: "Full Training & Pricing Guide",
                desc: "Step-by-step video training and clear rate cards so you always know what to say.",
              },
            ].map((b) => (
              <div key={b.title} className="crm-card p-5 space-y-1.5">
                <h3 className="font-bold text-base">{b.title}</h3>
                <p className="text-xs sm:text-sm text-[#737370] leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Our Work (Dynamic Showcase) */}
        <section className="space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
              Portfolio
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">Our Work</h2>
          </div>
          {showcase.length === 0 ? (
            <div className="crm-card p-8 text-center text-sm text-[#737370]">
              Our latest client websites and live demos are showcased inside the
              Creightweb panel.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {showcase.map((item) => (
                <div
                  key={item.id}
                  className="crm-card overflow-hidden flex flex-col justify-between"
                >
                  {item.previewImage && (
                    <div className="aspect-video bg-[#F9F9F7] overflow-hidden border-b border-[#EBEBE7]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewImage}
                        alt={item.businessName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                      {item.logoImage && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.logoImage}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-[#EBEBE7] shrink-0"
                        />
                      )}
                      <div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F5F3] text-[#737370]">
                          {item.category}
                        </span>
                        <h3 className="font-bold text-base mt-1">
                          {item.businessName}
                        </h3>
                        <p className="text-xs text-[#737370]">{item.title}</p>
                      </div>
                    </div>
                    <a
                      href={item.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-pill-light w-full py-2 text-xs inline-flex items-center justify-center gap-1.5"
                    >
                      <span>View Live Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. Who can apply */}
        <section className="crm-card p-6 sm:p-8 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
              Eligibility
            </span>
            <h2 className="text-2xl font-bold mt-1">
              Who can apply? (No degree required)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Smartphone,
                text: "Smartphone + reliable internet connection",
              },
              {
                icon: PhoneCall,
                text: "Clear Hindi / Hinglish speaking confidence",
              },
              {
                icon: CheckCircle2,
                text: "Basic smartphone & WhatsApp skills",
              },
              {
                icon: ShieldCheck,
                text: "Honest, punctual & regular in daily work",
              },
            ].map((req) => {
              const Icon = req.icon;
              return (
                <div
                  key={req.text}
                  className="bg-[#F9F9F7] rounded-2xl p-4 flex items-start gap-3"
                >
                  <Icon className="w-5 h-5 text-[#FF5C1C] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{req.text}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. How it works — full-width thin strip directly ABOVE the 4 step cards */}
        <section className="space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">
              Onboarding Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">
              How it works
            </h2>
          </div>

          <div className="w-full">
            <Image
              src="/illustrations/steps-journey.png"
              alt="4-step onboarding journey from application to starting work"
              width={1400}
              height={420}
              sizes="100vw"
              className="w-full h-auto"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Apply & fill details",
                desc: "Create your username, password, and enter your profile & ID proof.",
              },
              {
                step: "02",
                title: "Sign Agreement",
                desc: "Read the simple English + Hindi agreement and sign digitally on screen.",
              },
              {
                step: "03",
                title: "Verification & Approval",
                desc: "Send your signed PDF on WhatsApp; Creightweb verifies and approves your account.",
              },
              {
                step: "04",
                title: "Start Calling",
                desc: "Log in to your approved caller panel, watch the training video, and start calling.",
              },
            ].map((s) => (
              <div key={s.step} className="crm-card p-5 space-y-2">
                <div className="text-xs font-bold text-[#FF5C1C]">
                  STEP {s.step}
                </div>
                <h3 className="font-bold text-base">{s.title}</h3>
                <p className="text-xs sm:text-sm text-[#737370]">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. FAQ */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#FF5C1C]" />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                q: "Is any registration fee or security deposit charged?",
                a: "NO. Joining Creightweb is 100% free. Never pay anyone for this job.",
              },
              {
                q: "When and how is salary paid?",
                a: "Salary ₹15,000–₹20,000 + performance incentives are paid monthly directly to your bank/UPI.",
              },
              {
                q: "What are the work hours?",
                a: "Flexible daytime calling hours (typically 10 AM – 6 PM) when local businesses are open.",
              },
              {
                q: "What if I have no prior calling experience?",
                a: "Freshers are welcome! Our Guide tab has a training video, pricing rules, and exact pitch hints for every lead.",
              },
            ].map((f) => (
              <div key={f.q} className="crm-card p-5 space-y-1.5">
                <h3 className="font-bold text-sm sm:text-base">{f.q}</h3>
                <p className="text-xs sm:text-sm text-[#737370] leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 9. Final CTA Black Banner — text + button left, transparent illustration right */}
        <section className="bg-[#111111] text-white rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Ready to start earning from home?
            </h2>
            <p className="text-sm sm:text-base text-white/75 max-w-xl mx-auto lg:mx-0">
              Takes 3 minutes to apply and sign the digital agreement. Zero
              fees, verified leads, and monthly salary + incentives.
            </p>
            <div>
              <Link
                href="/apply"
                className="btn-pill-orange px-8 py-3.5 text-sm inline-flex items-center gap-2"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Image
              src="/illustrations/cta-success.png"
              alt="Happy Creightweb caller celebrating approval"
              width={1200}
              height={700}
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="w-full h-auto max-w-sm mx-auto"
            />
          </div>
        </section>
      </main>

      {/* Contact Footer */}
      <footer className="bg-white border-t border-[#EBEBE7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-base">Creightweb Agency</div>
            <p className="text-xs text-[#737370] mt-0.5">
              Websites &amp; Digital Growth for Local Businesses
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="btn-pill-light px-3.5 py-2 inline-flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#FF5C1C]" />
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.whatsapp && (
              <a
                href={`https://wa.me/91${contact.whatsapp.replace(/\D/g, "").slice(-10)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-light px-3.5 py-2 inline-flex items-center gap-1.5 text-[#12804A]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="btn-pill-light px-3.5 py-2 inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{contact.email}</span>
              </a>
            )}
            {contact.instagramUrl && (
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#737370] hover:text-[#111111] font-medium"
              >
                Instagram
              </a>
            )}
            {contact.facebookUrl && (
              <a
                href={contact.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#737370] hover:text-[#111111] font-medium"
              >
                Facebook
              </a>
            )}
            {contact.linkedinUrl && (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#737370] hover:text-[#111111] font-medium"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
