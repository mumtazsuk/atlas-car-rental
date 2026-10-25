"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { Invoice, Payment, Customer, Reservation } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/pdf/generator";
import {
  CreditCard,
  Plus,
  Search,
  Download,
  FileText,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());
  const [activeTab, setActiveTab] = useState<"invoices" | "transactions">("invoices");
  const [searchTerm, setSearchTerm] = useState("");

  // Record Payment Modal
  const [isRecordModal, setIsRecordModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<any>("card");
  const [payType, setPayType] = useState<any>("rental_fee");
  const [payNotes, setPayNotes] = useState("");

  const refreshData = () => {
    setInvoices(atlasStore.getInvoices());
    setPayments(atlasStore.getPayments());
    setCustomers(atlasStore.getCustomers());
    setReservations(atlasStore.getReservations());
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenRecordPayment = (inv?: Invoice) => {
    if (inv) {
      setSelectedInvoiceId(inv.id);
      setPayAmount(Math.max(0, inv.total_amount - inv.paid_amount));
    } else {
      setSelectedInvoiceId("");
      setPayAmount(0);
    }
    setIsRecordModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    const custId = inv?.customer_id || customers[0]?.id;

    atlasStore.recordPayment({
      invoice_id: selectedInvoiceId || undefined,
      reservation_id: inv?.reservation_id,
      customer_id: custId,
      amount: payAmount,
      payment_method: payMethod,
      transaction_type: payType,
      notes: payNotes,
    });

    refreshData();
    setIsRecordModal(false);
  };

  const handleDownloadInvoicePdf = (invoice: Invoice) => {
    const doc = generateInvoicePdf(invoice, agency);
    doc.save(`Atlas_Invoice_${invoice.invoice_number}.pdf`);
  };

  const filteredInvoices = invoices.filter((i) => {
    const term = searchTerm.toLowerCase();
    return (
      i.invoice_number.toLowerCase().includes(term) ||
      i.customer?.full_name.toLowerCase().includes(term)
    );
  });

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.reference.toLowerCase().includes(term) ||
      p.customer?.full_name.toLowerCase().includes(term) ||
      p.payment_method.toLowerCase().includes(term)
    );
  });

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Invoices, Billing & Payments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Itemized tax invoices, cash collections, multi-gateway transactions, and payment receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenRecordPayment()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Record Payment
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "invoices"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Tax Invoices ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "transactions"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Payment Ledger ({payments.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search invoice #, payment ref, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
          />
        </div>
      </div>

      {/* INVOICES TABLE */}
      {activeTab === "invoices" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Billed To</th>
                  <th className="py-3.5 px-4">Issue & Due Date</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">Tax ({agency.tax_rate}%)</th>
                  <th className="py-3.5 px-4 text-right">Total Invoiced</th>
                  <th className="py-3.5 px-4 text-right">Paid to Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.map((inv) => {
                  const balanceDue = inv.total_amount - inv.paid_amount;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoice_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {inv.customer?.full_name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400">{inv.customer?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div>Issue: {inv.issue_date}</div>
                        <div className="text-[11px] text-slate-400">Due: {inv.due_date}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium">
                        {formatCurrency(inv.subtotal, agency.default_currency)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium">
                        {formatCurrency(inv.tax_amount, agency.default_currency)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(inv.total_amount, agency.default_currency)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(inv.paid_amount, agency.default_currency)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge status={inv.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {balanceDue > 0 && (
                          <button
                            onClick={() => handleOpenRecordPayment(inv)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg transition-colors"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadInvoicePdf(inv)}
                          className="px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRANSACTIONS TABLE */}
      {activeTab === "transactions" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="py-3.5 px-4">Payment Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Transaction Type</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.reference}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {p.customer?.full_name || "Customer"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(p.payment_date, "MMM dd, yyyy HH:mm")}
                    </td>

                    <td className="py-3.5 px-4 capitalize font-medium text-slate-700 dark:text-slate-300">
                      {p.transaction_type.replace("_", " ")}
                    </td>

                    <td className="py-3.5 px-4 uppercase font-bold text-slate-600 dark:text-slate-400">
                      {p.payment_method}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {p.recorded_by || "System"}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(p.amount, p.currency)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordModal && (
        <Modal
          isOpen={isRecordModal}
          onClose={() => setIsRecordModal(false)}
          title="Record Payment Transaction"
          description="Log electronic card charge, bank wire receipt, or cash POS settlement."
          maxWidth="md"
        >
          <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Link to Invoice (Optional)
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  const inv = invoices.find((i) => i.id === e.target.value);
                  if (inv) setPayAmount(Math.max(0, inv.total_amount - inv.paid_amount));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              >
                <option value="">-- Standalone Transaction / No Invoice --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} · {inv.customer?.full_name} (Due: {formatCurrency(inv.total_amount - inv.paid_amount, agency.default_currency)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash (Office POS)</option>
                  <option value="bank_transfer">Bank Wire Transfer</option>
                  <option value="online_stripe">Stripe Online Portal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Type
              </label>
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              >
                <option value="rental_fee">Vehicle Rental Charge</option>
                <option value="late_fee">Late Return Fee</option>
                <option value="damage">Damage Settlement</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Internal Notes & Reference
              </label>
              <textarea
                placeholder="Auth code, check number, transaction notes..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsRecordModal(false)}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-sm"
              >
                Save Payment Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
