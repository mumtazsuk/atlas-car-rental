"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { initialSubscriptionPlans } from "@/lib/db/mock-data";
import { atlasStore } from "@/lib/db/store";
import {
  Sparkles,
  CheckCircle,
  CreditCard,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function SubscriptionBillingPage() {
  const [currentPlanSlug, setCurrentPlanSlug] = useState("professional");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [successMsg, setSuccessMsg] = useState("");
  const agency = atlasStore.getAgency();

  const handleSelectPlan = (slug: string) => {
    setCurrentPlanSlug(slug);
    setSuccessMsg(`Successfully upgraded agency plan to ${slug.toUpperCase()}! Limits expanded.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              SaaS Subscription & Fleet Tier Limits
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-700 border border-brand-300">
              PRO TIER ACTIVE
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage multi-tenant software subscription, vehicle limits, and Stripe payment methods
          </p>
        </div>

        {/* Monthly / Annual Toggle */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              billingCycle === "monthly" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              billingCycle === "annual" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
            }`}
          >
            Annual Billing
            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-1 py-0.2 rounded">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {initialSubscriptionPlans.map((plan) => {
          const isCurrent = currentPlanSlug === plan.slug;
          const price = billingCycle === "monthly" ? plan.monthly_price : Math.round(plan.annual_price / 12);

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                isCurrent
                  ? "bg-white dark:bg-slate-900 border-2 border-brand-500 shadow-premium relative ring-2 ring-brand-500/20"
                  : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-6 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Current Agency Tier
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    ${price}
                  </span>
                  <span className="text-xs text-slate-500">/month</span>
                </div>

                <div className="mt-2 text-xs font-semibold text-brand-600">
                  Fleet limit: {plan.max_vehicles} vehicles · {plan.max_staff} staff seats
                </div>

                <div className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleSelectPlan(plan.slug)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isCurrent
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default"
                      : "bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                  }`}
                >
                  {isCurrent ? "Active Tier" : "Upgrade Plan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stripe Payment Method & Invoicing Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Stripe Customer Portal & Billing Method
            </h4>
            <p className="text-slate-500 mt-0.5">
              Securely update payment card ending in 4102 or download SaaS subscription tax invoices.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert("Stripe Billing Portal simulation: In production, redirects to Stripe Customer Portal session.")}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-1.5 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Manage Stripe Billing
        </button>
      </div>
    </AppLayout>
  );
}
