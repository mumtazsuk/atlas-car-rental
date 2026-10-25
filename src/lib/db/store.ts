// =====================================================================
// ATLAS DATA & BUSINESS LOGIC STORE (Supabase + Reactive Memory Store)
// Implements authoritative vehicle availability checking, state machines,
// financial transactions, audit logs, and multi-tenant isolation.
// =====================================================================

import {
  Agency,
  Vehicle,
  Customer,
  Driver,
  Reservation,
  Payment,
  Invoice,
  Deposit,
  Expense,
  VehicleMaintenance,
  VehicleFinancing,
  GpsDevice,
  NotificationItem,
  AuditLog,
  RentalContract,
  HandoverInspection,
  ReturnInspection,
  ReservationStatus,
  VehicleStatus
} from "@/types";
import {
  initialAgency,
  initialVehicles,
  initialCustomers,
  initialDrivers,
  initialReservations,
  initialHandoverInspections,
  initialReturnInspections,
  initialContracts,
  initialInvoices,
  initialPayments,
  initialDeposits,
  initialExpenses,
  initialMaintenance,
  initialFinancing,
  initialGpsDevices,
  initialNotifications,
  initialAuditLogs,
  initialSubscriptionPlans,
} from "./mock-data";

class AtlasStore {
  private agency: Agency = { ...initialAgency };
  private vehicles: Vehicle[] = [...initialVehicles];
  private customers: Customer[] = [...initialCustomers];
  private drivers: Driver[] = [...initialDrivers];
  private reservations: Reservation[] = [...initialReservations];
  private handoverInspections: HandoverInspection[] = [...initialHandoverInspections];
  private returnInspections: ReturnInspection[] = [...initialReturnInspections];
  private contracts: RentalContract[] = [...initialContracts];
  private invoices: Invoice[] = [...initialInvoices];
  private payments: Payment[] = [...initialPayments];
  private deposits: Deposit[] = [...initialDeposits];
  private expenses: Expense[] = [...initialExpenses];
  private maintenance: VehicleMaintenance[] = [...initialMaintenance];
  private financing: VehicleFinancing[] = [...initialFinancing];
  private gpsDevices: GpsDevice[] = [...initialGpsDevices];
  private notifications: NotificationItem[] = [...initialNotifications];
  private auditLogs: AuditLog[] = [...initialAuditLogs];
  private subscriptionPlans = [...initialSubscriptionPlans];

