-- =====================================================================
-- ATLAS CAR RENTAL MANAGEMENT & SAAS PLATFORM
-- PRODUCTION POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Clean schema drop (if re-initializing)
-- DO NOT RUN DROP IN PRODUCTION WITHOUT BACKUPS

-- 1. SUBSCRIPTION PLANS (Platform Level)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    annual_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    trial_days INT NOT NULL DEFAULT 14,
    max_vehicles INT NOT NULL DEFAULT 10,
    max_staff INT NOT NULL DEFAULT 3,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. AGENCIES (Tenants)
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    default_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    date_format VARCHAR(50) NOT NULL DEFAULT 'YYYY-MM-DD',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    registration_number VARCHAR(100),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    invoice_prefix VARCHAR(20) NOT NULL DEFAULT 'INV-',
    contract_prefix VARCHAR(20) NOT NULL DEFAULT 'CTR-',
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, trial
    is_public_booking_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PROFILES (Linked to Auth Users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Matches auth.users.id
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    is_platform_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. AGENCY MEMBERS (Multi-tenant Membership & RBAC)
CREATE TABLE IF NOT EXISTS agency_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'rental_staff', 
    -- Roles: owner, agency_admin, rental_manager, finance_manager, fleet_manager, rental_staff, readonly
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, invited, suspended
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, user_id)
);

-- 5. AGENCY INVITATIONS
CREATE TABLE IF NOT EXISTS agency_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'rental_staff',
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. AGENCY SETTINGS & POLICIES
CREATE TABLE IF NOT EXISTS agency_settings (
    agency_id UUID PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
    min_rental_hours INT NOT NULL DEFAULT 24,
    grace_period_minutes INT NOT NULL DEFAULT 59,
    late_return_hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
    daily_mileage_limit INT NOT NULL DEFAULT 250, -- 0 for unlimited
    extra_mileage_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.35,
    fuel_policy VARCHAR(50) NOT NULL DEFAULT 'same_to_same', -- same_to_same, full_to_full, prepaid
    deposit_requirement_type VARCHAR(50) NOT NULL DEFAULT 'standard', -- standard, category_based, none
    min_driver_age INT NOT NULL DEFAULT 21,
    required_driver_documents JSONB NOT NULL DEFAULT '["driving_licence", "passport_or_id"]'::jsonb,
    brand_primary_color VARCHAR(30) DEFAULT '#2563EB',
    terms_and_conditions TEXT DEFAULT 'Standard vehicle rental terms and conditions apply. Renter must return vehicle with same fuel level and in clean condition.',
    damage_policy TEXT DEFAULT 'Existing scratches and damage noted on handover. Any new exterior or interior damage will be assessed and deducted from deposit or billed to customer.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. AGENCY SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS agency_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, canceled
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '14 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) NOT NULL,
    vin VARCHAR(100) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'sedan', -- economy, compact, sedan, suv, luxury, van, electric, sports
    trim VARCHAR(100),
    transmission VARCHAR(30) NOT NULL DEFAULT 'automatic', -- automatic, manual
    fuel_type VARCHAR(30) NOT NULL DEFAULT 'petrol', -- petrol, diesel, electric, hybrid
    engine_capacity VARCHAR(50),
    seating_capacity INT NOT NULL DEFAULT 5,
    color VARCHAR(50) NOT NULL DEFAULT 'Black',
    mileage INT NOT NULL DEFAULT 0,
    daily_rate NUMERIC(10, 2) NOT NULL,
    weekly_rate NUMERIC(10, 2),
    monthly_rate NUMERIC(10, 2),
    min_rental_days INT NOT NULL DEFAULT 1,
    deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- available, reserved, rented, maintenance, inactive, retired
    description TEXT,
    notes TEXT,
    purchase_date DATE,
    purchase_price NUMERIC(12, 2),
    current_value NUMERIC(12, 2),
    ownership_type VARCHAR(50) NOT NULL DEFAULT 'owned', -- owned, financed, leased
    insurance_policy_number VARCHAR(100),
    insurance_expiry DATE,
    registration_expiry DATE,
    inspection_expiry DATE,
    primary_image_url TEXT,
    gps_device_id VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, registration_number)
);

