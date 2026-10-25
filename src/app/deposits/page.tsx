"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { Deposit, Reservation } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Receipt,
  Search,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Deposit Action Modals
  const [activeDeposit, setActiveDeposit] = useState<Deposit | null>(null);
  const [actionType, setActionType] = useState<"collect" | "deduct" | "refund" | null>(null);
  const [actionAmount, setActionAmount] = useState(0);
  const [actionReason, setActionReason] = useState("");
  const [actionError, setActionError] = useState("");

  const refreshData = () => {
    setDeposits(atlasStore.getDeposits());
    setReservations(atlasStore.getReservations());
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const totalRequired = deposits.reduce((sum, d) => sum + d.required_amount, 0);
  const totalHeld = deposits.reduce((sum, d) => sum + d.held_amount, 0);
  const totalDeducted = deposits.reduce((sum, d) => sum + d.deducted_amount, 0);
  const totalRefunded = deposits.reduce((sum, d) => sum + d.refunded_amount, 0);

  const handleOpenAction = (deposit: Deposit, type: "collect" | "deduct" | "refund") => {
    setActiveDeposit(deposit);
    setActionType(type);
    setActionError("");
    if (type === "collect") {
      setActionAmount(Math.max(0, deposit.required_amount - deposit.collected_amount));
      setActionReason("Pre-authorization hold secured on client card");
    } else if (type === "refund") {
      setActionAmount(deposit.held_amount);
      setActionReason("Standard post-rental return release after clean vehicle inspection");
    } else {
      setActionAmount(50);
      setActionReason("Deduction for missing fuel / minor exterior scratch");
    }
  };

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeposit || actionAmount <= 0) return;
    setActionError("");

    try {
      if (actionType === "collect") {
        atlasStore.collectDeposit(activeDeposit.id, actionAmount);
      } else if (actionType === "refund") {
        atlasStore.refundDeposit(activeDeposit.id, actionAmount, actionReason);
      } else if (actionType === "deduct") {
        // Partial or full deduction
        if (actionAmount > activeDeposit.held_amount) {
          throw new Error(`Deduction cannot exceed currently held deposit ($${activeDeposit.held_amount}).`);
        }
        activeDeposit.held_amount -= actionAmount;
        activeDeposit.deducted_amount += actionAmount;
        activeDeposit.status = activeDeposit.held_amount === 0 ? "fully_deducted" : "partially_deducted";
        activeDeposit.notes = actionReason;
        atlasStore.logAudit("deposit.deduct", "deposit", activeDeposit.id, null, { actionAmount, actionReason });
      }
      refreshData();
      setActiveDeposit(null);
      setActionType(null);
    } catch (err: any) {
      setActionError(err.message || "Failed to process deposit operation.");
    }
  };

  const filtered = deposits.filter((d) => {
    const term = searchTerm.toLowerCase();
    const res = reservations.find((r) => r.id === d.reservation_id);
    const matchesSearch =
      d.customer?.full_name.toLowerCase().includes(term) ||
      res?.reference.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Refundable Security Deposits
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Segregated liability tracking for pre-authorizations, deduction claims, and bank releases
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Currently Held
          </span>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {formatCurrency(totalHeld, agency.default_currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Segregated client liability</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Required Booked Deposits
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalRequired, agency.default_currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Mandatory fleet guarantee</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Deductions Retained
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(totalDeducted, agency.default_currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Retained for damage / late fees</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Released / Refunded
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalRefunded, agency.default_currency)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Returned to clients</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search booking ref, customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {["all", "collected", "pending", "partially_deducted", "refunded"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold capitalize transition-all",
                statusFilter === st
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Booking Reference</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Required</th>
                <th className="py-3.5 px-4 text-right">Collected</th>
                <th className="py-3.5 px-4 text-right">Currently Held</th>
                <th className="py-3.5 px-4 text-right">Deducted</th>
                <th className="py-3.5 px-4 text-right">Refunded</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((d) => {
                const res = reservations.find((r) => r.id === d.reservation_id);

                return (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <span className="text-brand-600 font-extrabold">{res?.reference}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {res?.vehicle?.year} {res?.vehicle?.make} {res?.vehicle?.model}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {d.customer?.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{d.customer?.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium">
                      {formatCurrency(d.required_amount, agency.default_currency)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(d.collected_amount, agency.default_currency)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-purple-600">
                      {formatCurrency(d.held_amount, agency.default_currency)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(d.deducted_amount, agency.default_currency)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(d.refunded_amount, agency.default_currency)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={d.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {d.status === "pending" && (
                        <button
                          onClick={() => handleOpenAction(d, "collect")}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg"
                        >
                          Hold Deposit
                        </button>
                      )}

                      {d.held_amount > 0 && (
                        <>
                          <button
                            onClick={() => handleOpenAction(d, "deduct")}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg"
                            title="Deduct for damage or late charges"
                          >
                            Deduct
                          </button>
                          <button
                            onClick={() => handleOpenAction(d, "refund")}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg"
                            title="Release refund"
                          >
                            Refund
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {activeDeposit && actionType && (
        <Modal
          isOpen={!!activeDeposit}
          onClose={() => {
            setActiveDeposit(null);
            setActionType(null);
          }}
          title={
            actionType === "collect"
              ? "Collect & Hold Security Deposit"
              : actionType === "refund"
              ? "Process Deposit Release / Refund"
              : "Deduct Charges from Deposit"
          }
          description={`Customer: ${activeDeposit.customer?.full_name} · Held Balance: ${formatCurrency(activeDeposit.held_amount, agency.default_currency)}`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteAction} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                {actionError}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={actionAmount}
                onChange={(e) => setActionAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-base"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Documented Reason / Audit Note *
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Document reason for deduction or refund authorization..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setActiveDeposit(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(
                  "px-5 py-2 text-white font-bold rounded-xl shadow-sm",
                  actionType === "deduct"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : actionType === "refund"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-purple-600 hover:bg-purple-500"
                )}
              >
                Confirm {actionType.toUpperCase()}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