  constructor() {
    this.loadFromStorage();
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private loadFromStorage() {
    if (!this.isClient()) return;
    try {
      const stored = localStorage.getItem("atlas_store_state_v1");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.agency) this.agency = data.agency;
        if (data.vehicles?.length) this.vehicles = data.vehicles;
        if (data.customers?.length) this.customers = data.customers;
        if (data.drivers?.length) this.drivers = data.drivers;
        if (data.reservations?.length) this.reservations = data.reservations;
        if (data.handoverInspections?.length) this.handoverInspections = data.handoverInspections;
        if (data.returnInspections?.length) this.returnInspections = data.returnInspections;
        if (data.contracts?.length) this.contracts = data.contracts;
        if (data.invoices?.length) this.invoices = data.invoices;
        if (data.payments?.length) this.payments = data.payments;
        if (data.deposits?.length) this.deposits = data.deposits;
        if (data.expenses?.length) this.expenses = data.expenses;
        if (data.maintenance?.length) this.maintenance = data.maintenance;
        if (data.financing?.length) this.financing = data.financing;
        if (data.gpsDevices?.length) this.gpsDevices = data.gpsDevices;
        if (data.notifications?.length) this.notifications = data.notifications;
        if (data.auditLogs?.length) this.auditLogs = data.auditLogs;
      }
    } catch {
      // Storage unavailable or unparseable, fall back to initial dataset
    }
  }

  private persist() {
    if (!this.isClient()) return;
    try {
      const payload = {
        agency: this.agency,
        vehicles: this.vehicles,
        customers: this.customers,
        drivers: this.drivers,
        reservations: this.reservations,
        handoverInspections: this.handoverInspections,
        returnInspections: this.returnInspections,
        contracts: this.contracts,
        invoices: this.invoices,
        payments: this.payments,
        deposits: this.deposits,
        expenses: this.expenses,
        maintenance: this.maintenance,
        financing: this.financing,
        gpsDevices: this.gpsDevices,
        notifications: this.notifications,
        auditLogs: this.auditLogs,
      };
      localStorage.setItem("atlas_store_state_v1", JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }

  public resetToDefault() {
    this.agency = { ...initialAgency };
    this.vehicles = [...initialVehicles];
    this.customers = [...initialCustomers];
    this.drivers = [...initialDrivers];
    this.reservations = [...initialReservations];
    this.handoverInspections = [...initialHandoverInspections];
    this.returnInspections = [...initialReturnInspections];
    this.contracts = [...initialContracts];
    this.invoices = [...initialInvoices];
    this.payments = [...initialPayments];
    this.deposits = [...initialDeposits];
    this.expenses = [...initialExpenses];
    this.maintenance = [...initialMaintenance];
    this.financing = [...initialFinancing];
    this.gpsDevices = [...initialGpsDevices];
    this.notifications = [...initialNotifications];
    this.auditLogs = [...initialAuditLogs];
    if (this.isClient()) {
      localStorage.removeItem("atlas_store_state_v1");
    }
    this.logAudit("system.reset", "system", "all", null, { action: "reset_to_default_demo" });
  }

  // --- AUDIT LOGGING ---
  public logAudit(action: string, entityType: string, entityId: string, oldValues: any, newValues: any, userName: string = "Staff User") {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      agency_id: this.agency.id,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: "127.0.0.1",
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    this.persist();
  }

  // --- AGENCY SETTINGS ---
  public getAgency(): Agency {
    return { ...this.agency };
  }

  public updateAgency(updates: Partial<Agency>): Agency {
    const old = { ...this.agency };
    this.agency = { ...this.agency, ...updates, updated_at: new Date().toISOString() };
    this.logAudit("agency.update", "agency", this.agency.id, old, updates);
    this.persist();
    return { ...this.agency };
  }

  // --- CRITICAL OVERLAP PREVENTION & VEHICLE AVAILABILITY ---
  public checkVehicleAvailability(
    vehicleId: string,
    pickupDateTime: string | Date,
    returnDateTime: string | Date,
    excludeReservationId?: string
  ): { available: boolean; conflictReason?: string } {
    const reqStart = new Date(pickupDateTime).getTime();
    const reqEnd = new Date(returnDateTime).getTime();

    if (isNaN(reqStart) || isNaN(reqEnd) || reqEnd <= reqStart) {
      return { available: false, conflictReason: "Return date must be strictly after pickup date." };
    }

    // 1. Check if vehicle is retired or inactive
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      return { available: false, conflictReason: "Vehicle not found." };
    }
    if (vehicle.status === "retired" || vehicle.status === "inactive") {
      return { available: false, conflictReason: `Vehicle is currently marked as ${vehicle.status}.` };
    }

    // 2. Check for active/confirmed overlapping reservations
    // Half-open interval overlap check: (res.pickup < reqEnd) && (res.return > reqStart)
    const activeStatuses: ReservationStatus[] = ["confirmed", "checked_out", "active"];
    for (const res of this.reservations) {
      if (res.vehicle_id === vehicleId && activeStatuses.includes(res.status)) {
        if (excludeReservationId && res.id === excludeReservationId) {
          continue;
        }
        const bStart = new Date(res.pickup_datetime).getTime();
        const bEnd = new Date(res.return_datetime).getTime();

        if (bStart < reqEnd && bEnd > reqStart) {
          return {
            available: false,
            conflictReason: `Vehicle is already allocated to booking ${res.reference} (${new Date(res.pickup_datetime).toLocaleDateString()} to ${new Date(res.return_datetime).toLocaleDateString()}).`,
          };
        }
      }
    }

    // 3. Check for blocking maintenance
    for (const m of this.maintenance) {
      if (m.vehicle_id === vehicleId && (m.status === "scheduled" || m.status === "in_progress") && m.is_blocking_availability) {
        const mStart = new Date(m.scheduled_date).getTime();
        const mEnd = m.completed_date ? new Date(m.completed_date).getTime() : mStart + 86400000 * 2; // Default 2 days block
        if (mStart < reqEnd && mEnd > reqStart) {
          return {
            available: false,
            conflictReason: `Vehicle is scheduled for service (${m.service_type.replace("_", " ")}) during this requested period.`,
          };
        }
      }
    }

    return { available: true };
  }

  // --- VEHICLES ---
  public getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  public getVehicleById(id: string): Vehicle | undefined {
    return this.vehicles.find((v) => v.id === id);
  }

  public getAvailableVehiclesForPeriod(pickup: string | Date, returnDate: string | Date, excludeReservationId?: string): Vehicle[] {
    return this.vehicles.filter((v) => {
      const check = this.checkVehicleAvailability(v.id, pickup, returnDate, excludeReservationId);
      return check.available;
    });
  }

  public createVehicle(data: Omit<Vehicle, "id" | "agency_id" | "created_at" | "updated_at">): Vehicle {
    const newVehicle: Vehicle = {
      ...data,
      id: `veh-${Date.now()}`,
      agency_id: this.agency.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.vehicles.unshift(newVehicle);
    this.logAudit("vehicle.create", "vehicle", newVehicle.id, null, newVehicle);
    this.persist();
    return newVehicle;
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle {
    const index = this.vehicles.findIndex((v) => v.id === id);
    if (index === -1) throw new Error("Vehicle not found");
    const old = { ...this.vehicles[index] };
    this.vehicles[index] = { ...this.vehicles[index], ...updates, updated_at: new Date().toISOString() };
    this.logAudit("vehicle.update", "vehicle", id, old, updates);
    this.persist();
    return { ...this.vehicles[index] };
  }

  public deleteVehicle(id: string): void {
    const index = this.vehicles.findIndex((v) => v.id === id);
    if (index !== -1) {
      const old = this.vehicles[index];
      // Mark as retired rather than breaking historical references
      this.vehicles[index].status = "retired";
      this.vehicles[index].is_active = false;
      this.logAudit("vehicle.retire", "vehicle", id, old, { status: "retired" });
      this.persist();
    }
  }

  // --- CUSTOMERS ---
  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  public createCustomer(data: Omit<Customer, "id" | "agency_id" | "created_at" | "updated_at">): Customer {
    // Duplicate check
    const existing = this.customers.find((c) => c.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error(`A customer with email ${data.email} already exists.`);
    }

    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      agency_id: this.agency.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.customers.unshift(newCustomer);
    this.logAudit("customer.create", "customer", newCustomer.id, null, newCustomer);
    this.persist();
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    const old = { ...this.customers[index] };
    this.customers[index] = { ...this.customers[index], ...updates, updated_at: new Date().toISOString() };
    this.logAudit("customer.update", "customer", id, old, updates);
    this.persist();
    return { ...this.customers[index] };
  }

  // --- DRIVERS ---
  public getDrivers(): Driver[] {
    return [...this.drivers];
  }

  public getDriverById(id: string): Driver | undefined {
    return this.drivers.find((d) => d.id === id);
  }

  public createDriver(data: Omit<Driver, "id" | "agency_id" | "created_at" | "updated_at">): Driver {
    const newDriver: Driver = {
      ...data,
      id: `drv-${Date.now()}`,
      agency_id: this.agency.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.drivers.unshift(newDriver);
    this.logAudit("driver.create", "driver", newDriver.id, null, newDriver);
    this.persist();
    return newDriver;
  }

  // --- RESERVATIONS & BOOKING WORKFLOW ---
  public getReservations(): Reservation[] {
    return this.reservations.map((res) => ({
      ...res,
      customer: this.getCustomerById(res.customer_id),
      vehicle: this.getVehicleById(res.vehicle_id),
      primary_driver: res.primary_driver_id ? this.getDriverById(res.primary_driver_id) : undefined,
    }));
  }

  public getReservationById(id: string): Reservation | undefined {
    const res = this.reservations.find((r) => r.id === id || r.reference === id);
    if (!res) return undefined;
    return {
      ...res,
      customer: this.getCustomerById(res.customer_id),
      vehicle: this.getVehicleById(res.vehicle_id),
      primary_driver: res.primary_driver_id ? this.getDriverById(res.primary_driver_id) : undefined,
    };
  }

  public createReservation(data: {
    customer_id: string;
    vehicle_id: string;
    primary_driver_id?: string;
    pickup_datetime: string;
    return_datetime: string;
    pickup_location: string;
    return_location: string;
    delivery_address?: string;
    rental_days: number;
    daily_rate: number;
    base_rental_amount: number;
    extras_amount: number;
    delivery_fee: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    deposit_amount: number;
    amount_paid: number;
    payment_status?: "unpaid" | "partial" | "paid";
    notes?: string;
    special_instructions?: string;
    extras?: Array<{ name: string; quantity: number; unit_price: number; total_price: number }>;
  }): Reservation {
    // 1. Strict overlap check before allocation
    const check = this.checkVehicleAvailability(data.vehicle_id, data.pickup_datetime, data.return_datetime);
    if (!check.available) {
      throw new Error(`Cannot create reservation: ${check.conflictReason}`);
    }

    const ref = `RES-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      agency_id: this.agency.id,
      reference: ref,
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id,
      primary_driver_id: data.primary_driver_id,
      status: "confirmed",
      pickup_datetime: data.pickup_datetime,
      return_datetime: data.return_datetime,
      pickup_location: data.pickup_location,
      return_location: data.return_location,
      delivery_address: data.delivery_address,
      rental_days: data.rental_days,
      daily_rate: data.daily_rate,
      base_rental_amount: data.base_rental_amount,
      extras_amount: data.extras_amount,
      delivery_fee: data.delivery_fee,
      discount_amount: data.discount_amount,
      tax_amount: data.tax_amount,
      total_amount: data.total_amount,
      deposit_amount: data.deposit_amount,
      amount_paid: data.amount_paid || 0,
      payment_status: data.payment_status || (data.amount_paid >= data.total_amount ? "paid" : data.amount_paid > 0 ? "partial" : "unpaid"),
      notes: data.notes,
      special_instructions: data.special_instructions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      extras: data.extras,
    };

    this.reservations.unshift(newReservation);

    // Auto-create initial Deposit record
    if (data.deposit_amount > 0) {
      this.deposits.unshift({
        id: `dep-${Date.now()}`,
        agency_id: this.agency.id,
        reservation_id: newReservation.id,
        customer_id: data.customer_id,
        required_amount: data.deposit_amount,
        collected_amount: 0,
        held_amount: 0,
        deducted_amount: 0,
        refunded_amount: 0,
        status: "pending",
        notes: `Required deposit for booking ${ref}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Auto-create Invoice record
    this.invoices.unshift({
      id: `inv-${Date.now()}`,
      agency_id: this.agency.id,
      reservation_id: newReservation.id,
      customer_id: data.customer_id,
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date(data.pickup_datetime).toISOString().split("T")[0],
      subtotal: data.base_rental_amount + data.extras_amount + data.delivery_fee - data.discount_amount,
      tax_amount: data.tax_amount,
      total_amount: data.total_amount,
      paid_amount: data.amount_paid || 0,
      status: (data.amount_paid || 0) >= data.total_amount ? "paid" : (data.amount_paid || 0) > 0 ? "partial" : "unpaid",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.logAudit("reservation.create", "reservation", newReservation.id, null, newReservation);
    this.persist();

    return this.getReservationById(newReservation.id)!;
  }

  public updateReservationStatus(
    id: string,
    newStatus: ReservationStatus,
    reason?: string,
    userName: string = "Staff User"
  ): Reservation {
    const index = this.reservations.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Reservation not found");
    const old = { ...this.reservations[index] };
    const vehicleId = old.vehicle_id;

    this.reservations[index].status = newStatus;
    this.reservations[index].updated_at = new Date().toISOString();

    if (newStatus === "cancelled") {
      this.reservations[index].cancelled_at = new Date().toISOString();
      this.reservations[index].cancellation_reason = reason || "Cancelled by agency staff";
    }

    // Reconcile vehicle status
    if (newStatus === "checked_out") {
      this.updateVehicle(vehicleId, { status: "rented" });
    } else if (newStatus === "completed" || newStatus === "cancelled") {
      // Set to available unless maintenance is blocking
      const mBlock = this.maintenance.find((m) => m.vehicle_id === vehicleId && (m.status === "scheduled" || m.status === "in_progress"));
      this.updateVehicle(vehicleId, { status: mBlock ? "maintenance" : "available" });
    }

    this.logAudit("reservation.status_change", "reservation", id, { status: old.status }, { status: newStatus, reason }, userName);
    this.persist();
    return this.getReservationById(id)!;
  }

  // --- HANDOVER & RETURN INSPECTIONS ---
  public getHandoverInspection(reservationId: string): HandoverInspection | undefined {
    return this.handoverInspections.find((h) => h.reservation_id === reservationId);
  }

  public recordHandoverInspection(data: Omit<HandoverInspection, "id" | "agency_id" | "created_at">): HandoverInspection {
    const existing = this.handoverInspections.find((h) => h.reservation_id === data.reservation_id);
    if (existing) {
      throw new Error("Handover inspection already recorded for this reservation.");
    }

    const newInsp: HandoverInspection = {
      ...data,
      id: `insp-hand-${Date.now()}`,
      agency_id: this.agency.id,
      created_at: new Date().toISOString(),
    };
    this.handoverInspections.unshift(newInsp);

    // Update vehicle odometer and mark checked_out
    this.updateVehicle(data.vehicle_id, {
      mileage: data.start_odometer,
      status: "rented",
    });

    // Update reservation status to checked_out
    this.updateReservationStatus(data.reservation_id, "checked_out", "Pickup inspection completed");

    this.logAudit("inspection.handover", "handover_inspection", newInsp.id, null, newInsp);
    this.persist();
    return newInsp;
  }

  public getReturnInspection(reservationId: string): ReturnInspection | undefined {
    return this.returnInspections.find((r) => r.reservation_id === reservationId);
  }

  public recordReturnInspection(data: Omit<ReturnInspection, "id" | "agency_id" | "created_at">): ReturnInspection {
    const existing = this.returnInspections.find((r) => r.reservation_id === data.reservation_id);
    if (existing) {
      throw new Error("Return inspection already recorded for this reservation.");
    }

    const newInsp: ReturnInspection = {
      ...data,
      id: `insp-ret-${Date.now()}`,
      agency_id: this.agency.id,
      created_at: new Date().toISOString(),
    };
    this.returnInspections.unshift(newInsp);

    // Update vehicle odometer and return to available
    this.updateVehicle(data.vehicle_id, {
      mileage: data.end_odometer,
      status: "available",
    });

    // Mark reservation completed
    this.updateReservationStatus(data.reservation_id, "completed", "Return inspection completed");

    // If damage or extra charges exist, deduct from deposit
    if (data.total_additional_charges > 0) {
      const dep = this.deposits.find((d) => d.reservation_id === data.reservation_id);
      if (dep && dep.held_amount > 0) {
        const deduct = Math.min(dep.held_amount, data.total_additional_charges);
        dep.held_amount -= deduct;
        dep.deducted_amount += deduct;
        dep.status = dep.held_amount === 0 ? "fully_deducted" : "partially_deducted";
        dep.notes = `Deducted $${deduct.toFixed(2)} for post-rental return charges (damage/fuel/late fees).`;
      }
    }

    this.logAudit("inspection.return", "return_inspection", newInsp.id, null, newInsp);
    this.persist();
    return newInsp;
  }

  // --- CONTRACTS & DIGITAL SIGNATURES ---
  public getContractByReservationId(reservationId: string): RentalContract | undefined {
    return this.contracts.find((c) => c.reservation_id === reservationId);
  }

  public generateContract(reservationId: string): RentalContract {
    const existing = this.contracts.find((c) => c.reservation_id === reservationId);
    if (existing) return existing;

    const res = this.getReservationById(reservationId);
    if (!res) throw new Error("Reservation not found");

    const contractNumber = `CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const terms = `
      VEHICLE RENTAL AGREEMENT (${contractNumber})
      AGENCY: ${this.agency.name} (${this.agency.address})
      RENTER: ${res.customer?.full_name} (${res.customer?.email})
      VEHICLE: ${res.vehicle?.year} ${res.vehicle?.make} ${res.vehicle?.model} (${res.vehicle?.registration_number})
      RENTAL PERIOD: ${new Date(res.pickup_datetime).toLocaleString()} to ${new Date(res.return_datetime).toLocaleString()}
      TOTAL CONTRACT AMOUNT: $${res.total_amount.toFixed(2)} | DEPOSIT HELD: $${res.deposit_amount.toFixed(2)}

      TERMS & CONDITIONS:
      1. Renter acknowledges receipt of the vehicle in good working order and agrees to return it on the agreed date.
      2. Strictly non-smoking vehicle. Violation results in $250 detailing fee.
      3. Renter agrees that any traffic citations, toll charges, or parking violations incurred will be charged to renter.
      4. In event of accident or mechanical failure, renter must notify ${this.agency.phone} immediately.
    `;

    const newContract: RentalContract = {
      id: `ctr-${Date.now()}`,
      reservation_id: reservationId,
      agency_id: this.agency.id,
      contract_number: contractNumber,
      version: 1,
      status: "pending_signature",
      terms_text: terms.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.contracts.unshift(newContract);
    this.logAudit("contract.generate", "contract", newContract.id, null, newContract);
    this.persist();
    return newContract;
  }

  public signContract(
    contractId: string,
    signatureType: "customer" | "staff",
    signatureDataUrl: string
  ): RentalContract {
    const index = this.contracts.findIndex((c) => c.id === contractId);
    if (index === -1) throw new Error("Contract not found");

    if (signatureType === "customer") {
      this.contracts[index].customer_signed_at = new Date().toISOString();
      this.contracts[index].customer_signature_data = signatureDataUrl;
    } else {
      this.contracts[index].staff_signed_at = new Date().toISOString();
      this.contracts[index].staff_signature_data = signatureDataUrl;
    }

    if (this.contracts[index].customer_signed_at && this.contracts[index].staff_signed_at) {
      this.contracts[index].status = "signed";
    }

    this.contracts[index].updated_at = new Date().toISOString();
    this.logAudit("contract.signed", "contract", contractId, null, { signatureType });
    this.persist();
    return { ...this.contracts[index] };
  }

  // --- PAYMENTS, INVOICES, DEPOSITS ---
  public getPayments(): Payment[] {
    return this.payments.map((p) => ({
      ...p,
      customer: this.getCustomerById(p.customer_id),
    }));
  }

  public recordPayment(data: {
    reservation_id?: string;
    invoice_id?: string;
    customer_id: string;
    amount: number;
    payment_method: any;
    transaction_type?: any;
    notes?: string;
    recorded_by?: string;
  }): Payment {
    const ref = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      agency_id: this.agency.id,
      reservation_id: data.reservation_id,
      invoice_id: data.invoice_id,
      customer_id: data.customer_id,
      reference: ref,
      amount: data.amount,
      currency: this.agency.default_currency,
      payment_method: data.payment_method,
      payment_date: new Date().toISOString(),
      transaction_type: data.transaction_type || "rental_fee",
      status: "completed",
      notes: data.notes,
      recorded_by: data.recorded_by || "Staff User",
      created_at: new Date().toISOString(),
    };

    this.payments.unshift(newPayment);

    // Update reservation paid balance
    if (data.reservation_id) {
      const res = this.reservations.find((r) => r.id === data.reservation_id);
      if (res) {
        res.amount_paid += data.amount;
        res.payment_status = res.amount_paid >= res.total_amount ? "paid" : "partial";
      }
    }

    // Update invoice paid balance
    if (data.invoice_id) {
      const inv = this.invoices.find((i) => i.id === data.invoice_id);
      if (inv) {
        inv.paid_amount += data.amount;
        inv.status = inv.paid_amount >= inv.total_amount ? "paid" : "partial";
      }
    }

    this.logAudit("payment.record", "payment", newPayment.id, null, newPayment);
    this.persist();
    return newPayment;
  }

  public getInvoices(): Invoice[] {
    return this.invoices.map((inv) => ({
      ...inv,
      customer: this.getCustomerById(inv.customer_id),
    }));
  }

  public getDeposits(): Deposit[] {
    return this.deposits.map((d) => ({
      ...d,
      customer: this.getCustomerById(d.customer_id),
    }));
  }

  public collectDeposit(depositId: string, amount: number, paymentMethod: any = "card"): Deposit {
    const index = this.deposits.findIndex((d) => d.id === depositId);
    if (index === -1) throw new Error("Deposit not found");
    const dep = this.deposits[index];
    dep.collected_amount += amount;
    dep.held_amount += amount;
    dep.status = "collected";
    dep.updated_at = new Date().toISOString();

    this.logAudit("deposit.collect", "deposit", depositId, null, { amount, paymentMethod });
    this.persist();
    return { ...dep };
  }

  public refundDeposit(depositId: string, amount: number, reason: string): Deposit {
    const index = this.deposits.findIndex((d) => d.id === depositId);
    if (index === -1) throw new Error("Deposit not found");
    const dep = this.deposits[index];
    if (amount > dep.held_amount) {
      throw new Error(`Refund amount ($${amount}) exceeds currently held deposit ($${dep.held_amount}).`);
    }
    dep.held_amount -= amount;
    dep.refunded_amount += amount;
    dep.status = dep.held_amount === 0 ? "refunded" : "partially_refunded";
    dep.notes = `Refunded $${amount.toFixed(2)}: ${reason}`;
    dep.updated_at = new Date().toISOString();

    this.logAudit("deposit.refund", "deposit", depositId, null, { amount, reason });
    this.persist();
    return { ...dep };
  }

  // --- EXPENSES ---
  public getExpenses(): Expense[] {
    return this.expenses.map((e) => ({
      ...e,
      vehicle: e.vehicle_id ? this.getVehicleById(e.vehicle_id) : undefined,
    }));
  }

  public createExpense(data: Omit<Expense, "id" | "agency_id" | "created_at">): Expense {
    const newExpense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      agency_id: this.agency.id,
      created_at: new Date().toISOString(),
    };
    this.expenses.unshift(newExpense);
    this.logAudit("expense.create", "expense", newExpense.id, null, newExpense);
    this.persist();
    return newExpense;
  }

  // --- MAINTENANCE ---
  public getMaintenance(): VehicleMaintenance[] {
    return this.maintenance.map((m) => ({
      ...m,
      vehicle: this.getVehicleById(m.vehicle_id),
    }));
  }

  public createMaintenance(data: Omit<VehicleMaintenance, "id" | "agency_id" | "created_at" | "updated_at">): VehicleMaintenance {
    const newMaint: VehicleMaintenance = {
      ...data,
      id: `maint-${Date.now()}`,
      agency_id: this.agency.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.maintenance.unshift(newMaint);

    if (newMaint.is_blocking_availability && (newMaint.status === "scheduled" || newMaint.status === "in_progress")) {
      this.updateVehicle(newMaint.vehicle_id, { status: "maintenance" });
    }

    this.logAudit("maintenance.create", "maintenance", newMaint.id, null, newMaint);
    this.persist();
    return newMaint;
  }

  public updateMaintenanceStatus(id: string, status: "scheduled" | "in_progress" | "completed" | "cancelled", actualCost?: number): VehicleMaintenance {
    const index = this.maintenance.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Maintenance record not found");
    const old = { ...this.maintenance[index] };
    this.maintenance[index].status = status;
    if (actualCost !== undefined) this.maintenance[index].actual_cost = actualCost;
    if (status === "completed") {
      this.maintenance[index].completed_date = new Date().toISOString().split("T")[0];
      // Release vehicle back to available if no other blocking repairs
      this.updateVehicle(old.vehicle_id, { status: "available" });
    }
    this.maintenance[index].updated_at = new Date().toISOString();
    this.logAudit("maintenance.update", "maintenance", id, old, { status, actualCost });
    this.persist();
    return { ...this.maintenance[index] };
  }

  // --- FINANCING ---
  public getFinancing(): VehicleFinancing[] {
    return this.financing.map((f) => ({
      ...f,
      vehicle: this.getVehicleById(f.vehicle_id),
    }));
  }

  public createFinancing(data: Omit<VehicleFinancing, "id" | "agency_id" | "created_at" | "updated_at">): VehicleFinancing {
    const newFin: VehicleFinancing = {
      ...data,
      id: `fin-${Date.now()}`,
      agency_id: this.agency.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.financing.unshift(newFin);
    this.logAudit("financing.create", "financing", newFin.id, null, newFin);
    this.persist();
    return newFin;
  }

  // --- GPS TELEMETRY & SIMULATOR ---
  public getGpsDevices(): GpsDevice[] {
    return this.gpsDevices.map((g) => ({
      ...g,
      vehicle: this.getVehicleById(g.vehicle_id),
    }));
  }

  public simulateGpsStep(): GpsDevice[] {
    // Subtle realistic movement simulation for demo/test mode
    this.gpsDevices = this.gpsDevices.map((d) => {
      if (d.status === "moving") {
        const deltaLat = (Math.random() - 0.48) * 0.002;
        const deltaLng = (Math.random() - 0.48) * 0.002;
        return {
          ...d,
          last_latitude: Number((d.last_latitude + deltaLat).toFixed(6)),
          last_longitude: Number((d.last_longitude + deltaLng).toFixed(6)),
          last_speed: Math.floor(25 + Math.random() * 35),
          last_telemetry_at: new Date().toISOString(),
          battery_level: Math.max(10, d.battery_level - (Math.random() > 0.8 ? 1 : 0)),
        };
      }
      return d;
    });
    this.persist();
    return this.getGpsDevices();
  }

  // --- NOTIFICATIONS & AUDIT ---
  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public markNotificationRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.persist();
    }
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- FINANCIAL & FLEET KPI AGGREGATION ---
  public getDashboardMetrics() {
    const totalFleet = this.vehicles.length;
    const available = this.vehicles.filter((v) => v.status === "available").length;
    const rented = this.vehicles.filter((v) => v.status === "rented").length;
    const inMaintenance = this.vehicles.filter((v) => v.status === "maintenance").length;
    const activeRentals = this.reservations.filter((r) => r.status === "checked_out" || r.status === "active").length;

    // Financial KPIs
    const totalCollectedRevenue = this.payments
      .filter((p) => p.status === "completed" && p.transaction_type === "rental_fee")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = this.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netOperatingProfit = totalCollectedRevenue - totalExpenses;

    const totalDepositsHeld = this.deposits.reduce((sum, d) => sum + d.held_amount, 0);

    const outstandingBalances = this.invoices
      .filter((i) => i.status === "unpaid" || i.status === "partial")
      .reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0);

    // Fleet utilization percentage
    const fleetUtilization = totalFleet > 0 ? Math.round((rented / totalFleet) * 100) : 0;

    return {
      totalFleet,
      available,
      rented,
      inMaintenance,
      activeRentals,
      totalCollectedRevenue,
      totalExpenses,
      netOperatingProfit,
      totalDepositsHeld,
      outstandingBalances,
      fleetUtilization,
    };
  }
}

export const atlasStore = new AtlasStore();
