"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { VehicleMaintenance, MaintenanceServiceType, Vehicle } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Car,
  AlertTriangle,
  Calendar,
  ShieldAlert,
} from "lucide-react";

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());
  const [statusFilter, setStatusFilter] = useState("all");

  // Schedule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState<MaintenanceServiceType>("routine_service");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceProvider, setServiceProvider] = useState("");
  const [estimatedCost, setEstimatedCost] = useState(250);
  const [isBlocking, setIsBlocking] = useState(true);

  // Complete Modal
  const [completingMaint, setCompletingMaint] = useState<VehicleMaintenance | null>(null);
  const [actualCost, setActualCost] = useState(0);

  const refreshData = () => {
    setMaintenance(atlasStore.getMaintenance());
    setVehicles(atlasStore.getVehicles());
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleScheduleService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description || !serviceProvider) return;

    atlasStore.createMaintenance({
      vehicle_id: vehicleId,
      service_type: serviceType,
      description,
      scheduled_date: scheduledDate,
      service_provider: serviceProvider,
      estimated_cost: estimatedCost,
      status: "scheduled",
      is_blocking_availability: isBlocking,
    });

    refreshData();
    setIsModalOpen(false);
    setDescription("");
    setServiceProvider("");
  };

  const handleFinalizeCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingMaint) return;

    atlasStore.updateMaintenanceStatus(completingMaint.id, "completed", actualCost);
    refreshData();
    setCompletingMaint(null);
  };

  const filtered = maintenance.filter((m) => {
    return statusFilter === "all" || m.status === statusFilter;
  });

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Fleet Maintenance & Safety Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Routine servicing schedules, safety blocks, brake inspections, and mechanical logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Schedule Service
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Active Vehicles in Shop
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {maintenance.filter((m) => m.status === "in_progress" || m.status === "scheduled").length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Availability blocked for safety</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Completed Services
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {maintenance.filter((m) => m.status === "completed").length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Repairs logged this year</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Service Costs
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(
              maintenance.reduce((sum, m) => sum + (m.actual_cost || m.estimated_cost), 0),
              agency.default_currency
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Parts & labor invested</p>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            {["all", "scheduled", "in_progress", "completed"].map((st) => (
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
          <span className="text-xs text-slate-400">
            Showing {filtered.length} service records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Service Type</th>
                <th className="py-3.5 px-4">Scheduled Date</th>
                <th className="py-3.5 px-4">Service Provider</th>
                <th className="py-3.5 px-4">Booking Block</th>
                <th className="py-3.5 px-4 text-right">Cost (Est / Act)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {m.vehicle?.year} {m.vehicle?.make} {m.vehicle?.model}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Reg: {m.vehicle?.registration_number}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="capitalize font-bold text-slate-800 dark:text-slate-200 block">
                      {m.service_type.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">
                      {m.description}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {formatDate(m.scheduled_date)}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {m.service_provider}
                  </td>

                  <td className="py-3.5 px-4">
                    {m.is_blocking_availability ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Unblocked</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {m.actual_cost ? formatCurrency(m.actual_cost, agency.default_currency) : formatCurrency(m.estimated_cost, agency.default_currency)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {m.actual_cost ? "Actual final" : "Estimated"}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <Badge status={m.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {m.status !== "completed" && (
                      <button
                        onClick={() => {
                          setCompletingMaint(m);
                          setActualCost(m.estimated_cost);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px] transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Service Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Schedule Vehicle Maintenance"
          description="Log service appointment and choose whether to block fleet availability."
          maxWidth="md"
        >
          <form onSubmit={handleScheduleService} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Vehicle *
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
                  Service Type *
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl capitalize"
                >
                  <option value="routine_service">Routine Servicing</option>
                  <option value="oil_change">Oil & Filter Change</option>
                  <option value="tyres">Tyres & Alignment</option>
                  <option value="brakes">Brakes & Rotors</option>
                  <option value="battery">Battery & Electrical</option>
                  <option value="inspection">State Road Inspection</option>
                  <option value="mechanical">Mechanical Repair</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Provider / Workshop *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official Audi Service Brickell"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Cost ($)
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="blockAvail"
                  checked={isBlocking}
                  onChange={(e) => setIsBlocking(e.target.checked)}
                  className="rounded text-brand-600"
                />
                <label htmlFor="blockAvail" className="font-bold text-slate-700 dark:text-slate-300">
                  Block Fleet Availability
                </label>
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Description & Work Details
                </label>
                <textarea
                  placeholder="Parts to replace, symptoms, diagnostic notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
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
                Book Appointment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Maintenance Modal */}
      {completingMaint && (
        <Modal
          isOpen={!!completingMaint}
          onClose={() => setCompletingMaint(null)}
          title="Complete Maintenance Service"
          description={`Vehicle: ${completingMaint.vehicle?.make} ${completingMaint.vehicle?.model} (${completingMaint.vehicle?.registration_number})`}
          maxWidth="sm"
        >
          <form onSubmit={handleFinalizeCompletion} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Actual Invoiced Cost ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={actualCost}
                onChange={(e) => setActualCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-base"
                required
              />
            </div>
            <p className="text-slate-500">
              Completing this record will clear the maintenance block and return the vehicle to active available fleet.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setCompletingMaint(null)}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm"
              >
                Release to Fleet
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
