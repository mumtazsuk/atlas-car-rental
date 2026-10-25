"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { atlasStore } from "@/lib/db/store";
import { Vehicle, Customer, Driver } from "@/types";
import { formatCurrency, calculateRentalDays, cn } from "@/lib/utils";
import {
  Calendar,
  Car,
  Users,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Fuel,
  Gauge,
  ShieldCheck,
  AlertCircle,
  Plus,
  Sparkles,
} from "lucide-react";

export default function NewReservationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const agency = atlasStore.getAgency();

  // Step 1: Dates & Locations
  const now = new Date();
  const defaultPickup = new Date(now.getTime() + 24 * 3600000).toISOString().slice(0, 16);
  const defaultReturn = new Date(now.getTime() + 4 * 24 * 3600000).toISOString().slice(0, 16);

  const [pickupDatetime, setPickupDatetime] = useState(defaultPickup);
  const [returnDatetime, setReturnDatetime] = useState(defaultReturn);
  const [pickupLocation, setPickupLocation] = useState("Main Office - Brickell");
  const [returnLocation, setReturnLocation] = useState("Main Office - Brickell");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Step 2: Vehicle Selection
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Step 3: Customer & Drivers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  // Inline New Customer Form
  const [isNewCustomerModal, setIsNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  // Step 4: Add-on Extras & Pricing
  const [extras, setExtras] = useState([
    { name: "Full Premium Damage Waiver (Zero Deductible)", unit_price: 30, quantity: 0 },
    { name: "Executive Toll Pass (SunPass Unlimited)", unit_price: 15, quantity: 0 },
    { name: "Prepaid Refueling Option", unit_price: 45, quantity: 0 },
    { name: "Premium Child Safety Seat", unit_price: 20, quantity: 0 },
    { name: "GoPro 4K Scenic Dashcam", unit_price: 25, quantity: 0 },
  ]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Step 5: Advance Payment
  const [advancePaymentAmount, setAdvancePaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "bank_transfer">("card");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-calculate live available vehicles whenever dates change
  useEffect(() => {
    setCustomers(atlasStore.getCustomers());
    setDrivers(atlasStore.getDrivers());

    if (pickupDatetime && returnDatetime) {
      const avail = atlasStore.getAvailableVehiclesForPeriod(pickupDatetime, returnDatetime);
      setAvailableVehicles(avail);

      // If selected vehicle is no longer available, deselect
      if (selectedVehicle && !avail.find((v) => v.id === selectedVehicle.id)) {
        setSelectedVehicle(null);
      }
    }
  }, [pickupDatetime, returnDatetime, selectedVehicle]);

  // Pricing calculations
  const rentalDays = calculateRentalDays(pickupDatetime, returnDatetime);
  const dailyRate = selectedVehicle?.daily_rate || 0;
  const baseRentalAmount = rentalDays * dailyRate;
  const extrasAmount = extras.reduce((sum, e) => sum + e.unit_price * e.quantity, 0);
  const subtotalBeforeTax = Math.max(0, baseRentalAmount + extrasAmount + deliveryFee - discountAmount);
  const taxAmount = Number(((subtotalBeforeTax * agency.tax_rate) / 100).toFixed(2));
  const totalAmount = Number((subtotalBeforeTax + taxAmount).toFixed(2));
  const depositAmount = selectedVehicle?.deposit_amount || 500;

  // Step Validation
  const handleNextStep = () => {
    setErrorMessage("");
    if (step === 1) {
      if (!pickupDatetime || !returnDatetime) {
        setErrorMessage("Please select valid pickup and return dates.");
        return;
      }
      if (new Date(returnDatetime) <= new Date(pickupDatetime)) {
        setErrorMessage("Return date must be strictly after pickup date.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedVehicle) {
        setErrorMessage("Please select an available vehicle to proceed.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedCustomerId) {
        setErrorMessage("Please select a customer for this reservation.");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      setAdvancePaymentAmount(totalAmount);
      setStep(5);
    }
  };

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail || !newCustPhone) return;

    try {
      const created = atlasStore.createCustomer({
        full_name: newCustName,
        email: newCustEmail,
        phone: newCustPhone,
        customer_type: "individual",
        country: "United States",
        id_type: "passport",
        status: "active",
      });
      setCustomers(atlasStore.getCustomers());
      setSelectedCustomerId(created.id);
      setIsNewCustomerModal(false);
      setNewCustName("");
      setNewCustEmail("");
      setNewCustPhone("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create customer");
    }
  };

  const handleConfirmReservation = () => {
    if (!selectedVehicle || !selectedCustomerId) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = atlasStore.createReservation({
        customer_id: selectedCustomerId,
        vehicle_id: selectedVehicle.id,
        primary_driver_id: selectedDriverId || undefined,
        pickup_datetime: pickupDatetime,
        return_datetime: returnDatetime,
        pickup_location: pickupLocation,
        return_location: returnLocation,
        delivery_address: deliveryAddress || undefined,
        rental_days: rentalDays,
        daily_rate: dailyRate,
        base_rental_amount: baseRentalAmount,
        extras_amount: extrasAmount,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        amount_paid: advancePaymentAmount,
        notes,
        extras: extras
          .filter((e) => e.quantity > 0)
          .map((e) => ({
            name: e.name,
            quantity: e.quantity,
            unit_price: e.unit_price,
            total_price: e.unit_price * e.quantity,
          })),
      });

      // If advance payment was collected, record transaction
      if (advancePaymentAmount > 0) {
        atlasStore.recordPayment({
          reservation_id: res.id,
          customer_id: selectedCustomerId,
          amount: advancePaymentAmount,
          payment_method: paymentMethod,
          transaction_type: "rental_fee",
          notes: `Advance payment recorded at booking creation (${res.reference})`,
        });
      }

      // Auto-generate contract
      atlasStore.generateContract(res.id);

      router.push(`/reservations`);
    } catch (err: any) {
      setErrorMessage(err.message || "Conflict occurred while creating reservation.");
      setIsSubmitting(false);
    }
  };

  const filteredVehicles = availableVehicles.filter((v) => {
    const matchesSearch =
      v.make.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.registration_number.toLowerCase().includes(vehicleSearch.toLowerCase());
    const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      {/* Wizard Header & Stepper */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Create New Fleet Reservation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              5-Step Authoritative Booking Engine with real-time overlap prevention
            </p>
          </div>
          <Link
            href="/reservations"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel & Return
          </Link>
        </div>

        {/* 5-Step Progress Indicators */}
        <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-4">
          {[
            { num: 1, label: "Dates & Locations", icon: Calendar },
            { num: 2, label: "Vehicle Selection", icon: Car },
            { num: 3, label: "Customer & Driver", icon: Users },
            { num: 4, label: "Extras & Pricing", icon: CreditCard },
            { num: 5, label: "Review & Confirm", icon: CheckCircle2 },
          ].map((s) => {
            const Icon = s.icon;
            const isDone = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div
                key={s.num}
                className={cn(
                  "p-2.5 rounded-xl border flex items-center gap-2 sm:gap-3 transition-all",
                  isCurrent
                    ? "bg-brand-50/80 border-brand-500 text-brand-700 dark:bg-brand-950/40 dark:border-brand-500 dark:text-brand-300 shadow-sm"
                    : isDone
                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                    isCurrent
                      ? "bg-brand-600 text-white"
                      : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}
                >
                  {isDone ? "✓" : s.num}
                </div>
                <div className="truncate hidden sm:block">
                  <span className="text-xs font-bold truncate block">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Dates & Locations */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Step 1: Rental Schedule & Dispatch Locations
            </h3>
            <p className="text-xs text-slate-500">
              Select pickup and return boundaries. Vehicle availability is calculated using half-open intervals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Pickup Date & Time *
              </label>
              <input
                type="datetime-local"
                value={pickupDatetime}
                onChange={(e) => setPickupDatetime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Expected Return Date & Time *
              </label>
              <input
                type="datetime-local"
                value={returnDatetime}
                onChange={(e) => setReturnDatetime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Pickup Location
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              >
                <option value="Main Office - Brickell">Main Office - Brickell (Miami)</option>
                <option value="Miami Int Airport (MIA) VIP Terminal">Miami Int Airport (MIA) VIP Terminal</option>
                <option value="Fort Lauderdale Airport (FLL)">Fort Lauderdale Airport (FLL)</option>
                <option value="Custom Delivery Address">Custom Curbside Delivery Address</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Return Location
              </label>
              <select
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              >
                <option value="Main Office - Brickell">Main Office - Brickell (Miami)</option>
                <option value="Miami Int Airport (MIA) VIP Terminal">Miami Int Airport (MIA) VIP Terminal</option>
                <option value="Fort Lauderdale Airport (FLL)">Fort Lauderdale Airport (FLL)</option>
                <option value="Orlando Int Airport (MCO)">Orlando Int Airport (MCO)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Optional Delivery Address / Hotel Suite
              </label>
              <input
                type="text"
                placeholder="e.g. Four Seasons Hotel Miami, 1435 Brickell Ave, Room 2204"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-900 dark:text-blue-300 font-medium">
            <span>
              Calculated Duration: <strong>{rentalDays} Day(s)</strong>
            </span>
            <span>
              Fleet Vehicles Available for this period: <strong>{availableVehicles.length} vehicles</strong>
            </span>
          </div>
        </div>
      )}

      {/* STEP 2: Live Vehicle Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search make, model, registration..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
              {["all", "sedan", "suv", "luxury", "sports", "electric"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider capitalize transition-all",
                    categoryFilter === cat
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              <Car className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                No vehicles available matching filters for selected dates.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting different rental dates or adjusting category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={cn(
                      "bg-white dark:bg-slate-900 rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-card relative overflow-hidden flex flex-col justify-between",
                      isSelected
                        ? "border-2 border-brand-500 shadow-md ring-2 ring-brand-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    )}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 bg-brand-600 text-white p-1 rounded-full shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}

                    <div>
                      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                        <img
                          src={v.primary_image_url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"}
                          alt={`${v.make} ${v.model}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950/80 text-white backdrop-blur-sm">
                          {v.category}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {v.year} {v.make} {v.model}
                      </h4>
                      <p className="text-xs text-slate-500">{v.registration_number} · {v.color}</p>

                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Fuel className="w-3.5 h-3.5 text-slate-400" />
                          <span className="capitalize">{v.fuel_type}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          <span>{v.mileage.toLocaleString()} mi</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400">Daily Rate</span>
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                          {formatCurrency(v.daily_rate, agency.default_currency)}
                          <span className="text-xs font-normal text-slate-400">/day</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">Deposit req.</span>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(v.deposit_amount, agency.default_currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Customer & Drivers */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Step 3: Assign Customer & Primary Driver
              </h3>
              <p className="text-xs text-slate-500">
                Attach an existing verified customer or register a new one directly.
              </p>
            </div>
            <button
              onClick={() => setIsNewCustomerModal(true)}
              className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold hover:bg-brand-100 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              + Create New Customer
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Select Customer Account *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
              >
                <option value="">-- Choose registered customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email}) {c.company_name ? `- ${c.company_name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Primary Authorized Driver (Optional)
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              >
                <option value="">-- Same as customer / Select driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} · Licence: {d.licence_number} ({d.licence_country})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick inline registration modal */}
          {isNewCustomerModal && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Fast Customer Registration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Full Legal Name *"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewCustomer}
                  className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold"
                >
                  Save & Select
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Extras & Pricing */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Step 4: Optional Add-ons & Pricing Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Select ancillary equipment, VIP insurance waivers, or location dispatch fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add-ons list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available Extras & Equipment
              </h4>
              {extras.map((extra, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                      {extra.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatCurrency(extra.unit_price, agency.default_currency)} each
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = [...extras];
                        if (next[idx].quantity > 0) next[idx].quantity--;
                        setExtras(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-bold">
                      {extra.quantity}
                    </span>
                    <button
                      onClick={() => {
                        const next = [...extras];
                        next[idx].quantity++;
                        setExtras(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">
                    Delivery / Airport Fee ($)
                  </label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">
                    Discount Applied ($)
                  </label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live Pricing Summary Box */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Real-time Pricing Breakdown
                </h4>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Base Vehicle Rental ({rentalDays} Days @ {formatCurrency(dailyRate, agency.default_currency)}/day)</span>
                    <strong className="text-slate-900 dark:text-white">{formatCurrency(baseRentalAmount, agency.default_currency)}</strong>
                  </div>
                  {extrasAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Ancillary Extras & Waivers</span>
                      <strong className="text-slate-900 dark:text-white">{formatCurrency(extrasAmount, agency.default_currency)}</strong>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Curbside Delivery Fee</span>
                      <strong className="text-slate-900 dark:text-white">{formatCurrency(deliveryFee, agency.default_currency)}</strong>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Promotional Discount</span>
                      <strong>-{formatCurrency(discountAmount, agency.default_currency)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Applicable Sales Tax ({agency.tax_rate}%)</span>
                    <strong className="text-slate-900 dark:text-white">{formatCurrency(taxAmount, agency.default_currency)}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Total Rental Price
                  </span>
                  <span className="text-2xl font-black text-brand-600">
                    {formatCurrency(totalAmount, agency.default_currency)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between items-center text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800">
                  <span>Refundable Security Deposit Held</span>
                  <strong className="font-bold">{formatCurrency(depositAmount, agency.default_currency)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Confirm */}
      {step === 5 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Step 5: Review Booking Summary & Payment Settlement
            </h3>
            <p className="text-xs text-slate-500">
              Confirm contract specifications and optionally record advance payment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Vehicle Allocated
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
              </p>
              <p className="text-slate-500 mt-0.5">
                Reg: {selectedVehicle?.registration_number} · Category: {selectedVehicle?.category}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Customer & Itinerary
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {customers.find((c) => c.id === selectedCustomerId)?.full_name}
              </p>
              <p className="text-slate-500 mt-0.5">
                {new Date(pickupDatetime).toLocaleDateString()} to {new Date(returnDatetime).toLocaleDateString()} ({rentalDays} Days)
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Due at Checkout
              </span>
              <p className="font-black text-brand-600 text-lg">
                {formatCurrency(totalAmount, agency.default_currency)}
              </p>
              <p className="text-slate-500 mt-0.5">
                + {formatCurrency(depositAmount, agency.default_currency)} Security Deposit
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Record Advance Payment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Advance Paid Amount ($)
                </label>
                <input
                  type="number"
                  value={advancePaymentAmount}
                  onChange={(e) => setAdvancePaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3.5 py-2 bg-white dark:bg-slate-900 border rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full mt-1 px-3.5 py-2 bg-white dark:bg-slate-900 border rounded-xl text-sm font-semibold"
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash (Offline POS)</option>
                  <option value="bank_transfer">Wire / Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Step
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            onClick={handleNextStep}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
          >
            Continue to Step {step + 1}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleConfirmReservation}
            disabled={isSubmitting}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            {isSubmitting ? "Authorizing Booking..." : "Confirm & Allocate Vehicle"}
          </button>
        )}
      </div>
    </AppLayout>
  );
}
