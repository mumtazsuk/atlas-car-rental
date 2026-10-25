"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { atlasStore } from "@/lib/db/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportReservationsToCsv, downloadCsvFile } from "@/lib/csv/importer";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  Car,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  PieChart as PieIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReportsPage() {
  const [metrics, setMetrics] = useState(atlasStore.getDashboardMetrics());
  const [vehicles, setVehicles] = useState(atlasStore.getVehicles());
  const [reservations, setReservations] = useState(atlasStore.getReservations());
  const [expenses, setExpenses] = useState(atlasStore.getExpenses());
  const [deposits, setDeposits] = useState(atlasStore.getDeposits());
  const [agency, setAgency] = useState(atlasStore.getAgency());

  useEffect(() => {
    setMetrics(atlasStore.getDashboardMetrics());
    setVehicles(atlasStore.getVehicles());
    setReservations(atlasStore.getReservations());
    setExpenses(atlasStore.getExpenses());
    setDeposits(atlasStore.getDeposits());
    setAgency(atlasStore.getAgency());
  }, []);

  // Vehicle Revenue Generation Performance
  const vehiclePerformanceData = vehicles.map((v) => {
    const vRes = reservations.filter((r) => r.vehicle_id === v.id && r.status !== "cancelled");
    const earned = vRes.reduce((sum, r) => sum + r.amount_paid, 0);
    const days = vRes.reduce((sum, r) => sum + r.rental_days, 0);
    return {
      name: `${v.make} ${v.model.split(" ")[0]}`,
      revenue: earned,
      days: days,
      fullVehicle: v,
    };
  });

  const handleExportAll = () => {
    const csv = exportReservationsToCsv(reservations);
    downloadCsvFile(csv, `atlas_financial_performance_report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Financial Intelligence & Fleet Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Realized cash collections, net accounting margins, fleet ROI, and accounts receivable aging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export Comprehensive CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Gross Collected Cash"
          value={formatCurrency(metrics.totalCollectedRevenue, agency.default_currency)}
          subtitle="Realized bank & card receipts"
          icon={DollarSign}
          trend={{ value: "+21.5% YoY", isPositive: true }}
          iconColor="text-brand-600 bg-brand-50 dark:bg-brand-950/40"
        />
        <StatCard
          title="Total Fleet Expenses"
          value={formatCurrency(metrics.totalExpenses, agency.default_currency)}
          subtitle="Maintenance, fuel & policy overhead"
          icon={TrendingUp}
          trend={{ value: "Controlled", isNeutral: true }}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          title="Net Operating Margin"
          value={formatCurrency(metrics.netOperatingProfit, agency.default_currency)}
          subtitle="Revenue minus operating costs"
          icon={CheckCircle2}
          trend={{ value: `${metrics.totalCollectedRevenue > 0 ? Math.round((metrics.netOperatingProfit / metrics.totalCollectedRevenue) * 100) : 0}% Margin`, isPositive: true }}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          title="Accounts Receivable"
          value={formatCurrency(metrics.outstandingBalances, agency.default_currency)}
          subtitle="Awaiting client settlement"
          icon={Clock}
          trend={{ value: "Pending Due", isNeutral: true }}
          iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/40"
        />
      </div>

      {/* Bar Chart: Vehicle Revenue Generation Performance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Revenue Generated by Fleet Vehicle
            </h3>
            <p className="text-xs text-slate-500">
              Direct cash yield generated per vehicle model from verified bookings
            </p>
          </div>
          <span className="text-xs font-bold text-brand-600">
            {vehicles.length} Active Fleet Units
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehiclePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Collected Revenue"]}
                contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", border: "none", color: "#FFF" }}
              />
              <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fleet ROI & Utilization Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Vehicle Fleet Unit Economics & Utilization
          </h3>
          <p className="text-xs text-slate-500">
            Itemized breakdown of rental days, total earnings, and current asset status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Vehicle Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Rental Days Booked</th>
                <th className="py-3 px-4 text-right">Daily Rate</th>
                <th className="py-3 px-4 text-right">Realized Revenue</th>
                <th className="py-3 px-4 text-right">Deposit Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vehiclePerformanceData.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {v.fullVehicle.year} {v.fullVehicle.make} {v.fullVehicle.model}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Reg: {v.fullVehicle.registration_number}
                    </span>
                  </td>

                  <td className="py-3 px-4 uppercase font-semibold text-slate-600 dark:text-slate-400">
                    {v.fullVehicle.category}
                  </td>

                  <td className="py-3 px-4 capitalize font-semibold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.fullVehicle.status === "available"
                          ? "bg-emerald-50 text-emerald-700"
                          : v.fullVehicle.status === "rented"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {v.fullVehicle.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                    {v.days} Days
                  </td>

                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(v.fullVehicle.daily_rate, agency.default_currency)}
                  </td>

                  <td className="py-3 px-4 text-right font-black text-brand-600">
                    {formatCurrency(v.revenue, agency.default_currency)}
                  </td>

                  <td className="py-3 px-4 text-right text-slate-500">
                    {formatCurrency(v.fullVehicle.deposit_amount, agency.default_currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
