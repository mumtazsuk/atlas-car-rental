"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { Vehicle, VehicleCategory, VehicleStatus } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { exportVehiclesToCsv, downloadCsvFile, parseVehicleCsv } from "@/lib/csv/importer";
import {
  Car,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Fuel,
  Gauge,
  Calendar,
  Wrench,
  Compass,
  FileCheck2,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agency, setAgency] = useState(atlasStore.getAgency());
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create & Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // Form Fields
  const [regNumber, setRegNumber] = useState("");
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2024);
  const [category, setCategory] = useState<VehicleCategory>("sedan");
  const [trim, setTrim] = useState("");
  const [transmission, setTransmission] = useState<"automatic" | "manual">("automatic");
  const [fuelType, setFuelType] = useState<"petrol" | "diesel" | "electric" | "hybrid">("petrol");
  const [seatingCapacity, setSeatingCapacity] = useState(5);
  const [color, setColor] = useState("Black");
  const [mileage, setMileage] = useState(10000);
  const [dailyRate, setDailyRate] = useState(150);
  const [depositAmount, setDepositAmount] = useState(500);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  // Details Modal
  const [detailsVehicle, setDetailsVehicle] = useState<Vehicle | null>(null);
  const [detailsTab, setDetailsTab] = useState<"overview" | "specs" | "history" | "service">("overview");

  // CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const refreshData = () => {
    setVehicles(atlasStore.getVehicles());
    setAgency(atlasStore.getAgency());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehicleId(null);
    setRegNumber("");
    setVin("");
    setMake("");
    setModel("");
    setYear(2024);
    setCategory("sedan");
    setDailyRate(150);
    setDepositAmount(500);
    setImageUrl("");
    setDescription("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicleId(v.id);
    setRegNumber(v.registration_number);
    setVin(v.vin);
    setMake(v.make);
    setModel(v.model);
    setYear(v.year);
    setCategory(v.category);
    setDailyRate(v.daily_rate);
    setDepositAmount(v.deposit_amount);
    setImageUrl(v.primary_image_url || "");
    setDescription(v.description || "");
    setIsFormOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber || !make || !model || !dailyRate) return;

    if (editingVehicleId) {
      atlasStore.updateVehicle(editingVehicleId, {
        registration_number: regNumber,
        vin,
        make,
        model,
        year,
        category,
        daily_rate: dailyRate,
        deposit_amount: depositAmount,
        primary_image_url: imageUrl || undefined,
        description,
      });
    } else {
      atlasStore.createVehicle({
        registration_number: regNumber,
        vin: vin || `VIN-${Date.now()}`,
        make,
        model,
        year,
        category,
        trim,
        transmission,
        fuel_type: fuelType,
        seating_capacity: seatingCapacity,
        color,
        mileage,
        daily_rate: dailyRate,
        deposit_amount: depositAmount,
        min_rental_days: 1,
        status: "available",
        ownership_type: "owned",
        primary_image_url: imageUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800",
        description,
        is_active: true,
      });
    }

    refreshData();
    setIsFormOpen(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (confirm("Are you sure you want to retire this vehicle from active fleet?")) {
      atlasStore.deleteVehicle(id);
      refreshData();
      if (detailsVehicle?.id === id) setDetailsVehicle(null);
    }
  };

  const handleExportCsv = () => {
    const csv = exportVehiclesToCsv(vehicles);
    downloadCsvFile(csv, `atlas_fleet_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = await parseVehicleCsv(text);
    setImportErrors(result.errors);

    if (result.successRows.length > 0) {
      result.successRows.forEach((row) => {
        atlasStore.createVehicle(row);
      });
      setImportSuccessCount(result.successRows.length);
      refreshData();
    }
  };

  const filtered = vehicles.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      v.make.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.registration_number.toLowerCase().includes(term) ||
      v.vin.toLowerCase().includes(term);

    const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AppLayout>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Vehicles & Fleet Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete fleet inventory, rate configuration, document records, and maintenance status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Add Vehicle
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search make, model, registration, VIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
          >
            <option value="all">All Categories</option>
            <option value="sedan">Sedans</option>
            <option value="suv">SUVs</option>
            <option value="luxury">Luxury</option>
            <option value="sports">Sports</option>
            <option value="electric">Electric</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Image & Category Pill */}
              <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={v.primary_image_url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800"}
                  alt={`${v.make} ${v.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge status={v.status} />
                </div>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950/80 text-white backdrop-blur-sm">
                  {v.category}
                </span>
              </div>

              {/* Vehicle Title & Specs */}
              <div className="p-4 space-y-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {v.year} {v.make} {v.model}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reg: <strong className="text-slate-700 dark:text-slate-300">{v.registration_number}</strong> · {v.color}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
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
            </div>

            {/* Pricing & Card Action Bar */}
            <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Daily Rate</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {formatCurrency(v.daily_rate, agency.default_currency)}
                  <span className="text-xs font-normal text-slate-400">/d</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDetailsVehicle(v)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="View Fleet Specifications"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit Vehicle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteVehicle(v.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Retire from fleet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Form Modal (Add / Edit) */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingVehicleId ? "Edit Vehicle Specifications" : "Register New Fleet Vehicle"}
          description="Enter vehicle registration, make, model, daily rental rate, and mandatory deposit."
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MIA-8821"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Make *
                </label>
                <input
                  type="text"
                  placeholder="e.g. BMW, Porsche"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 Series 530i"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="luxury">Luxury</option>
                  <option value="sports">Sports</option>
                  <option value="electric">Electric</option>
                  <option value="compact">Compact</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  VIN / Chassis Number
                </label>
                <input
                  type="text"
                  placeholder="17-character VIN"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Rental Rate ($) *
                </label>
                <input
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Required Deposit ($) *
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Mileage (mi)
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Photograph URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Description & Fleet Notes
                </label>
                <textarea
                  placeholder="Features, accessories, insurance details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-sm"
              >
                {editingVehicleId ? "Update Vehicle" : "Save to Fleet"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Vehicle Details Modal */}
      {detailsVehicle && (
        <Modal
          isOpen={!!detailsVehicle}
          onClose={() => setDetailsVehicle(null)}
          title={`${detailsVehicle.year} ${detailsVehicle.make} ${detailsVehicle.model}`}
          description={`Registration: ${detailsVehicle.registration_number} · Status: ${detailsVehicle.status.toUpperCase()}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Quick Specs Strip */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-slate-400 block text-[10px]">CATEGORY</span>
                <strong className="uppercase">{detailsVehicle.category}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TRANSMISSION</span>
                <strong className="capitalize">{detailsVehicle.transmission}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">FUEL</span>
                <strong className="capitalize">{detailsVehicle.fuel_type}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">MILEAGE</span>
                <strong>{detailsVehicle.mileage.toLocaleString()} mi</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border space-y-1">
                <span className="font-bold text-slate-400 text-[10px] uppercase">Financial Terms</span>
                <p>Daily Rental Rate: <strong>{formatCurrency(detailsVehicle.daily_rate, agency.default_currency)}</strong></p>
                <p>Required Deposit: <strong>{formatCurrency(detailsVehicle.deposit_amount, agency.default_currency)}</strong></p>
                <p>Ownership: <span className="capitalize">{detailsVehicle.ownership_type}</span></p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border space-y-1">
                <span className="font-bold text-slate-400 text-[10px] uppercase">Compliance & Insurance</span>
                <p>VIN: <strong className="font-mono">{detailsVehicle.vin}</strong></p>
                <p>Insurance Expiry: {detailsVehicle.insurance_expiry || "2027-01-20"}</p>
                <p>Registration Expiry: {detailsVehicle.registration_expiry || "2026-12-31"}</p>
              </div>
            </div>

            {detailsVehicle.description && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
                <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Description</span>
                <p className="text-slate-700 dark:text-slate-300">{detailsVehicle.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportErrors([]);
            setImportSuccessCount(null);
          }}
          title="Import Fleet from CSV"
          description="Upload a CSV file containing vehicle records. Duplicate registration numbers are checked automatically."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Choose CSV file to import
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-3 text-xs block mx-auto"
              />
            </div>

            {importSuccessCount !== null && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                Successfully imported {importSuccessCount} vehicles into fleet!
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 space-y-1">
                <span className="font-bold block">Validation Errors:</span>
                {importErrors.map((err, i) => (
                  <p key={i} className="text-[11px]">{err}</p>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
