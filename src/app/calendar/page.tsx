"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { atlasStore } from "@/lib/db/store";
import { Vehicle, Reservation, VehicleMaintenance } from "@/types";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Car,
  Wrench,
  Clock,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function FleetCalendarPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());

  // Current view reference date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"timeline" | "month">("timeline");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    setVehicles(atlasStore.getVehicles());
    setReservations(atlasStore.getReservations());
    setMaintenance(atlasStore.getMaintenance());
    setAgency(atlasStore.getAgency());
  }, []);

  // Generate 7-day timeline window around current date
  const timelineDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  const nextPeriod = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const resetToday = () => {
    setCurrentDate(new Date());
  };

  const filteredVehicles = vehicles.filter(
    (v) => categoryFilter === "all" || v.category === categoryFilter
  );

  return (
    <AppLayout>
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Fleet Schedule & Activity Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time visual turnover timeline, maintenance blocks, and vehicle bookings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/reservations/new"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + New Reservation
          </Link>
        </div>
      </div>

      {/* Control Bar: Timeline Navigation & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPeriod}
            className="p-2 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={resetToday}
            className="px-3 py-1.5 text-xs font-bold border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextPeriod}
            className="p-2 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm text-slate-900 dark:text-white ml-2">
            {formatDate(timelineDays[0], "MMM dd")} – {formatDate(timelineDays[timelineDays.length - 1], "MMM dd, yyyy")}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Status Legends */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Active Rental
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Confirmed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Maintenance
            </span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold"
          >
            <option value="all">All Categories</option>
            <option value="sedan">Sedans</option>
            <option value="suv">SUVs</option>
            <option value="luxury">Luxury</option>
            <option value="sports">Sports</option>
            <option value="electric">Electric</option>
          </select>
        </div>
      </div>

      {/* Vehicle-based Timeline Matrix View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 w-64 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                Fleet Vehicle
              </th>
              {timelineDays.map((day, idx) => {
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <th
                    key={idx}
                    className={cn(
                      "p-2 text-center min-w-[70px] border-r border-slate-100 dark:border-slate-800",
                      isToday && "bg-brand-50/60 dark:bg-brand-950/40 text-brand-600 font-extrabold"
                    )}
                  >
                    <span className="block text-[10px] text-slate-400 uppercase">
                      {formatDate(day, "EEE")}
                    </span>
                    <span className="text-xs font-bold">{formatDate(day, "dd")}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredVehicles.map((v) => {
              // Find reservations for this vehicle
              const vReservations = reservations.filter(
                (r) => r.vehicle_id === v.id && r.status !== "cancelled"
              );
              // Find maintenance for this vehicle
              const vMaint = maintenance.filter(
                (m) => m.vehicle_id === v.id && (m.status === "scheduled" || m.status === "in_progress")
              );

              return (
                <tr key={v.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky left-0 z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="block truncate text-xs font-bold">
                          {v.year} {v.make} {v.model}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {v.registration_number} · {v.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {timelineDays.map((day, dIdx) => {
                    const dayStart = new Date(day).setHours(0, 0, 0, 0);
                    const dayEnd = new Date(day).setHours(23, 59, 59, 999);

                    // Check if day falls within any reservation
                    const activeRes = vReservations.find((r) => {
                      const rStart = new Date(r.pickup_datetime).getTime();
                      const rEnd = new Date(r.return_datetime).getTime();
                      return rStart <= dayEnd && rEnd >= dayStart;
                    });

                    // Check if day falls in maintenance
                    const activeMaint = vMaint.find((m) => {
                      const mStart = new Date(m.scheduled_date).setHours(0, 0, 0, 0);
                      const mEnd = m.completed_date
                        ? new Date(m.completed_date).setHours(23, 59, 59, 999)
                        : mStart + 86400000 * 2;
                      return mStart <= dayEnd && mEnd >= dayStart;
                    });

                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                      <td
                        key={dIdx}
                        className={cn(
                          "p-1.5 text-center border-r border-slate-100 dark:border-slate-800 relative h-12",
                          isToday && "bg-brand-50/20 dark:bg-brand-950/20"
                        )}
                      >
                        {activeRes ? (
                          <Link
                            href="/reservations"
                            className={cn(
                              "block w-full py-1.5 px-1 rounded-md text-[10px] font-bold truncate text-white shadow-xs transition-transform hover:scale-105",
                              activeRes.status === "checked_out" || activeRes.status === "active"
                                ? "bg-blue-600 hover:bg-blue-500"
                                : activeRes.status === "confirmed"
                                ? "bg-amber-600 hover:bg-amber-500"
                                : "bg-emerald-600 hover:bg-emerald-500"
                            )}
                            title={`${activeRes.reference} · ${activeRes.customer?.full_name} (${activeRes.status})`}
                          >
                            {activeRes.reference}
                          </Link>
                        ) : activeMaint ? (
                          <Link
                            href="/maintenance"
                            className="block w-full py-1.5 px-1 rounded-md text-[10px] font-bold truncate bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-transform hover:scale-105"
                            title={`Service: ${activeMaint.service_type}`}
                          >
                            Service
                          </Link>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