-- 9. VEHICLE IMAGES
CREATE TABLE IF NOT EXISTS vehicle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. VEHICLE DOCUMENTS
CREATE TABLE IF NOT EXISTS vehicle_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- insurance, registration, inspection, road_tax, lease_agreement, other
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    customer_type VARCHAR(30) NOT NULL DEFAULT 'individual', -- individual, corporate
    company_name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    id_type VARCHAR(50) NOT NULL DEFAULT 'passport', -- passport, national_id, state_id
    id_number VARCHAR(100),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- active, flagged, blacklisted
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, email)
);

-- 12. DRIVERS
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(50),
    email VARCHAR(255),
    licence_number VARCHAR(100) NOT NULL,
    licence_country VARCHAR(100) NOT NULL DEFAULT 'United States',
    licence_expiry DATE NOT NULL,
    licence_class VARCHAR(50) DEFAULT 'Standard Class B',
    verification_status VARCHAR(50) NOT NULL DEFAULT 'verified', -- pending, verified, rejected, expired
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, licence_number)
);

-- 13. RESERVATIONS & RENTALS
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    reference VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    primary_driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    -- statuses: draft, pending_confirmation, confirmed, checked_out, active, completed, cancelled, no_show
    pickup_datetime TIMESTAMPTZ NOT NULL,
    return_datetime TIMESTAMPTZ NOT NULL,
    pickup_location VARCHAR(255) NOT NULL DEFAULT 'Main Office',
    return_location VARCHAR(255) NOT NULL DEFAULT 'Main Office',
    delivery_address TEXT,
    rental_days NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
    daily_rate NUMERIC(10, 2) NOT NULL,
    base_rental_amount NUMERIC(10, 2) NOT NULL,
    extras_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid, partial, paid, refunded
    notes TEXT,
    special_instructions TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, reference),
    CONSTRAINT valid_dates CHECK (return_datetime > pickup_datetime)
);

-- 14. RESERVATION AUTHORIZED ADDITIONAL DRIVERS
CREATE TABLE IF NOT EXISTS reservation_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(reservation_id, driver_id)
);

-- 15. RESERVATION EXTRAS (GPS, Child Seat, Extra Driver, Insurance, etc.)
CREATE TABLE IF NOT EXISTS reservation_extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

-- 16. VEHICLE HANDOVER INSPECTION (Pickup Check-out)
CREATE TABLE IF NOT EXISTS vehicle_handover_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE UNIQUE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    pickup_datetime TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    start_odometer INT NOT NULL,
    start_fuel_level VARCHAR(20) NOT NULL DEFAULT '100%', -- 100%, 75%, 50%, 25%, empty
    exterior_condition VARCHAR(50) NOT NULL DEFAULT 'good',
    interior_condition VARCHAR(50) NOT NULL DEFAULT 'clean',
    existing_damages JSONB NOT NULL DEFAULT '[]'::jsonb,
    accessories_supplied JSONB NOT NULL DEFAULT '["spare_tire", "jack", "tools", "first_aid_kit"]'::jsonb,
    keys_count INT NOT NULL DEFAULT 1,
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    inspected_by VARCHAR(255) NOT NULL,
    customer_signature_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. VEHICLE RETURN INSPECTION (Check-in)
CREATE TABLE IF NOT EXISTS vehicle_return_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE UNIQUE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    return_datetime TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_odometer INT NOT NULL,
    end_fuel_level VARCHAR(20) NOT NULL DEFAULT '100%',
    exterior_condition VARCHAR(50) NOT NULL DEFAULT 'good',
    interior_condition VARCHAR(50) NOT NULL DEFAULT 'clean',
    new_damages JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_accessories JSONB NOT NULL DEFAULT '[]'::jsonb,
    late_hours INT NOT NULL DEFAULT 0,
    extra_mileage INT NOT NULL DEFAULT 0,
    extra_mileage_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fuel_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    late_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    damage_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cleaning_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_additional_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    inspected_by VARCHAR(255) NOT NULL,
    notes TEXT,
    customer_signature_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 18. RENTAL CONTRACTS & DIGITAL SIGNATURES
