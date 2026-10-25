"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { atlasStore } from "@/lib/db/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Car,
  CheckCircle2,
  Clock,
  Wrench,
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Users,
  Compass,
  FileCheck2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(atlasStore.getDashboardMetrics());
  const [reservations, setReservations] = useState(atlasStore.getReservations());
  const [vehicles, setVehicles] = useState(atlasStore.getVehicles());
  const [payments, setPayments] = useState(atlasStore.getPayments());
  const [maintenance, setMaintenance] = useState(atlasStore.getMaintenance());
  const [agency, setAgency] = useState(atlasStore.getAgency());

  useEffect(() => {
    // Refresh metrics on mount
    setMetrics(atlasStore.getDashboardMetrics());
    setReservations(atlasStore.getReservations());
    setVehicles(atlasStore.getVehicles());
    setPayments(atlasStore.getPayments());
    setMaintenance(atlasStore.getMaintenance());
    setAgency(atlasStore.getAgency());
  }, []);

  // Operational Lists
  const upcomingPickups = reservations
    .filter((r) => r.status === "confirmed")
    .slice(0, 4);

  const activeReturns = reservations
    .filter((r) => r.status === "checked_out" || r.status === "active")
    .slice(0, 4);

  const pendingMaintenance = maintenance.filter(
    (m) => m.status === "scheduled" || m.status === "in_progress"
  );

  // Chart Data: 6-Month Revenue vs Expense Performance
  const financialChartData = [
    { month: "May", revenue: 14200, expenses: 6200, profit: 8000 },
    { month: "Jun", revenue: 18900, expenses: 7400, profit: 11500 },
    { month: "Jul", revenue: 24500, expenses: 9100, profit: 15400 },
    { month: "Aug", revenue: 22100, expenses: 8800, profit: 13300 },
    { month: "Sep", revenue: 19800, expenses: 7900, profit: 11900 },
    { month: "Oct (Live)", revenue: metrics.totalCollectedRevenue, expenses: metrics.totalExpenses, profit: metrics.netOperatingProfit },
  ];

  // Fleet Status Distribution Data
  const fleetDistributionData = [
    { name: "Available", value: metrics.available, color: "#10B981" },
    { name: "Rented", value: metrics.rented, color: "#3B82F6" },
    { name: "Maintenance", value: metrics.inMaintenance, color: "#EF4444" },
    { name: "Reserved", value: vehicles.filter(v => v.status === "reserved").length, color: "#F59E0B" },
  ];

  return (
    <AppLayout>
      {/* Page Title & Operational Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Operational Overview & Fleet KPIs
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Live business performance for <span className="font-semibold text-slate-700 dark:text-slate-200">{agency.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/reservations/new"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            + New Reservation
          </Link>
          <Link
            href="/inspections"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4" />
            Handover / Returns
          </Link>
        </div>
      </div>

      {/* Top 6 Primary Financial & Fleet KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Fleet Size"
          value={metrics.totalFleet}
          subtitle={`${metrics.available} Available · ${metrics.rented} Rented`}
          icon={Car}
          trend={{ value: `${metrics.fleetUtilization}% In Use`, isPositive: true }}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          title="Active Rentals"
          value={metrics.activeRentals}
          subtitle="Vehicles currently with customers"
          icon={CheckCircle2}
          trend={{ value: "+2 Today", isPositive: true }}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          title="Collected Revenue"
          value={formatCurrency(metrics.totalCollectedRevenue, agency.default_currency)}
          subtitle="Excludes refundable deposits"
          icon={DollarSign}
          trend={{ value: "+18.4% MoM", isPositive: true }}
          iconColor="text-brand-600 bg-brand-50 dark:bg-brand-950/40"
        />
        <StatCard
          title="Operating Expenses"
          value={formatCurrency(metrics.totalExpenses, agency.default_currency)}
          subtitle={`Net Profit: ${formatCurrency(metrics.netOperatingProfit, agency.default_currency)}`}
          icon={TrendingUp}
          trend={{ value: "Stable", isNeutral: true }}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/40"
        />
      </div>

      {/* Secondary Financial Risk & Liability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Refundable Deposits Held
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(metrics.totalDepositsHeld, agency.default_currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Segregated security liability</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unpaid Balances (A/R)
            </span>
            <div className="text-xl font-bold text-amber-600 mt-1">
              {formatCurrency(metrics.outstandingBalances, agency.default_currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Pending invoice receivables</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vehicles In Service
            </span>
            <div className="text-xl font-bold text-rose-600 mt-1">
              {metrics.inMaintenance} Vehicles
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Blocked from booking</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts Section: Financial Trends & Fleet Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Financial Area Chart (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Revenue vs Operating Expenses
              </h3>
              <p className="text-xs text-slate-500">
                Monthly collected rental revenue against fleet overhead & repairs
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-brand-600" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, undefined]}
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", border: "none", color: "#FFF" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Distribution Doughnut Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Fleet Status Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Current availability ratio ({metrics.fleetUtilization}% utilization)
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {fleetDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            {fleetDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {item.name}: <strong className="text-slate-900 dark:text-white">{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Queues: Upcoming Pickups & Expected Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Pickups */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              Upcoming Pickups & Departures
            </h3>
            <Link
              href="/reservations"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all bookings <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingPickups.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No upcoming confirmed pickups scheduled for today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingPickups.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center font-bold text-xs">
                      RES
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {r.reference}
                        </span>
                        <Badge status={r.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.customer?.full_name} · {r.vehicle?.make} {r.vehicle?.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {formatDate(r.pickup_datetime, "MMM dd, HH:mm")}
                    </span>
                    <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {r.pickup_location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Returns Due */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Active Rentals & Expected Returns
            </h3>
            <Link
              href="/inspections"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Inspection Check-in <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeReturns.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No vehicles currently out on active rental.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeReturns.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      RENT
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {r.reference}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                          {r.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.customer?.full_name} · {r.vehicle?.make} {r.vehicle?.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Due: {formatDate(r.return_datetime, "MMM dd, HH:mm")}
                    </span>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      Deposit: {formatCurrency(r.deposit_amount, agency.default_currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments & Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Recent Financial Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Audited payment receipts and electronic transactions
            </p>
          </div>
          <Link
            href="/payments"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            All Payments <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                    {p.reference}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    {p.customer?.full_name || "Client"}
                  </td>
                  <td className="py-3 px-3 capitalize text-slate-600 dark:text-slate-400">
                    {p.transaction_type.replace("_", " ")}
                  </td>
                  <td className="py-3 px-3 uppercase text-slate-600 dark:text-slate-400">
                    {p.payment_method}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {formatDate(p.payment_date, "MMM dd, yyyy")}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white text-right">
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge status={p.status} />
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
