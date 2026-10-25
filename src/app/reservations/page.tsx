"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { Reservation, ReservationStatus } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { generateContractPdf } from "@/lib/pdf/generator";
import { exportReservationsToCsv, downloadCsvFile } from "@/lib/csv/importer";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  FileCheck2,
  Car,
  Users,
  CreditCard,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Detail Modal
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [cancelModalRes, setCancelModalRes] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const refreshData = () => {
    setReservations(atlasStore.getReservations());
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleStatusChange = (resId: string, newStatus: ReservationStatus, reason?: string) => {
    atlasStore.updateReservationStatus(resId, newStatus, reason);
    refreshData();
    if (selectedRes && selectedRes.id === resId) {
      setSelectedRes(atlasStore.getReservationById(resId) || null);
    }
  };

  const handleDownloadContract = (res: Reservation) => {
    const doc = generateContractPdf(res, agency);
    doc.save(`Atlas_Contract_${res.reference}.pdf`);
  };

  const handleExportCsv = () => {
    const csv = exportReservationsToCsv(reservations);
    downloadCsvFile(csv, `atlas_reservations_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const filtered = reservations.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.reference.toLowerCase().includes(term) ||
      r.customer?.full_name.toLowerCase().includes(term) ||
      r.vehicle?.make.toLowerCase().includes(term) ||
      r.vehicle?.model.toLowerCase().includes(term) ||
      r.vehicle?.registration_number.toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Rentals & Fleet Reservations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Authoritative fleet allocation, turnover control, and active contracts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link
            href="/reservations/new"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + New Reservation
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search booking ref, customer, car..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: "all", label: "All Bookings" },
            { id: "confirmed", label: "Confirmed" },
            { id: "checked_out", label: "Checked Out" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all",
                statusFilter === st.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vehicle Allocated</th>
                <th className="py-3.5 px-4">Rental Itinerary</th>
                <th className="py-3.5 px-4 text-right">Total Price</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No reservations found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="text-brand-600 font-extrabold">{r.reference}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Created {formatDate(r.created_at, "MMM dd")}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.customer?.full_name || "Guest Customer"}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {r.customer?.email}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Reg: {r.vehicle?.registration_number} · {r.vehicle?.color}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {formatDate(r.pickup_datetime, "MMM dd, HH:mm")} →{" "}
                        {formatDate(r.return_datetime, "MMM dd, HH:mm")}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.rental_days} Day(s) ({r.pickup_location})
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(r.total_amount, agency.default_currency)}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium">
                        Paid: {formatCurrency(r.amount_paid, agency.default_currency)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge status={r.status} />
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedRes(r)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Full Booking Breakdown"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDownloadContract(r)}
                        className="p-1.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
                        title="Download Rental Agreement PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {r.status === "confirmed" && (
                        <Link
                          href={`/inspections?tab=handover&resId=${r.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] hover:bg-emerald-100 transition-colors"
                        >
                          Check Out
                        </Link>
                      )}

                      {r.status === "checked_out" && (
                        <Link
                          href={`/inspections?tab=return&resId=${r.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px] hover:bg-blue-100 transition-colors"
                        >
                          Check In
                        </Link>
                      )}

                      {r.status === "confirmed" && (
                        <button
                          onClick={() => {
                            setCancelModalRes(r);
                            setCancelReason("");
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Cancel Reservation"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reservation Details Drawer Modal */}
      {selectedRes && (
        <Modal
          isOpen={!!selectedRes}
          onClose={() => setSelectedRes(null)}
          title={`Booking Details (${selectedRes.reference})`}
          description={`Customer: ${selectedRes.customer?.full_name} · Status: ${selectedRes.status}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Quick Status Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
              <div>
                <span className="text-slate-400 block text-[11px]">Current Status</span>
                <span className="font-bold text-sm uppercase text-slate-900 dark:text-white">
                  {selectedRes.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadContract(selectedRes)}
                  className="px-3 py-1.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-500 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Contract PDF
                </button>
              </div>
            </div>

            {/* Vehicle & Customer Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Allocated Vehicle
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedRes.vehicle?.year} {selectedRes.vehicle?.make} {selectedRes.vehicle?.model}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Reg: {selectedRes.vehicle?.registration_number} · Color: {selectedRes.vehicle?.color}
                </p>
                <p className="text-slate-500">
                  VIN: {selectedRes.vehicle?.vin}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Customer & Driver
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedRes.customer?.full_name}
                </p>
                <p className="text-slate-500 mt-0.5">{selectedRes.customer?.email}</p>
                <p className="text-slate-500">{selectedRes.customer?.phone}</p>
              </div>
            </div>

            {/* Financial Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border space-y-2">
              <span className="font-bold text-slate-400 uppercase text-[10px] block">
                Itemized Billing Summary
              </span>
              <div className="flex justify-between">
                <span>Base Vehicle Rental ({selectedRes.rental_days} Days @ {formatCurrency(selectedRes.daily_rate, agency.default_currency)})</span>
                <strong>{formatCurrency(selectedRes.base_rental_amount, agency.default_currency)}</strong>
              </div>
              {selectedRes.extras_amount > 0 && (
                <div className="flex justify-between">
                  <span>Ancillary Extras</span>
                  <strong>{formatCurrency(selectedRes.extras_amount, agency.default_currency)}</strong>
                </div>
              )}
              {selectedRes.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span>Location Delivery Fee</span>
                  <strong>{formatCurrency(selectedRes.delivery_fee, agency.default_currency)}</strong>
                </div>
              )}
              {selectedRes.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Applied Discount</span>
                  <strong>-{formatCurrency(selectedRes.discount_amount, agency.default_currency)}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax ({agency.tax_rate}%)</span>
                <strong>{formatCurrency(selectedRes.tax_amount, agency.default_currency)}</strong>
              </div>
              <div className="pt-2 border-t flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>Total Contract Amount</span>
                <span>{formatCurrency(selectedRes.total_amount, agency.default_currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Amount Paid</span>
                <span>{formatCurrency(selectedRes.amount_paid, agency.default_currency)}</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>Refundable Deposit Held</span>
                <span>{formatCurrency(selectedRes.deposit_amount, agency.default_currency)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {cancelModalRes && (
        <Modal
          isOpen={!!cancelModalRes}
          onClose={() => setCancelModalRes(null)}
          title={`Cancel Reservation ${cancelModalRes.reference}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to cancel this booking? The allocated vehicle ({cancelModalRes.vehicle?.make} {cancelModalRes.vehicle?.model}) will immediately be returned to available fleet.
            </p>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Flight cancelled by customer / Change of travel plans"
                rows={3}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalRes(null)}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  handleStatusChange(cancelModalRes.id, "cancelled", cancelReason);
                  setCancelModalRes(null);
                }}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
