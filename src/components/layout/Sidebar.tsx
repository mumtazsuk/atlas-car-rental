"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Car,
  Users,
  FileCheck2,
  Receipt,
  CreditCard,
  Wrench,
  DollarSign,
  Compass,
  BarChart3,
  UserCog,
  Bell,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const navigationSections = [
    {
      group: "Core Operations",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Rentals & Bookings", href: "/reservations", icon: ClipboardList, badge: "8" },
        { label: "Fleet Calendar", href: "/calendar", icon: CalendarDays },
        { label: "Vehicles & Fleet", href: "/vehicles", icon: Car, badge: "8" },
        { label: "Handover & Returns", href: "/inspections", icon: FileCheck2 },
      ],
    },
    {
      group: "Client & Mobility",
      items: [
        { label: "Customers & Drivers", href: "/customers", icon: Users },
        { label: "Contracts & Sign", href: "/contracts", icon: FileCheck2 },
        { label: "GPS Telemetry", href: "/gps", icon: Compass, badge: "Live" },
      ],
    },
    {
      group: "Financial Management",
      items: [
        { label: "Invoices & Payments", href: "/payments", icon: CreditCard },
        { label: "Refundable Deposits", href: "/deposits", icon: Receipt },
        { label: "Fleet Expenses", href: "/expenses", icon: DollarSign },
        { label: "Vehicle Maintenance", href: "/maintenance", icon: Wrench, badge: "1 Alert" },
        { label: "Vehicle Financing", href: "/financing", icon: Layers },
      ],
    },
    {
      group: "Intelligence & Config",
      items: [
        { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
        { label: "Team & Permissions", href: "/team", icon: UserCog },
        { label: "System Audit Logs", href: "/audit-logs", icon: ShieldAlert },
        { label: "Agency Settings", href: "/settings", icon: Settings },
        { label: "SaaS Subscription", href: "/billing", icon: Sparkles },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0b132b] text-slate-300 border-r border-slate-800/80 transition-all duration-300 ease-in-out select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand & Agency Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
            A
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                ATLAS
                <span className="text-[10px] px-1.5 py-0.2 bg-brand-500/20 text-brand-400 font-semibold rounded border border-brand-500/30">
                  PRO
                </span>
              </span>
              <span className="text-xs text-slate-400 truncate">
                Fleet Management
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400/80 mb-2">
                {section.group}
              </h4>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-500/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        item.badge === "Live"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse"
                          : isActive
                          ? "bg-brand-700 text-white"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Agency Switcher Footer */}
      <div className="p-3 border-t border-slate-800/80">
        <div
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs",
            collapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
            MIA
          </div>
          {!collapsed && (
            <div className="flex-1 truncate">
              <p className="font-semibold text-slate-200 truncate">
                Atlas Miami Branch
              </p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Tenant Active
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
