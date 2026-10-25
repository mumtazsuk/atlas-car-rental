import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  iconColor?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconColor = "text-brand-600 bg-brand-50 dark:bg-brand-950/40",
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all",
        onClick && "cursor-pointer hover:border-brand-300 dark:hover:border-brand-700"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={cn("p-2 rounded-lg", iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded",
              trend.isNeutral
                ? "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                : trend.isPositive
                ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
