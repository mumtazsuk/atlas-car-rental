"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { atlasStore } from "@/lib/db/store";
import { Agency } from "@/types";
import {
  Settings,
  Building,
  Save,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Fuel,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function AgencySettingsPage() {
  const [agency, setAgency] = useState<Agency>(atlasStore.getAgency());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [name, setName] = useState(agency.name);
  const [email, setEmail] = useState(agency.email);
  const [phone, setPhone] = useState(agency.phone || "");
  const [address, setAddress] = useState(agency.address || "");
  const [currency, setCurrency] = useState(agency.default_currency);
  const [taxRate, setTaxRate] = useState(agency.tax_rate);
  const [invoicePrefix, setInvoicePrefix] = useState(agency.invoice_prefix);
  const [contractPrefix, setContractPrefix] = useState(agency.contract_prefix);
  const [logoUrl, setLogoUrl] = useState(agency.logo_url || "");
  const [publicBooking, setPublicBooking] = useState(agency.is_public_booking_enabled);

  useEffect(() => {
    const a = atlasStore.getAgency();
    setAgency(a);
    setName(a.name);
    setEmail(a.email);
    setPhone(a.phone || "");
    setAddress(a.address || "");
    setCurrency(a.default_currency);
    setTaxRate(a.tax_rate);
    setInvoicePrefix(a.invoice_prefix);
    setContractPrefix(a.contract_prefix);
    setLogoUrl(a.logo_url || "");
    setPublicBooking(a.is_public_booking_enabled);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = atlasStore.updateAgency({
      name,
      email,
      phone,
      address,
      default_currency: currency,
      tax_rate: taxRate,
      invoice_prefix: invoicePrefix,
      contract_prefix: contractPrefix,
      logo_url: logoUrl,
      is_public_booking_enabled: publicBooking,
    });
    setAgency(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleResetDemoData = () => {
    if (confirm("Reset local store to verified initial demo dataset? All temporary modifications will be restored to defaults.")) {
      atlasStore.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Agency Settings & Rental Policies
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure business identity, tax rates, invoice numbering, and rental rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDemoData}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Demo Dataset
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Agency settings successfully updated and persisted across platform!
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-600" />
            Legal Business Entity & Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company / Agency Trade Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Business Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Business Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Operating Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Depot & Headquarter Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Agency Logo Image URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Financial & Document Numbering */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Financial Rates & Document Numbering
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Standard Sales Tax / VAT (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contract Number Prefix
              </label>
              <input
                type="text"
                value={contractPrefix}
                onChange={(e) => setContractPrefix(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl uppercase font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Agency Settings
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
