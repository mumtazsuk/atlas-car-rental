"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { atlasStore } from "@/lib/db/store";
import { Vehicle } from "@/types";
import { formatCurrency, calculateRentalDays, cn } from "@/lib/utils";
import {
  Car,
  Calendar,
  Fuel,
  Gauge,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function PublicBookingPage() {
  const agency = atlasStore.getAgency();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const now = new Date();
  const defaultPickup = new Date(now.getTime() + 24 * 3600000).toISOString().slice(0, 16);
  const defaultReturn = new Date(now.getTime() + 4 * 24 * 3600000).toISOString().slice(0, 16);

  const [pickup, setPickup] = useState(defaultPickup);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [pickupLocation, setPickupLocation] = useState("Miami Int Airport (MIA)");

  // Booking Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Only available vehicles shown to the public
    const avail = atlasStore.getAvailableVehiclesForPeriod(pickup, returnDate);
    setVehicles(avail);
  }, [pickup, returnDate]);

  const days = calculateRentalDays(pickup, returnDate);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !name || !email || !phone) return;

    // Check or create customer
    let cust = atlasStore.getCustomers().find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (!cust) {
      cust = atlasStore.createCustomer({
        full_name: name,
        email,
        phone,
        customer_type: "individual",
        country: "United States",
        id_type: "passport",
        status: "active",
      });
    }

    const baseAmount = days * selectedVehicle.daily_rate;
    const tax = Number(((baseAmount * agency.tax_rate) / 100).toFixed(2));
    const total = baseAmount + tax;

    const res = atlasStore.createReservation({
      customer_id: cust.id,
      vehicle_id: selectedVehicle.id,
      pickup_datetime: pickup,
      return_datetime: returnDate,
      pickup_location: pickupLocation,
      return_location: pickupLocation,
      rental_days: days,
      daily_rate: selectedVehicle.daily_rate,
      base_rental_amount: baseAmount,
      extras_amount: 0,
      delivery_fee: 0,
      discount_amount: 0,
      tax_amount: tax,
      total_amount: total,
      deposit_amount: selectedVehicle.deposit_amount,
      amount_paid: 0,
      payment_status: "unpaid",
      notes: "Online public booking reservation request.",
    });

    setBookingSuccess(res.reference);
    setSelectedVehicle(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Branded Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center text-white font-black text-lg shadow-md">
              A
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-tight">
                {agency.name}
              </span>
              <span className="text-[11px] text-slate-400">
                Online Fleet Booking Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
            <span className="hidden sm:flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              {agency.phone}
            </span>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Date Search Filter Banner */}
      <section className="bg-slate-900 border-b border-slate-800 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Reserve Your Premium Fleet Vehicle
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live availability updated directly from our fleet management system
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Pickup Date & Time
              </label>
              <input
                type="datetime-local"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Return Date & Time
              </label>
              <input
                type="datetime-local"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Pickup Location
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold"
              >
                <option value="Miami Int Airport (MIA)">Miami Int Airport (MIA) VIP Terminal</option>
                <option value="Main Office - Brickell">Main Office - Brickell (Miami)</option>
                <option value="Fort Lauderdale Airport (FLL)">Fort Lauderdale Airport (FLL)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Banner */}
      {bookingSuccess && (
        <div className="max-w-4xl mx-auto my-8 p-6 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">
            Reservation Request Submitted!
          </h3>
          <p className="text-sm text-emerald-300">
            Your booking reference is <strong className="text-white font-mono">{bookingSuccess}</strong>.
            Our fleet desk has reserved your vehicle and an electronic confirmation with contract details has been prepared.
          </p>
        </div>
      )}

      {/* Available Fleet Grid */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Available Fleet for {days} Day(s)
          </h2>
          <span className="text-xs text-slate-400">
            {vehicles.length} vehicles ready for immediate booking
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                <div className="relative h-52 w-full bg-slate-800 overflow-hidden">
                  <img
                    src={v.primary_image_url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800"}
                    alt={`${v.make} ${v.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-slate-950/80 text-white backdrop-blur-sm">
                    {v.category}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{v.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1.5 capitalize">
                      <Fuel className="w-3.5 h-3.5 text-brand-400" />
                      {v.fuel_type}
                    </span>
                    <span className="flex items-center gap-1.5 capitalize">
                      <Gauge className="w-3.5 h-3.5 text-brand-400" />
                      {v.transmission}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Rental Rate</span>
                  <span className="text-2xl font-black text-white">
                    {formatCurrency(v.daily_rate, agency.default_currency)}
                    <span className="text-xs font-normal text-slate-400">/day</span>
                  </span>
                </div>

                <button
                  onClick={() => setSelectedVehicle(v)}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
                >
                  Book Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Booking Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Confirm Reservation: {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h3>
                <p className="text-slate-400 text-xs">
                  {days} Day(s) · Total: {formatCurrency(days * selectedVehicle.daily_rate, agency.default_currency)}
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alexander Wright"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="alexander@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="+1 (305) 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] space-y-1">
                <p>Deposit requirement: <strong>{formatCurrency(selectedVehicle.deposit_amount, agency.default_currency)}</strong> (Held on pickup)</p>
                <p>Location: <strong>{pickupLocation}</strong></p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="px-4 py-2 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                >
                  Submit Booking Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
