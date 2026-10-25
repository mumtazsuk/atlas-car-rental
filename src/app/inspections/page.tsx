"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { Reservation, HandoverInspection, ReturnInspection } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  FileCheck2,
  Car,
  Fuel,
  Gauge,
  Camera,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  Clock,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

function InspectionsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "return" ? "return" : "handover";
  const initialResId = searchParams.get("resId") || "";

  const [activeTab, setActiveTab] = useState<"handover" | "return">(initialTab);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());

  // Handover Form State
  const [selectedHandoverResId, setSelectedHandoverResId] = useState(initialResId);
  const [startOdometer, setStartOdometer] = useState(12450);
  const [startFuel, setStartFuel] = useState("100%");
  const [exteriorCondition, setExteriorCondition] = useState("excellent");
  const [interiorCondition, setInteriorCondition] = useState("clean");
  const [keysCount, setKeysCount] = useState(2);
  const [handoverInspector, setHandoverInspector] = useState("Carlos Mendez (Fleet Lead)");
  const [handoverSuccess, setHandoverSuccess] = useState(false);

  // Return Form State
  const [selectedReturnResId, setSelectedReturnResId] = useState(initialResId);
  const [endOdometer, setEndOdometer] = useState(13200);
  const [endFuel, setEndFuel] = useState("100%");
  const [lateHours, setLateHours] = useState(0);
  const [extraDamageFee, setExtraDamageFee] = useState(0);
  const [cleaningFee, setCleaningFee] = useState(0);
  const [returnInspector, setReturnInspector] = useState("Carlos Mendez");
  const [returnSuccess, setReturnSuccess] = useState(false);

  const refreshData = () => {
    setReservations(atlasStore.getReservations());
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Update odometer when vehicle selection changes
  useEffect(() => {
    if (selectedHandoverResId) {
      const res = reservations.find((r) => r.id === selectedHandoverResId);
      if (res?.vehicle) {
        setStartOdometer(res.vehicle.mileage);
      }
    }
  }, [selectedHandoverResId, reservations]);

  useEffect(() => {
    if (selectedReturnResId) {
      const res = reservations.find((r) => r.id === selectedReturnResId);
      if (res?.vehicle) {
        setEndOdometer(res.vehicle.mileage + 250);
      }
    }
  }, [selectedReturnResId, reservations]);

  const handleCompleteHandover = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find((r) => r.id === selectedHandoverResId);
    if (!res || !res.vehicle) return;

    try {
      atlasStore.recordHandoverInspection({
        reservation_id: res.id,
        vehicle_id: res.vehicle.id,
        pickup_datetime: new Date().toISOString(),
        start_odometer: startOdometer,
        start_fuel_level: startFuel,
        exterior_condition: exteriorCondition,
        interior_condition: interiorCondition,
        existing_damages: [],
        accessories_supplied: ["Spare tire", "Toolkit & Jack", "SunPass Transponder"],
        keys_count: keysCount,
        photos: [res.vehicle.primary_image_url || ""],
        inspected_by: handoverInspector,
        notes: "Departure handover inspection signed and confirmed.",
      });
      setHandoverSuccess(true);
      refreshData();
      setTimeout(() => setHandoverSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to record handover");
    }
  };

  const handleCompleteReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find((r) => r.id === selectedReturnResId);
    if (!res || !res.vehicle) return;

    const totalAdditionalCharges = extraDamageFee + cleaningFee + (lateHours * 25);

    try {
      atlasStore.recordReturnInspection({
        reservation_id: res.id,
        vehicle_id: res.vehicle.id,
        return_datetime: new Date().toISOString(),
        end_odometer: endOdometer,
        end_fuel_level: endFuel,
        exterior_condition: "inspected_clean",
        interior_condition: "clean",
        new_damages: extraDamageFee > 0 ? [{ area: "Exterior Assessment", description: "Damage fee applied", charge: extraDamageFee }] : [],
        missing_accessories: [],
        late_hours: lateHours,
        extra_mileage: Math.max(0, endOdometer - res.vehicle.mileage),
        extra_mileage_charge: 0,
        fuel_charge: endFuel !== "100%" ? 45 : 0,
        late_fee: lateHours * 25,
        damage_charge: extraDamageFee,
        cleaning_fee: cleaningFee,
        total_additional_charges: totalAdditionalCharges,
        photos: [res.vehicle.primary_image_url || ""],
        inspected_by: returnInspector,
        notes: "Vehicle returned and final inspection checklist completed.",
      });
      setReturnSuccess(true);
      refreshData();
      setTimeout(() => setReturnSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to record return");
    }
  };

  // Filter confirmed bookings needing check-out
  const pendingCheckouts = reservations.filter((r) => r.status === "confirmed");
  // Filter active rentals needing check-in
  const pendingCheckins = reservations.filter((r) => r.status === "checked_out" || r.status === "active");

  return (
    <AppLayout>
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Vehicle Handover & Return Inspections
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Authoritative check-out/check-in audits, odometer readings, condition photos & deposit reconciliation
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("handover")}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
            activeTab === "handover"
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border hover:text-slate-900"
          )}
        >
          <FileCheck2 className="w-4 h-4" />
          Pickup Inspection (Check-Out) ({pendingCheckouts.length})
        </button>

        <button
          onClick={() => setActiveTab("return")}
          className={cn(
            "px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
            activeTab === "return"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border hover:text-slate-900"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          Return Inspection (Check-In) ({pendingCheckins.length})
        </button>
      </div>

      {/* Success Notification */}
      {(handoverSuccess || returnSuccess) && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {handoverSuccess ? "Handover inspection saved! Vehicle is now marked rented & on the road." : "Return inspection completed! Vehicle released back to available fleet."}
        </div>
      )}

      {/* HANDOVER WORKFLOW */}
      {activeTab === "handover" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Inspection Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
            <div className="border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Departure Handover Checklist
              </h3>
              <p className="text-xs text-slate-500">
                Verify vehicle departure state with the customer before handing over the keys.
              </p>
            </div>

            <form onSubmit={handleCompleteHandover} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Confirmed Reservation *
                </label>
                <select
                  value={selectedHandoverResId}
                  onChange={(e) => setSelectedHandoverResId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold text-sm"
                  required
                >
                  <option value="">-- Choose confirmed booking --</option>
                  {pendingCheckouts.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.reference} · {r.customer?.full_name} · {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model} ({r.vehicle?.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Starting Odometer (mi) *
                  </label>
                  <input
                    type="number"
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fuel / Battery Level *
                  </label>
                  <select
                    value={startFuel}
                    onChange={(e) => setStartFuel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="100%">100% (Full Tank / Charged)</option>
                    <option value="75%">75% (3/4 Tank)</option>
                    <option value="50%">50% (Half Tank)</option>
                    <option value="25%">25% (1/4 Tank)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Physical Keys Handed
                  </label>
                  <input
                    type="number"
                    value={keysCount}
                    onChange={(e) => setKeysCount(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Exterior Body Condition
                  </label>
                  <select
                    value={exteriorCondition}
                    onChange={(e) => setExteriorCondition(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl capitalize font-semibold"
                  >
                    <option value="excellent">Excellent / Showroom Clean</option>
                    <option value="good">Good (Minor stone chips noted)</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Interior Cleanliness
                  </label>
                  <select
                    value={interiorCondition}
                    onChange={(e) => setInteriorCondition(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl capitalize font-semibold"
                  >
                    <option value="clean">Spotless / Detailed</option>
                    <option value="standard">Standard Clean</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border space-y-2">
                <span className="font-bold text-slate-500 text-[10px] uppercase block">
                  Accessories & Safety Kit Handover
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Spare tire & tools", "SunPass transponder", "First aid kit", "Warning triangles", "User manual"].map((acc, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300">{acc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Inspector Signature / Name *
                </label>
                <input
                  type="text"
                  value={handoverInspector}
                  onChange={(e) => setHandoverInspector(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedHandoverResId}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sign & Complete Vehicle Handover
                </button>
              </div>
            </form>
          </div>

          {/* Pending Pickups Queue */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Pending Pickups Queue
            </h4>
            <p className="text-xs text-slate-500">
              Select any confirmed booking to populate the departure checklist.
            </p>

            <div className="space-y-2 pt-2">
              {pendingCheckouts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No pending checkouts right now.
                </div>
              ) : (
                pendingCheckouts.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedHandoverResId(r.id)}
                    className={cn(
                      "p-3 rounded-xl border text-xs cursor-pointer transition-all",
                      selectedHandoverResId === r.id
                        ? "bg-brand-50 dark:bg-brand-950/40 border-brand-500"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.reference}
                      </span>
                      <span className="text-[10px] text-brand-600 font-bold">
                        {formatDate(r.pickup_datetime, "HH:mm")}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      {r.customer?.full_name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RETURN WORKFLOW */}
      {activeTab === "return" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Return Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
            <div className="border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Vehicle Return & Condition Audit
              </h3>
              <p className="text-xs text-slate-500">
                Inspect ending mileage, fuel, assess damages, and reconcile security deposits.
              </p>
            </div>

            <form onSubmit={handleCompleteReturn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Active Rented Vehicle to Return *
                </label>
                <select
                  value={selectedReturnResId}
                  onChange={(e) => setSelectedReturnResId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold text-sm"
                  required
                >
                  <option value="">-- Choose active rental out with client --</option>
                  {pendingCheckins.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.reference} · {r.customer?.full_name} · {r.vehicle?.make} {r.vehicle?.model} ({r.vehicle?.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ending Odometer Reading (mi) *
                  </label>
                  <input
                    type="number"
                    value={endOdometer}
                    onChange={(e) => setEndOdometer(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Returned Fuel Level
                  </label>
                  <select
                    value={endFuel}
                    onChange={(e) => setEndFuel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="100%">100% (Full - Same to Same)</option>
                    <option value="75%">75% (Refueling Fee $35)</option>
                    <option value="50%">50% (Refueling Fee $55)</option>
                    <option value="25%">25% (Refueling Fee $75)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Late Hours Returned
                  </label>
                  <input
                    type="number"
                    value={lateHours}
                    onChange={(e) => setLateHours(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Extra Charges Reconciliation */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border space-y-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block">
                  Damage Charges & Deposit Deductions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">
                      New Damage Charge ($)
                    </label>
                    <input
                      type="number"
                      value={extraDamageFee}
                      onChange={(e) => setExtraDamageFee(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">
                      Special Cleaning / Detailing Fee ($)
                    </label>
                    <input
                      type="number"
                      value={cleaningFee}
                      onChange={(e) => setCleaningFee(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Inspector Signature / Name *
                </label>
                <input
                  type="text"
                  value={returnInspector}
                  onChange={(e) => setReturnInspector(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedReturnResId}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sign & Finalize Return
                </button>
              </div>
            </form>
          </div>

          {/* Active Rentals Awaiting Return */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Active Rentals Due
            </h4>
            <p className="text-xs text-slate-500">
              Select vehicle currently with customer to record check-in inspection.
            </p>

            <div className="space-y-2 pt-2">
              {pendingCheckins.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No rentals currently out on the road.
                </div>
              ) : (
                pendingCheckins.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReturnResId(r.id)}
                    className={cn(
                      "p-3 rounded-xl border text-xs cursor-pointer transition-all",
                      selectedReturnResId === r.id
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.reference}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        Due: {formatDate(r.return_datetime, "MMM dd")}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      {r.customer?.full_name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function InspectionsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        </AppLayout>
      }
    >
      <InspectionsContent />
    </Suspense>
  );
}
