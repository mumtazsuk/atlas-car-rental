"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { RentalContract, Reservation } from "@/types";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { generateContractPdf } from "@/lib/pdf/generator";
import {
  FileCheck2,
  Download,
  PenTool,
  RotateCcw,
  CheckCircle2,
  FileText,
  Search,
  Lock,
} from "lucide-react";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());
  const [searchTerm, setSearchTerm] = useState("");

  // Signature Modal State
  const [activeSignContract, setActiveSignContract] = useState<RentalContract | null>(null);
  const [signerRole, setSignerRole] = useState<"customer" | "staff">("customer");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const refreshData = () => {
    const res = atlasStore.getReservations();
    setReservations(res);
    // Make sure contracts exist for bookings
    res.forEach((r) => {
      atlasStore.generateContract(r.id);
    });
    setContracts(atlasStore.getReservations().map((r) => atlasStore.getContractByReservationId(r.id)).filter(Boolean) as RentalContract[]);
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDownloadPdf = (contract: RentalContract) => {
    const res = atlasStore.getReservationById(contract.reservation_id);
    if (!res) return;
    const doc = generateContractPdf(res, agency);
    doc.save(`Atlas_Contract_${contract.contract_number}.pdf`);
  };

  // Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0F172A";
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveSignature = () => {
    if (!activeSignContract || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    atlasStore.signContract(activeSignContract.id, signerRole, dataUrl);
    refreshData();
    setActiveSignContract(null);
  };

  const filteredContracts = contracts.filter((c) => {
    const res = reservations.find((r) => r.id === c.reservation_id);
    const term = searchTerm.toLowerCase();
    return (
      c.contract_number.toLowerCase().includes(term) ||
      res?.reference.toLowerCase().includes(term) ||
      res?.customer?.full_name.toLowerCase().includes(term)
    );
  });

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Rental Agreements & Digital Signatures
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Version-controlled legal contracts, terms acknowledgement, and verified digital signatures
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search contract #, booking ref, renter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Contracts: <strong>{contracts.length}</strong>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Contract #</th>
                <th className="py-3.5 px-4">Reservation Ref</th>
                <th className="py-3.5 px-4">Customer Renter</th>
                <th className="py-3.5 px-4">Vehicle Details</th>
                <th className="py-3.5 px-4">Signatures</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredContracts.map((c) => {
                const res = reservations.find((r) => r.id === c.reservation_id);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {c.contract_number}
                      <span className="text-[10px] text-slate-400 block font-normal font-sans">
                        Version {c.version}.0
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-brand-600 block">
                        {res?.reference}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(c.created_at, "MMM dd, yyyy")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {res?.customer?.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{res?.customer?.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {res?.vehicle?.year} {res?.vehicle?.make} {res?.vehicle?.model}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Reg: {res?.vehicle?.registration_number}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", c.customer_signed_at ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                          Client: {c.customer_signed_at ? "Signed" : "Pending"}
                        </span>
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", c.staff_signed_at ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                          Staff: {c.staff_signed_at ? "Signed" : "Pending"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={c.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setActiveSignContract(c);
                          setSignerRole(c.customer_signed_at ? "staff" : "customer");
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                      >
                        <PenTool className="w-3.5 h-3.5" /> Sign
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(c)}
                        className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-600 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Capture Modal */}
      {activeSignContract && (
        <Modal
          isOpen={!!activeSignContract}
          onClose={() => setActiveSignContract(null)}
          title={`Digital Signature Capture (${activeSignContract.contract_number})`}
          description="Draw digital signature using mouse, touchpad, or stylus for electronic acknowledgement."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Signer Role:</span>
              <button
                onClick={() => setSignerRole("customer")}
                className={cn("px-3 py-1 rounded-lg font-bold", signerRole === "customer" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600")}
              >
                Customer / Renter
              </button>
              <button
                onClick={() => setSignerRole("staff")}
                className={cn("px-3 py-1 rounded-lg font-bold", signerRole === "staff" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600")}
              >
                Fleet Representative
              </button>
            </div>

            {/* Drawing Canvas */}
            <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={420}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full cursor-crosshair touch-none bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={clearCanvas}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Signature
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSignContract(null)}
                  className="px-3.5 py-1.5 text-slate-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSignature}
                  className="px-5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
