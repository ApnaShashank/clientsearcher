import Link from "next/link";
import {
  ArrowRight,
  Layers,
  PhoneCall,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111] flex flex-col">
      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#FF5C1C] text-white font-bold text-base flex items-center justify-center">
            C
          </div>
          <span className="font-bold text-lg tracking-tight">
            Creightweb Calling CRM
          </span>
        </div>

        <Link
          href="/login"
          className="btn-pill-dark px-6 py-2.5 text-sm inline-flex items-center gap-2"
        >
          <span>Login</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 pt-8 pb-16 space-y-14">
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EBEBE7] text-xs font-semibold text-[#737370]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF5C1C]" />
            <span>Built for Website-Selling Agencies</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-[#111111]">
            Assign local leads. Call in one tap. Close more websites.
          </h1>

          <p className="text-base sm:text-lg text-[#737370] max-w-2xl mx-auto">
            A calm, mobile-first Calling CRM for Creightweb. Admin imports and
            schedules daily batches; telecallers open their phone and call
            straight through with zero clutter.
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              className="btn-pill-orange px-8 py-3.5 text-base inline-flex items-center gap-2 shadow-[0_8px_24px_rgba(255,92,28,0.28)]"
            >
              <span>Login to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* 3 Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="crm-card p-6 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF0EA] text-[#FF5C1C] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Smart lead assignment</h2>
            <p className="text-sm text-[#737370] leading-relaxed">
              Filter unassigned leads by city, area, and category. Schedule
              tomorrow&apos;s batch with exact visibility time and duplicate
              phone protection.
            </p>
          </div>

          <div className="crm-card p-6 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#111111] text-white flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">One-tap calling</h2>
            <p className="text-sm text-[#737370] leading-relaxed">
              Callers see one lead at a time on their phone with a Hinglish
              pitch hint, thumb-sized Call &amp; WhatsApp buttons, and one-tap
              outcomes.
            </p>
          </div>

          <div className="crm-card p-6 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E6F9EE] text-[#12804A] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Full tracking</h2>
            <p className="text-sm text-[#737370] leading-relaxed">
              Every call attempt, callback, and lead recycle is logged. Export
              daily caller PDFs and agency-wide CSV, Excel, or PDF reports.
            </p>
          </div>
        </section>

        {/* Dashboard Preview Mock */}
        <section className="crm-card p-5 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EBEBE7] pb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#FF5C1C]">
                Live Agency Preview
              </div>
              <h3 className="text-lg font-bold mt-0.5">
                Creightweb Admin &amp; Caller Workspace
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[#F5F5F3] text-[#737370] font-medium">
              Desktop Admin · 390px Mobile Caller
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Admin Mock */}
            <div className="lg:col-span-8 bg-[#F9F9F7] rounded-3xl p-5 border border-[#EBEBE7] space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl p-3.5 border border-[#EBEBE7]">
                  <div className="text-[11px] text-[#737370]">Total Leads</div>
                  <div className="text-2xl font-bold mt-1">1,420</div>
                </div>
                <div className="bg-[#FF5C1C] text-white rounded-2xl p-3.5">
                  <div className="text-[11px] text-white/85">Calls Today</div>
                  <div className="text-2xl font-bold mt-1">148</div>
                </div>
                <div className="bg-white rounded-2xl p-3.5 border border-[#EBEBE7]">
                  <div className="text-[11px] text-[#737370]">Interested</div>
                  <div className="text-2xl font-bold text-[#12804A] mt-1">
                    29
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-3.5 border border-[#EBEBE7]">
                  <div className="text-[11px] text-[#737370]">Won Month</div>
                  <div className="text-2xl font-bold mt-1">12</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EBEBE7] space-y-2.5">
                <div className="text-xs font-bold">Today&apos;s Caller Queue</div>
                {[
                  { name: "Priya Verma", city: "Lucknow", done: "34 / 40", int: 8 },
                  { name: "Aman Yadav", city: "Azamgarh", done: "28 / 40", int: 6 },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between text-xs py-1.5 border-b last:border-0 border-[#F2F2EE]"
                  >
                    <span className="font-semibold">
                      {row.name}{" "}
                      <span className="font-normal text-[#737370]">
                        · {row.city}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#737370]">{row.done}</span>
                      <span className="font-bold text-[#FF5C1C]">
                        {row.int} interested
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Caller Mock */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 border-2 border-[#111111] space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">12 of 40 done today</span>
                <span className="text-[#FF5C1C] font-bold">30%</span>
              </div>
              <div className="h-2 bg-[#F2F2EE] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#FF5C1C] rounded-full" />
              </div>
              <div className="pt-1">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#F5F5F3] text-[#737370]">
                  Restaurant
                </span>
                <div className="text-base font-bold mt-1">
                  Royal Spice Kitchen
                </div>
                <div className="text-xs text-[#737370]">
                  Gomti Nagar, Lucknow
                </div>
              </div>
              <div className="bg-[#FFF0EA] rounded-2xl p-2.5 text-[11px] font-medium">
                No website hai · Instagram active hai → New Website + Social Media pitch karo
              </div>
              <div className="btn-pill-orange py-2.5 text-center text-xs font-bold">
                CALL NOW
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#12804A] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>One-tap outcomes &amp; auto-advance</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl w-full mx-auto px-5 py-6 border-t border-[#EBEBE7] flex items-center justify-between text-xs text-[#737370]">
        <span>© {new Date().getFullYear()} Creightweb Agency CRM</span>
        <Link href="/login" className="font-semibold text-[#111111] hover:underline">
          Agency Login
        </Link>
      </footer>
    </div>
  );
}
