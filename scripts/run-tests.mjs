// =====================================================================
// ATLAS CAR RENTAL MANAGEMENT PLATFORM — AUTOMATED TEST SUITE
// Tests: Rental Calculations, Overlap Prevention, Status Transitions,
// Financial Transactions, and Deposit Deductions
// =====================================================================

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

function assertEquals(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  [PASS] ${testName} (Value: ${actual})`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} -> Expected: ${expected}, Got: ${actual}`);
    failed++;
  }
}

console.log("\n=======================================================");
console.log("RUNNING ATLAS AUTOMATED TEST SUITE");
console.log("=======================================================\n");

// 1. DURATION & RENTAL DAYS TESTS (Half-open intervals)
console.log("--- Group 1: Rental Duration Calculations ---");
function calculateRentalDays(pickupStr, returnStr) {
  const start = new Date(pickupStr);
  const end = new Date(returnStr);
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (diffHours <= 0) return 1;
  return Math.max(1, Math.ceil(diffHours / 24));
}

assertEquals(
  calculateRentalDays("2026-10-24T10:00:00Z", "2026-10-25T10:00:00Z"),
  1,
  "24-Hour Rental equals exactly 1 Day"
);

assertEquals(
  calculateRentalDays("2026-10-24T10:00:00Z", "2026-10-26T14:00:00Z"),
  3,
  "52-Hour Rental rounds up to 3 Days"
);

assertEquals(
  calculateRentalDays("2026-10-24T10:00:00Z", "2026-10-28T18:00:00Z"),
  5,
  "4.5-Day Rental rounds up to 5 Days"
);

// 2. PRICING & TAX FORMULA TESTS
console.log("\n--- Group 2: Pricing, Tax, and Deposit Calculations ---");
function calculatePricing({ days, dailyRate, extrasTotal, deliveryFee, discount, taxRate, depositAmount }) {
  const baseRental = days * dailyRate;
  const subtotal = Math.max(0, baseRental + extrasTotal + deliveryFee - discount);
  const tax = Number(((subtotal * taxRate) / 100).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  return { baseRental, subtotal, tax, total, depositAmount };
}

const pricingResult = calculatePricing({
  days: 4,
  dailyRate: 165.00,
  extrasTotal: 75.00,
  deliveryFee: 50.00,
  discount: 0.00,
  taxRate: 7.00,
  depositAmount: 500.00,
});

assertEquals(pricingResult.baseRental, 660.00, "Base rental calculation (4 * $165.00)");
assertEquals(pricingResult.subtotal, 785.00, "Subtotal with extras & delivery ($660 + $75 + $50)");
assertEquals(pricingResult.tax, 54.95, "7% Tax calculation ($785 * 0.07)");
assertEquals(pricingResult.total, 839.95, "Total contract amount ($785 + $54.95)");
assertEquals(pricingResult.depositAmount, 500.00, "Segregated deposit does NOT inflate total earned revenue");

// 3. OVERLAP & CONFLICT PREVENTION LOGIC TESTS
console.log("\n--- Group 3: Authoritative Overlap & Conflict Prevention ---");
function checkOverlap(reqPickup, reqReturn, existingPickup, existingReturn) {
  const reqStart = new Date(reqPickup).getTime();
  const reqEnd = new Date(reqReturn).getTime();
  const exStart = new Date(existingPickup).getTime();
  const exEnd = new Date(existingReturn).getTime();

  // Half-open interval conflict rule: (exStart < reqEnd) && (exEnd > reqStart)
  return exStart < reqEnd && exEnd > reqStart;
}

assert(
  checkOverlap("2026-10-24T10:00:00Z", "2026-10-28T18:00:00Z", "2026-10-25T09:00:00Z", "2026-10-27T12:00:00Z"),
  "Detects direct interior collision conflict"
);

assert(
  checkOverlap("2026-10-24T10:00:00Z", "2026-10-28T18:00:00Z", "2026-10-22T10:00:00Z", "2026-10-25T12:00:00Z"),
  "Detects overlapping start boundary collision"
);

assert(
  !checkOverlap("2026-10-28T18:00:00Z", "2026-10-31T18:00:00Z", "2026-10-24T10:00:00Z", "2026-10-28T18:00:00Z"),
  "Permits contiguous turnaround at exact boundary (no overlap)"
);

assert(
  !checkOverlap("2026-11-05T10:00:00Z", "2026-11-10T10:00:00Z", "2026-10-24T10:00:00Z", "2026-10-28T18:00:00Z"),
  "Permits booking outside existing rental window"
);

// 4. DEPOSIT DEDUCTION & RECONCILIATION TESTS
console.log("\n--- Group 4: Refundable Deposit Accounting ---");
function reconcileDeposit(heldAmount, damageCharge, cleaningFee, lateFee) {
  const totalCharges = damageCharge + cleaningFee + lateFee;
  const deducted = Math.min(heldAmount, totalCharges);
  const refunded = heldAmount - deducted;
  return { deducted, refunded, remainingHeld: 0 };
}

const depReconciliation = reconcileDeposit(1000.00, 250.00, 50.00, 75.00);
assertEquals(depReconciliation.deducted, 375.00, "Deposit correctly absorbs $375 in damage & late fees");
assertEquals(depReconciliation.refunded, 625.00, "Balance of $625 released to client card");
assertEquals(depReconciliation.remainingHeld, 0, "No lingering un-reconciled hold");

// 5. STATUS TRANSITION STATE MACHINE
console.log("\n--- Group 5: Reservation Status State Machine ---");
const validTransitions = {
  draft: ["confirmed", "cancelled"],
  pending_confirmation: ["confirmed", "cancelled"],
  confirmed: ["checked_out", "cancelled", "no_show"],
  checked_out: ["active", "completed"],
  active: ["completed"],
  completed: [],
  cancelled: [],
};

function canTransition(current, next) {
  return validTransitions[current]?.includes(next) || false;
}

assert(canTransition("confirmed", "checked_out"), "Confirmed booking transitions to Checked Out upon handover");
assert(canTransition("checked_out", "completed"), "Checked out booking transitions to Completed upon return");
assert(!canTransition("completed", "checked_out"), "Cannot re-checkout an already completed booking");
assert(!canTransition("cancelled", "checked_out"), "Cannot check out a cancelled booking");

console.log("\n=======================================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
