import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInHours } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined, currency: string = "USD"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return "$0.00";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

export function formatDate(dateString: string | Date | null | undefined, formatString: string = "MMM dd, yyyy"): string {
  if (!dateString) return "N/A";
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, formatString);
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, "MMM dd, yyyy HH:mm");
  } catch {
    return String(dateString);
  }
}

export function calculateRentalDays(pickup: string | Date, returnDate: string | Date): number {
  try {
    const start = typeof pickup === "string" ? new Date(pickup) : pickup;
    const end = typeof returnDate === "string" ? new Date(returnDate) : returnDate;
    const hours = differenceInHours(end, start);
    if (hours <= 0) return 1;
    // Any fraction of 24h over 1 hour counts as an additional day
    const days = Math.ceil(hours / 24);
    return Math.max(1, days);
  } catch {
    return 1;
  }
}

export function generateReference(prefix: string = "REF"): string {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomPart}`;
}

export function getStatusColor(status: string): { bg: string; text: string; border: string; dot: string } {
  switch (status.toLowerCase()) {
    case "available":
    case "active":
    case "completed":
    case "paid":
    case "verified":
    case "online":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500",
      };
    case "reserved":
    case "pending":
    case "pending_confirmation":
    case "draft":
    case "partial":
    case "trialing":
    case "scheduled":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
      };
    case "rented":
    case "checked_out":
    case "in_progress":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500",
      };
    case "maintenance":
    case "overdue":
    case "cancelled":
    case "failed":
    case "expired":
    case "blacklisted":
    case "suspended":
    case "past_due":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-400",
        border: "border-rose-200 dark:border-rose-800",
        dot: "bg-rose-500",
      };
    default:
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400",
      };
  }
}