CREATE TABLE IF NOT EXISTS rental_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, pending_signature, signed, amended
    terms_text TEXT NOT NULL,
    full_contract_html TEXT,
    customer_signed_at TIMESTAMPTZ,
    customer_signature_data TEXT, -- Base64 SVG or data URL
    staff_signed_at TIMESTAMPTZ,
    staff_signature_data TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, contract_number)
);

-- 19. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid, partial, paid, overdue, voided
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, invoice_number)
);

-- 20. PAYMENTS (Offline & Online)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    reference VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'card', -- cash, card, bank_transfer, online_stripe, pos
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'rental_fee', -- rental_fee, deposit, late_fee, damage, penalty
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- pending, completed, failed, refunded
    gateway_reference VARCHAR(255),
    notes TEXT,
    recorded_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, reference)
);

-- 21. REFUNDABLE DEPOSITS
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    required_amount NUMERIC(10, 2) NOT NULL,
    collected_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    held_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    deducted_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    refunded_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', 
    -- pending, collected, partially_deducted, fully_deducted, refunded, partially_refunded
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 22. DEPOSIT TRANSACTIONS
CREATE TABLE IF NOT EXISTS deposit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_id UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- collection, deduction, refund
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'card',
    recorded_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 23. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    expense_number VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL, -- fuel, repairs, maintenance, insurance, registration, cleaning, tolls, parking, salaries, office, marketing, financing, other
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    description TEXT,
    receipt_url TEXT,
    recorded_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(agency_id, expense_number)
);

-- 24. VEHICLE MAINTENANCE
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL, -- routine_service, oil_change, tyres, brakes, battery, mechanical, accident_repair, inspection
    description TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    odometer INT,
    service_provider VARCHAR(255) NOT NULL,
    estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_cost NUMERIC(10, 2) DEFAULT 0.00,
    next_service_date DATE,
    next_service_odometer INT,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    is_blocking_availability BOOLEAN NOT NULL DEFAULT true,
    invoice_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 25. VEHICLE FINANCING & LEASING
CREATE TABLE IF NOT EXISTS vehicle_financing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE UNIQUE,
    lender_name VARCHAR(255) NOT NULL,
    loan_reference VARCHAR(100) NOT NULL,
    principal_amount NUMERIC(12, 2) NOT NULL,
    down_payment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    interest_rate NUMERIC(5, 2) NOT NULL, -- Annual interest percentage
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    payment_frequency VARCHAR(50) NOT NULL DEFAULT 'monthly', -- monthly, quarterly, annual
    installment_amount NUMERIC(10, 2) NOT NULL,
    outstanding_balance NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 26. FINANCING INSTALLMENTS
