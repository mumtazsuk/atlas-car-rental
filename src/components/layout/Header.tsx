"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Bell,
  Database,
  User,
  LogOut,
  Car,
  Users,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Settings,
} from "lucide-react";
import { atlasStore } from "@/lib/db/store";
import { NotificationItem } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  sidebarCollapsed: boolean;
  onOpenQuickCreate?: (type: "reservation" | "vehicle" | "customer" | "payment") => void;
}

export function Header({ sidebarCollapsed, onOpenQuickCreate }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    vehicles: any[];
    customers: any[];
    reservations: any[];
  }>({ vehicles: [], customers: [], reservations: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuickOpen, setIsQuickOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(atlasStore.getNotifications());

    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setIsQuickOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Search across 3 core entities
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults({ vehicles: [], customers: [], reservations: [] });
      setIsSearchOpen(false);
      return;
    }
    const lower = q.toLowerCase();
    const vMatch = atlasStore
      .getVehicles()
      .filter(
        (v) =>
          v.make.toLowerCase().includes(lower) ||
          v.model.toLowerCase().includes(lower) ||
          v.registration_number.toLowerCase().includes(lower) ||
          v.vin.toLowerCase().includes(lower)
      )
      .slice(0, 3);

    const cMatch = atlasStore
      .getCustomers()
      .filter(
        (c) =>
          c.full_name.toLowerCase().includes(lower) ||
          c.email.toLowerCase().includes(lower) ||
          c.phone.includes(lower)
      )
      .slice(0, 3);

    const rMatch = atlasStore
      .getReservations()
      .filter(
        (r) =>
          r.reference.toLowerCase().includes(lower) ||
          r.customer?.full_name.toLowerCase().includes(lower)
      )
      .slice(0, 3);

    setSearchResults({ vehicles: vMatch, customers: cMatch, reservations: rMatch });
    setIsSearchOpen(true);
  };

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300 px-4 sm:px-6 flex items-center justify-between",
        sidebarCollapsed ? "left-20" : "left-64"
      )}
    >
      {/* Global Search Bar */}
      <div ref={searchRef} className="relative w-full max-w-md">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search fleet, bookings, customers, VIN..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-900 rounded-xl shadow-premium border border-slate-200 dark:border-slate-800 p-2 z-50 overflow-hidden text-sm">
            {searchResults.vehicles.length === 0 &&
            searchResults.customers.length === 0 &&
            searchResults.reservations.length === 0 ? (
              <div className="py-6 text-center text-slate-500 dark:text-slate-400">
                No matching fleet or booking records found.
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {searchResults.vehicles.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                      Vehicles
                    </span>
                    {searchResults.vehicles.map((v) => (
                      <Link
                        key={v.id}
                        href="/vehicles"
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Car className="w-4 h-4 text-brand-600" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {v.year} {v.make} {v.model}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({v.registration_number})
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.reservations.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                      Reservations
                    </span>
                    {searchResults.reservations.map((r) => (
                      <Link
                        key={r.id}
                        href={`/reservations`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold text-brand-600">
                            {r.reference}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {r.customer?.full_name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold capitalize text-slate-500">
                          {r.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.customers.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                      Customers
                    </span>
                    {searchResults.customers.map((c) => (
                      <Link
                        key={c.id}
                        href="/customers"
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {c.full_name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {c.email}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Supabase / Local Store Status Indicator */}
        <div
          title="Authoritative PostgreSQL / Local Store Database Status"
          className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-400"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Active Store / RLS Ready</span>
        </div>

        {/* Quick Action Button */}
        <div ref={quickRef} className="relative">
          <button
            onClick={() => setIsQuickOpen(!isQuickOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Action</span>
          </button>

          {isQuickOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-premium border border-slate-200 dark:border-slate-800 p-1.5 z-50 text-sm">
              <Link
                href="/reservations/new"
                onClick={() => setIsQuickOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-800 dark:text-slate-200"
              >
                <Calendar className="w-4 h-4 text-brand-600" />
                New Reservation
              </Link>
              <Link
                href="/vehicles?action=new"
                onClick={() => setIsQuickOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-800 dark:text-slate-200"
              >
                <Car className="w-4 h-4 text-emerald-600" />
                Add Vehicle
              </Link>
              <Link
                href="/customers?action=new"
                onClick={() => setIsQuickOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-800 dark:text-slate-200"
              >
                <Users className="w-4 h-4 text-blue-600" />
                New Customer
              </Link>
              <Link
                href="/payments?action=new"
                onClick={() => setIsQuickOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-800 dark:text-slate-200"
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                Record Payment
              </Link>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-200 dark:border-slate-800 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Notifications ({unreadNotifs} unread)
                </span>
                <span className="text-[11px] text-brand-600 font-semibold cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs transition-colors",
                      n.is_read
                        ? "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
                        : "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/60"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
              JD
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                John Doe
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Agency Owner
              </span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-12 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-premium border border-slate-200 dark:border-slate-800 p-1.5 z-50 text-sm">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  John Doe
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  fleet@atlasrentals.com
                </p>
              </div>
              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                <Settings className="w-3.5 h-3.5" />
                Agency Settings
              </Link>
              <button
                onClick={() => {
                  atlasStore.resetToDefault();
                  setIsProfileOpen(false);
                  window.location.reload();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-medium text-left"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Data
              </button>
              <Link
                href="/"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
