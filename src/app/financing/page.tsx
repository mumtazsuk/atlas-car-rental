"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { VehicleFinancing, Vehicle } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Layers,
  Plus,
  DollarSign,
  Calendar,
  Building,
  Car,
  TrendingDown,
  Clock,
} from "lucide-react";

export default function FinancingPage() {
  const [financing, setFinancing] = useState<VehicleFinancing[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());

  // Add Loan Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [lenderName, setLenderName] = useState("");
  const [loanRef, setLoanRef] = useState("");
  const [principal, setPrincipal] = useState(50000);
  const [downPayment, setDownPayment] = useState(10000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [installmentAmount, setInstallmentAmount] = useState(950);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [maturityDate, setMaturityDate] = useState("2028-12-31");

  const refreshData = () => {
    setFinancing(atlasStore.getFinancing());
    setVehicles(atlasStore.getVehicles());
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const totalOutstanding = financing.reduce((sum, f) => sum + f.outstanding_balance, 0);
  const totalMonthlyCommitment = financing.reduce((sum, f) => sum + f.installment_amount, 0);

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !lenderName || principal <= 0) return;

    atlasStore.createFinancing({
      vehicle_id: vehicleId,
      lender_name: lenderName,
      loan_reference: loanRef || `LN-${Date.now()}`,
      principal_amount: principal,
      down_payment: downPayment,
      interest_rate: interestRate,
      start_date: startDate,
      maturity_date: maturityDate,
      payment_frequency: "monthly",
      installment_amount: installmentAmount,
      outstanding_balance: principal - downPayment,
    });

    refreshData();
    setIsModalOpen(false);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Vehicle Financing & Fleet Debt
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track commercial auto loans, lease-to-own balances, interest amortization, and monthly debt schedules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Register Loan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Outstanding Principal
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(totalOutstanding, agency.default_currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Remaining fleet debt balance</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Monthly Debt Installments
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalMonthlyCommitment, agency.default_currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total scheduled monthly debits</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Financed Vehicles
          </span>
          <div className="text-2xl font-black text-brand-600 mt-1">
            {financing.length} Vehicles
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Owned under active lien</p>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Lender / Bank</th>
                <th className="py-3.5 px-4">Loan Reference</th>
                <th className="py-3.5 px-4 text-right">Principal</th>
                <th className="py-3.5 px-4 text-right">Interest Rate</th>
                <th className="py-3.5 px-4 text-right">Monthly Payment</th>
                <th className="py-3.5 px-4 text-right">Remaining Balance</th>
                <th className="py-3.5 px-4">Maturity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {financing.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {f.vehicle?.year} {f.vehicle?.make} {f.vehicle?.model}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Reg: {f.vehicle?.registration_number}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {f.lender_name}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-brand-600 font-bold">
                    {f.loan_reference}
                  </td>

                  <td className="py-3.5 px-4 text-right font-medium">
                    {formatCurrency(f.principal_amount, agency.default_currency)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                    {f.interest_rate}% APR
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(f.installment_amount, agency.default_currency)}/mo
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-rose-600">
                    {formatCurrency(f.outstanding_balance, agency.default_currency)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">
                    {f.maturity_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Loan Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register Vehicle Financing Loan"
          description="Log financing institution terms, interest rate, and installment schedule."
          maxWidth="md"
        >
          <form onSubmit={handleCreateLoan} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Financed Vehicle *
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                required
              >
                <option value="">-- Choose vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model} ({v.registration_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lender / Finance Company *
                </label>
                <input
                  type="text"
                  placeholder="e.g. JPMorgan Chase Auto"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Loan Reference #
                </label>
                <input
                  type="text"
                  placeholder="CHASE-LN-882194"
                  value={loanRef}
                  onChange={(e) => setLoanRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Principal Amount ($) *
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Down Payment ($)
                </label>
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Interest Rate (% APR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Installment ($) *
                </label>
                <input
                  type="number"
                  value={installmentAmount}
                  onChange={(e) => setInstallmentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maturity Date
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-sm"
              >
                Register Debt Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
