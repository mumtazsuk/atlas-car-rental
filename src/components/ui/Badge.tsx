import React from "react";
import { getStatusColor, cn } from "@/lib/utils";

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
  showDot?: boolean;
}

export function Badge({ status, label, className, showDot = true }: BadgeProps) {
  const styles = getStatusColor(status);
  const formattedLabel = label || status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />}
      {formattedLabel}
    </span>
  );
}
