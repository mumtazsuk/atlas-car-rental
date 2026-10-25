// =====================================================================
// ATLAS CAR RENTAL & SAAS PLATFORM — COMPREHENSIVE TYPE DEFINITIONS
// =====================================================================

export type UserRole = 
  | 'owner' 
  | 'agency_admin' 
  | 'rental_manager' 
  | 'finance_manager' 
  | 'fleet_manager' 
  | 'rental_staff' 
  | 'readonly';

export type VehicleStatus = 
  | 'available' 
  | 'reserved' 
  | 'rented' 
  | 'maintenance' 
  | 'inactive' 
  | 'retired';

export type VehicleCategory = 
  | 'economy' 
  | 'compact' 
  | 'sedan' 
  | 'suv' 
  | 'luxury' 
  | 'van' 
  | 'electric' 
  | 'sports';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type Transmission = 'automatic' | 'manual';
export type OwnershipType = 'owned' | 'financed' | 'leased';

export interface Vehicle {
  id: string;
  agency_id: string;
  registration_number: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  trim?: string;
  transmission: Transmission;
  fuel_type: FuelType;
  engine_capacity?: string;
  seating_capacity: number;
  color: string;
  mileage: number;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  min_rental_days: number;
  deposit_amount: number;
  status: VehicleStatus;
  description?: string;
  notes?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  ownership_type: OwnershipType;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  registration_expiry?: string;
  inspection_expiry?: string;
  primary_image_url?: string;
  gps_device_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  agency_id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  agency_id: string;
  document_type: 'insurance' | 'registration' | 'inspection' | 'road_tax' | 'lease_agreement' | 'other';
  name: string;
  file_url: string;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  agency_id: string;
  full_name: string;
  email: string;
  phone: string;
  customer_type: 'individual' | 'corporate';
  company_name?: string;
  address?: string;
  city?: string;
  country: string;
  id_type: 'passport' | 'national_id' | 'state_id';
  id_number?: string;
  notes?: string;
  status: 'active' | 'flagged' | 'blacklisted';
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  agency_id: string;
  customer_id?: string;
  full_name: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  licence_number: string;
  licence_country: string;
  licence_expiry: string;
  licence_class: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ReservationStatus = 
  | 'draft' 
  | 'pending_confirmation' 
  | 'confirmed' 
  | 'checked_out' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export interface ReservationExtra {
  id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Reservation {
  id: string;
  agency_id: string;
  reference: string;
  customer_id: string;
  customer?: Customer;
  vehicle_id: string;
  vehicle?: Vehicle;
  primary_driver_id?: string;
  primary_driver?: Driver;
  status: ReservationStatus;
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
  payment_status: PaymentStatus;
  notes?: string;
  special_instructions?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  extras?: ReservationExtra[];
}

export interface HandoverInspection {
  id: string;
  reservation_id: string;
  vehicle_id: string;
  agency_id: string;
  pickup_datetime: string;
  start_odometer: number;
  start_fuel_level: string;
  exterior_condition: string;
  interior_condition: string;
  existing_damages: Array<{ area: string; description: string; severity: 'minor' | 'moderate' | 'major' }>;
  accessories_supplied: string[];
  keys_count: number;
  photos: string[];
  inspected_by: string;
  customer_signature_url?: string;
  notes?: string;
  created_at: string;
}

export interface ReturnInspection {
  id: string;
  reservation_id: string;
  vehicle_id: string;
  agency_id: string;
  return_datetime: string;
  end_odometer: number;
  end_fuel_level: string;
  exterior_condition: string;
  interior_condition: string;
  new_damages: Array<{ area: string; description: string; charge: number }>;
  missing_accessories: string[];
  late_hours: number;
  extra_mileage: number;
  extra_mileage_charge: number;
  fuel_charge: number;
  late_fee: number;
  damage_charge: number;
  cleaning_fee: number;
  total_additional_charges: number;
  photos: string[];
  inspected_by: string;
  notes?: string;
  customer_signature_url?: string;
  created_at: string;
}

export interface RentalContract {
  id: string;
  reservation_id: string;
  agency_id: string;
  contract_number: string;
  version: number;
  status: 'draft' | 'pending_signature' | 'signed' | 'amended';
  terms_text: string;
  full_contract_html?: string;
  customer_signed_at?: string;
  customer_signature_data?: string;
  staff_signed_at?: string;
  staff_signature_data?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  agency_id: string;
  reservation_id?: string;
  customer_id: string;
  customer?: Customer;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'voided';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online_stripe' | 'pos';

export interface Payment {
  id: string;
  agency_id: string;
  reservation_id?: string;
  invoice_id?: string;
  customer_id: string;
  customer?: Customer;
  reference: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_date: string;
  transaction_type: 'rental_fee' | 'deposit' | 'late_fee' | 'damage' | 'penalty';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway_reference?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface Deposit {
  id: string;
  agency_id: string;
  reservation_id: string;
  customer_id: string;
  customer?: Customer;
  required_amount: number;
  collected_amount: number;
  held_amount: number;
  deducted_amount: number;
  refunded_amount: number;
  status: 'pending' | 'collected' | 'partially_deducted' | 'fully_deducted' | 'refunded' | 'partially_refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DepositTransaction {
  id: string;
  deposit_id: string;
  agency_id: string;
  transaction_type: 'collection' | 'deduction' | 'refund';
  amount: number;
  reason: string;
  payment_method: PaymentMethod;
  recorded_by?: string;
  created_at: string;
}

export type ExpenseCategory = 
  | 'fuel' 
  | 'repairs' 
  | 'maintenance' 
  | 'insurance' 
  | 'registration' 
  | 'cleaning' 
  | 'tolls' 
  | 'parking' 
  | 'salaries' 
  | 'office' 
  | 'marketing' 
  | 'financing' 
  | 'other';

export interface Expense {
  id: string;
  agency_id: string;
  expense_number: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  vendor: string;
  payment_method: PaymentMethod;
  vehicle_id?: string;
  vehicle?: Vehicle;
  reservation_id?: string;
  description: string;
  receipt_url?: string;
  recorded_by?: string;
  created_at: string;
}

export type MaintenanceServiceType = 
  | 'routine_service' 
  | 'oil_change' 
  | 'tyres' 
  | 'brakes' 
  | 'battery' 
  | 'mechanical' 
  | 'accident_repair' 
  | 'inspection';

export interface VehicleMaintenance {
  id: string;
  agency_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  service_type: MaintenanceServiceType;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  odometer?: number;
  service_provider: string;
  estimated_cost: number;
  actual_cost?: number;
  next_service_date?: string;
  next_service_odometer?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  is_blocking_availability: boolean;
  invoice_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleFinancing {
  id: string;
  agency_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  lender_name: string;
  loan_reference: string;
  principal_amount: number;
  down_payment: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  payment_frequency: 'monthly' | 'quarterly' | 'annual';
  installment_amount: number;
  outstanding_balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  installments?: FinancingInstallment[];
}

export interface FinancingInstallment {
  id: string;
  financing_id: string;
  installment_number: number;
  due_date: string;
  principal_portion: number;
  interest_portion: number;
  total_installment: number;
  paid_date?: string;
  paid_amount?: number;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
}

export interface GpsDevice {
  id: string;
  agency_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  provider: 'wialon' | 'traccar' | 'teltonika' | 'simulator';
  device_identifier: string;
  imei?: string;
  sim_number?: string;
  status: 'online' | 'offline' | 'stationary' | 'moving';
  last_latitude: number;
  last_longitude: number;
  last_speed: number;
  last_heading: number;
  last_address?: string;
  last_telemetry_at: string;
  battery_level: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  agency_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  agency_id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  country: string;
  default_currency: string;
  timezone: string;
  date_format: string;
  address?: string;
  phone?: string;
  email: string;
  website?: string;
  registration_number?: string;
  tax_rate: number;
  invoice_prefix: string;
  contract_prefix: string;
  status: 'active' | 'suspended' | 'trial';
  is_public_booking_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgencyMember {
  id: string;
  agency_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'invited' | 'suspended';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface AgencySettings {
  agency_id: string;
  min_rental_hours: number;
  grace_period_minutes: number;
  late_return_hourly_rate: number;
  daily_mileage_limit: number;
  extra_mileage_charge: number;
  fuel_policy: 'same_to_same' | 'full_to_full' | 'prepaid';
  deposit_requirement_type: 'standard' | 'category_based' | 'none';
  min_driver_age: number;
  required_driver_documents: string[];
  brand_primary_color: string;
  terms_and_conditions: string;
  damage_policy: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number;
  trial_days: number;
  max_vehicles: number;
  max_staff: number;
  features: string[];
  is_active: boolean;
}
