"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { Expense, ExpenseCategory, Vehicle } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Fuel,
  Wrench,
  Shield,
  Sparkles,
  Building,
  Car,
  Receipt,
} from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("fuel");
  const [amount, setAmount] = useState(0);
  const [vendor, setVendor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<any>("card");
  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  const refreshData = () => {
    setExpenses(atlasStore.getExpenses());
    setVehicles(atlasStore.getVehicles());
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !vendor) return;

    atlasStore.createExpense({
      expense_number: `EXP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      category,
      amount,
      currency: agency.default_currency,
      date: new Date().toISOString().split("T")[0],
      vendor,
      payment_method: paymentMethod,
      vehicle_id: vehicleId || undefined,
      description,
      receipt_url: receiptUrl || undefined,
      recorded_by: "Finance Staff",
    });

    refreshData();
    setIsModalOpen(false);
    setAmount(0);
    setVendor("");
    setDescription("");
  };

  const filtered = expenses.filter((e) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      e.expense_number.toLowerCase().includes(term) ||
      e.vendor.toLowerCase().includes(term) ||
      e.description.toLowerCase().includes(term);
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Fleet & Operational Expenses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track fuel receipts, maintenance bills, insurance overhead, and detailing costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Record Expense
          </button>
        </div>
      </div>

      {/* KPI & Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Operational Costs
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalExpenses, agency.default_currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">All recorded fleet outlays</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Repairs & Maintenance
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(
              expenses
                .filter((e) => e.category === "repairs" || e.category === "maintenance")
                .reduce((s, e) => s + e.amount, 0),
              agency.default_currency
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Direct mechanical upkeep</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Fleet Fuel Outlays
          </span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {formatCurrency(
              expenses
                .filter((e) => e.category === "fuel")
                .reduce((s, e) => s + e.amount, 0),
              agency.default_currency
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Prepaid & depot refueling</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Insurance & Overhead
          </span>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {formatCurrency(
              expenses
                .filter((e) => e.category === "insurance" || e.category === "office")
                .reduce((s, e) => s + e.amount, 0),
              agency.default_currency
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Fixed policy & facility costs</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search expense #, vendor, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {["all", "fuel", "repairs", "maintenance", "insurance", "cleaning"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold capitalize transition-all",
                categoryFilter === cat
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Expense Ref</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payee / Vendor</th>
                <th className="py-3.5 px-4">Related Vehicle</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {e.expense_number}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="capitalize font-bold text-slate-700 dark:text-slate-300">
                      {e.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{e.vendor}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {e.description}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {e.vehicle ? (
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {e.vehicle.year} {e.vehicle.make} {e.vehicle.model} ({e.vehicle.registration_number})
                      </span>
                    ) : (
                      <span className="text-slate-400">General Fleet Overhead</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDate(e.date, "MMM dd, yyyy")}
                  </td>

                  <td className="py-3.5 px-4 uppercase text-slate-600 dark:text-slate-400">
                    {e.payment_method.replace("_", " ")}
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    {formatCurrency(e.amount, e.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Log Fleet Expense"
          description="Enter vendor invoice, fuel receipt, or maintenance cost."
          maxWidth="md"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl capitalize font-semibold"
                >
                  <option value="fuel">Fuel</option>
                  <option value="repairs">Repairs & Parts</option>
                  <option value="maintenance">Routine Maintenance</option>
                  <option value="insurance">Insurance Premium</option>
                  <option value="cleaning">Detailing & Cleaning</option>
                  <option value="tolls">Tolls & SunPass</option>
                  <option value="parking">Airport Parking</option>
                  <option value="office">Office & Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cost Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor / Payee *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shell, Audi Certified Service, AutoSpa"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Related Vehicle (Optional)
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                >
                  <option value="">-- General Overhead / None --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="card">Company Credit Card</option>
                  <option value="bank_transfer">Bank Wire</option>
                  <option value="cash">Petty Cash</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Description
                </label>
                <textarea
                  placeholder="Details of service, mileage, receipt number..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
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
                Save Expense
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
