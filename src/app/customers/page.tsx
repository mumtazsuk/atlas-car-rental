"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { atlasStore } from "@/lib/db/store";
import { Customer, Driver } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { exportCustomersToCsv, downloadCsvFile } from "@/lib/csv/importer";
import {
  Users,
  Plus,
  Search,
  Download,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  FileCheck2,
  Trash2,
  Edit,
  AlertCircle,
} from "lucide-react";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "drivers">("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Customer Modal Form
  const [isCustomerModal, setIsCustomerModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custType, setCustType] = useState<"individual" | "corporate">("individual");
  const [companyName, setCompanyName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custCity, setCustCity] = useState("Miami");
  const [custCountry, setCustCountry] = useState("United States");
  const [idType, setIdType] = useState<"passport" | "national_id" | "state_id">("passport");
  const [idNumber, setIdNumber] = useState("");
  const [formError, setFormError] = useState("");

  // Driver Modal Form
  const [isDriverModal, setIsDriverModal] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");
  const [licenceCountry, setLicenceCountry] = useState("United States");
  const [licenceExpiry, setLicenceExpiry] = useState("2028-12-31");
  const [licenceClass, setLicenceClass] = useState("Standard Class D");

  const refreshData = () => {
    setCustomers(atlasStore.getCustomers());
    setDrivers(atlasStore.getDrivers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      atlasStore.createCustomer({
        full_name: custName,
        email: custEmail,
        phone: custPhone,
        customer_type: custType,
        company_name: custType === "corporate" ? companyName : undefined,
        address: custAddress,
        city: custCity,
        country: custCountry,
        id_type: idType,
        id_number: idNumber,
        status: "active",
      });
      refreshData();
      setIsCustomerModal(false);
      // Reset
      setCustName("");
      setCustEmail("");
      setCustPhone("");
      setCompanyName("");
      setIdNumber("");
    } catch (err: any) {
      setFormError(err.message || "Failed to create customer.");
    }
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      atlasStore.createDriver({
        full_name: driverName,
        email: driverEmail,
        phone: driverPhone,
        licence_number: licenceNumber,
        licence_country: licenceCountry,
        licence_expiry: licenceExpiry,
        licence_class: licenceClass,
        verification_status: "verified",
      });
      refreshData();
      setIsDriverModal(false);
      setDriverName("");
      setDriverEmail("");
      setDriverPhone("");
      setLicenceNumber("");
    } catch (err: any) {
      setFormError(err.message || "Failed to create driver.");
    }
  };

  const handleExportCustomers = () => {
    const csv = exportCustomersToCsv(customers);
    downloadCsvFile(csv, `atlas_customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const filteredDrivers = drivers.filter(
    (d) =>
      d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.licence_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customer Directory & Authorized Drivers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Verified renter identities, corporate accounts, driving licences, and history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "customers" ? (
            <>
              <button
                onClick={handleExportCustomers}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  setFormError("");
                  setIsCustomerModal(true);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                + Add Customer
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setFormError("");
                setIsDriverModal(true);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Add Verified Driver
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("customers")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === "customers"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <Users className="w-4 h-4" />
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("drivers")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === "drivers"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            Verified Drivers ({drivers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder={activeTab === "customers" ? "Search customer name, email, phone..." : "Search driver name, licence..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
          />
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      {activeTab === "customers" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Account Type</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Identification</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {c.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Registered {formatDate(c.created_at, "MMM yyyy")}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold capitalize text-slate-700 dark:text-slate-300">
                        {c.customer_type === "corporate" ? (
                          <>
                            <Building className="w-3.5 h-3.5 text-brand-600" />
                            {c.company_name || "Corporate"}
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Individual
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {c.email}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300">
                        {c.city || "Miami"}, {c.country}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {c.id_number || "Verified"}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase block">
                        ({c.id_type})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRIVERS TABLE */}
      {activeTab === "drivers" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="py-3.5 px-4">Driver Name</th>
                  <th className="py-3.5 px-4">Driving Licence #</th>
                  <th className="py-3.5 px-4">Country & Class</th>
                  <th className="py-3.5 px-4">Licence Expiry</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDrivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-sm">
                      {d.full_name}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                      {d.licence_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                        {d.licence_country}
                      </span>
                      <span className="text-[11px] text-slate-400">{d.licence_class}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {d.licence_expiry}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 dark:text-slate-300 block">{d.phone || "N/A"}</span>
                      <span className="text-[11px] text-slate-400">{d.email}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={d.verification_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Registration Modal */}
      {isCustomerModal && (
        <Modal
          isOpen={isCustomerModal}
          onClose={() => setIsCustomerModal(false)}
          title="Register Customer Record"
          description="Enter primary identity information and billing preferences."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Legal Entity *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alexander Wright"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="email@company.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="+1 (305) 555-0199"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Type
                </label>
                <select
                  value={custType}
                  onChange={(e) => setCustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="individual">Individual Renter</option>
                  <option value="corporate">Corporate Account</option>
                </select>
              </div>

              {custType === "corporate" && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Legal Name
                  </label>
                  <input
                    type="text"
                    placeholder="Vanguard Holdings Inc"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ID Document Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="passport">Passport</option>
                  <option value="state_id">State Driver License</option>
                  <option value="national_id">National ID Card</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ID / Passport Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. US-PASS-908124"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsCustomerModal(false)}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
              >
                Create Customer Record
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Driver Registration Modal */}
      {isDriverModal && (
        <Modal
          isOpen={isDriverModal}
          onClose={() => setIsDriverModal(false)}
          title="Register Verified Driver"
          description="Record driver license credentials and expiration dates."
          maxWidth="md"
        >
          <form onSubmit={handleSaveDriver} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Driver Full Legal Name *
              </label>
              <input
                type="text"
                placeholder="Alexander Wright"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Licence Number *
                </label>
                <input
                  type="text"
                  placeholder="NY-DL-982104"
                  value={licenceNumber}
                  onChange={(e) => setLicenceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issuing Country *
                </label>
                <input
                  type="text"
                  value={licenceCountry}
                  onChange={(e) => setLicenceCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Licence Expiry Date *
                </label>
                <input
                  type="date"
                  value={licenceExpiry}
                  onChange={(e) => setLicenceExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Licence Class
                </label>
                <input
                  type="text"
                  value={licenceClass}
                  onChange={(e) => setLicenceClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsDriverModal(false)}
                className="px-4 py-2 text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
              >
                Save Driver
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