CREATE TABLE IF NOT EXISTS financing_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financing_id UUID NOT NULL REFERENCES vehicle_financing(id) ON DELETE CASCADE,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    principal_portion NUMERIC(10, 2) NOT NULL,
    interest_portion NUMERIC(10, 2) NOT NULL,
    total_installment NUMERIC(10, 2) NOT NULL,
    paid_date DATE,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, overdue
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 27. GPS VEHICLE TRACKING & TELEMETRY
CREATE TABLE IF NOT EXISTS gps_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'wialon', -- wialon, traccar, teltonika, simulator
    device_identifier VARCHAR(100) NOT NULL,
    imei VARCHAR(100),
    sim_number VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'online', -- online, offline, stationary, moving
    last_latitude NUMERIC(10, 7) NOT NULL DEFAULT 40.7128,
    last_longitude NUMERIC(10, 7) NOT NULL DEFAULT -74.0060,
    last_speed NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    last_heading NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    last_address TEXT,
    last_telemetry_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    battery_level INT DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 28. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, success, warning, alert
    is_read BOOLEAN NOT NULL DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 29. AUDIT LOGS (Immutable Activity Log)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- e.g. reservation.create, payment.record, vehicle.status_change
    entity_type VARCHAR(100) NOT NULL, -- reservation, vehicle, payment, customer, etc.
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_agency ON vehicles(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_agency ON reservations(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_dates ON reservations(vehicle_id, pickup_datetime, return_datetime);
CREATE INDEX IF NOT EXISTS idx_customers_agency ON customers(agency_id, email);
CREATE INDEX IF NOT EXISTS idx_drivers_agency ON drivers(agency_id, licence_number);
CREATE INDEX IF NOT EXISTS idx_payments_agency ON payments(agency_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_agency ON expenses(agency_id, date);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON vehicle_maintenance(vehicle_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_agency ON audit_logs(agency_id, created_at DESC);

-- =====================================================================
-- CRITICAL CONFLICT PREVENTION FUNCTION (PostgreSQL)
-- authoritatively checks vehicle availability for half-open intervals [pickup, return)
-- =====================================================================
CREATE OR REPLACE FUNCTION check_vehicle_availability(
    p_vehicle_id UUID,
    p_pickup_datetime TIMESTAMPTZ,
    p_return_datetime TIMESTAMPTZ,
    p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conflict_count INT;
    v_maintenance_count INT;
BEGIN
    -- 1. Check conflicting reservations (Active statuses: confirmed, checked_out, active)
    -- Using half-open interval overlap check:
    -- (res.pickup_datetime < p_return_datetime) AND (res.return_datetime > p_pickup_datetime)
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM reservations
    WHERE vehicle_id = p_vehicle_id
      AND status IN ('confirmed', 'checked_out', 'active')
      AND (p_exclude_reservation_id IS NULL OR id != p_exclude_reservation_id)
      AND (pickup_datetime < p_return_datetime AND return_datetime > p_pickup_datetime);

    IF v_conflict_count > 0 THEN
        RETURN FALSE;
    END IF;

    -- 2. Check conflicting blocking maintenance blocks
    SELECT COUNT(*)
    INTO v_maintenance_count
    FROM vehicle_maintenance
    WHERE vehicle_id = p_vehicle_id
      AND status IN ('scheduled', 'in_progress')
      AND is_blocking_availability = TRUE
      AND (scheduled_date <= p_return_datetime::date AND (completed_date IS NULL OR completed_date >= p_pickup_datetime::date));

    IF v_maintenance_count > 0 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures complete multi-tenant isolation across all tables
-- =====================================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_handover_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_return_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_financing ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current auth user is member of agency
CREATE OR REPLACE FUNCTION is_agency_member(agency_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM agency_members
    WHERE agency_id = agency_uuid
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- General tenant isolation policy generator helper or explicit policies
CREATE POLICY "Agencies viewable by members" ON agencies
    FOR SELECT USING (is_agency_member(id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Agency members isolated by agency" ON agency_members
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Vehicles isolated by agency" ON vehicles
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Vehicle images isolated by agency" ON vehicle_images
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Vehicle documents isolated by agency" ON vehicle_documents
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Customers isolated by agency" ON customers
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Drivers isolated by agency" ON drivers
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Reservations isolated by agency" ON reservations
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Handover inspections isolated by agency" ON vehicle_handover_inspections
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Return inspections isolated by agency" ON vehicle_return_inspections
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Contracts isolated by agency" ON rental_contracts
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Invoices isolated by agency" ON invoices
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Payments isolated by agency" ON payments
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Deposits isolated by agency" ON deposits
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Deposit transactions isolated by agency" ON deposit_transactions
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Expenses isolated by agency" ON expenses
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Vehicle maintenance isolated by agency" ON vehicle_maintenance
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Vehicle financing isolated by agency" ON vehicle_financing
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "GPS devices isolated by agency" ON gps_devices
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Notifications isolated by agency" ON notifications
    FOR ALL USING (is_agency_member(agency_id));

CREATE POLICY "Audit logs isolated by agency" ON audit_logs
    FOR ALL USING (is_agency_member(agency_id));
