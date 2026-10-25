import React from "react";
import Link from "next/link";
import {
  Car,
  ShieldCheck,
  Zap,
  BarChart3,
  Calendar,
  Compass,
  FileCheck2,
  CheckCircle,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronRight,
  CreditCard,
  Lock,
} from "lucide-react";

export default function MarketingPage() {
  const plans = [
    {
      name: "Starter Fleet",
      price: "$79",
      period: "/month",
      desc: "Ideal for boutique car rental agencies getting started with digital fleet operations.",
      features: [
        "Up to 10 fleet vehicles",
        "Unlimited reservations & customers",
        "Authoritative overlap prevention",
        "Digital contracts & PDF generation",
        "Handover & return inspections",
        "Basic operational reports",
      ],
      highlighted: false,
      cta: "Start 14-Day Free Trial",
    },
    {
      name: "Professional Agency",
      price: "$189",
      period: "/month",
      desc: "For growing rental companies requiring GPS tracking, financing, and advanced team permissions.",
      features: [
        "Up to 35 fleet vehicles",
        "Full Wialon & GPS telemetry simulator",
        "Damage logs & condition photo storage",
        "Vehicle financing & loan amortization",
        "Refundable deposit liability tracking",
        "CSV fleet import & export engine",
        "Role-based access control (RBAC)",
      ],
      highlighted: true,
      cta: "Launch Pro Workspace",
    },
    {
      name: "Enterprise Fleet",
      price: "$399",
      period: "/month",
      desc: "Unlimited multi-branch car rental enterprises with custom branding and priority support.",
      features: [
        "Unlimited fleet vehicles",
        "Unlimited staff & branch locations",
        "Custom white-label branding",
        "Direct Supabase PostgreSQL connection",
        "Automated scheduled cron reminders",
        "Dedicated account manager & SLA",
      ],
      highlighted: false,
      cta: "Contact Enterprise",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Marketing Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center text-white font-black text-lg shadow-md">
            A
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            ATLAS
            <span className="text-[10px] px-1.5 py-0.5 bg-brand-500/20 text-brand-400 font-semibold rounded border border-brand-500/30">
              FLEET ERP
            </span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">
            Core Features
          </a>
          <a href="#workflow" className="hover:text-white transition-colors">
            Booking Engine
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            SaaS Pricing
          </a>
          <Link href="/book" className="hover:text-brand-400 transition-colors flex items-center gap-1">
            <Car className="w-4 h-4" />
            Public Booking Demo
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 transition-all active:scale-95 flex items-center gap-1.5"
          >
            Launch System Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          The Modern Car Rental Management Operating System & SaaS Platform
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Run your entire car rental fleet with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-brand-500 to-indigo-400">precision & confidence</span>.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
          From multi-step reservation wizards with authoritative booking overlap protection to digital PDF contracts, condition photo inspections, and real-time GPS telemetry.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-base font-bold shadow-xl shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Access Live Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/reservations/new"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5 text-brand-400" />
            Try 5-Step Reservation Wizard
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <ShieldCheck className="w-6 h-6 text-brand-400 mb-2" />
            <h4 className="font-bold text-white text-sm">Conflict-Free Booking</h4>
            <p className="text-xs text-slate-400 mt-1">Authoritative PostgreSQL overlap protection ensures zero double-booking.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <FileCheck2 className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-white text-sm">Digital Contracts & PDF</h4>
            <p className="text-xs text-slate-400 mt-1">Instant high-fidelity PDF contracts, digital signatures & tax invoices.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <Compass className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="font-bold text-white text-sm">GPS Vehicle Telemetry</h4>
            <p className="text-xs text-slate-400 mt-1">Live tracking integration with Wialon & interactive telemetry simulator.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <BarChart3 className="w-6 h-6 text-purple-400 mb-2" />
            <h4 className="font-bold text-white text-sm">Real Accounting Analytics</h4>
            <p className="text-xs text-slate-400 mt-1">Track actual collected revenue vs held deposits, expenses, and AR aging.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold tracking-widest uppercase text-brand-400">
            SaaS Subscription Plans
          </h2>
          <h3 className="mt-2 text-3xl sm:text-5xl font-black text-white">
            Transparent pricing for fleets of any scale.
          </h3>
          <p className="mt-4 text-slate-400">
            Deploy as an independent single-agency ERP or offer as a SaaS platform to multiple rental agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 transition-all flex flex-col justify-between ${
                p.highlighted
                  ? "bg-slate-900 border-2 border-brand-500 shadow-2xl shadow-brand-500/10 relative"
                  : "bg-slate-900/50 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {p.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <div>
                <h4 className="text-xl font-bold text-white">{p.name}</h4>
                <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  <span className="text-sm text-slate-400">{p.period}</span>
                </div>

                <div className="mt-8 space-y-3">
                  {p.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <Link
                  href="/dashboard"
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 transition-all ${
                    p.highlighted
                      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30"
                      : "bg-slate-800 hover:bg-slate-700 text-white"
                  }`}
                >
                  {p.cta}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center text-xs">
            A
          </div>
          <span className="font-semibold text-slate-300">Atlas Car Rental Management & SaaS Platform</span>
        </div>
        <div>
          Compatible with Next.js App Router, Supabase PostgreSQL, and Vercel Serverless Hosting.
        </div>
      </footer>
    </div>
  );
}
