"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastProps = {
  variant?: ToastVariant;
  title?: string;
  message: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
};

const ICONS: Record<ToastVariant, string> = {
  info: "i",
  success: "✓",
  warning: "△",
  error: "!",
};

export function Toast({
  variant = "info",
  title,
  message,
  onDismiss,
  dismissLabel = "Dismiss notification",
  className,
}: ToastProps) {
  return (
    <div
      className={cn("ds-toast", `ds-toast-${variant}`, className)}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      <span className="ds-toast-icon" aria-hidden="true">
        {ICONS[variant]}
      </span>
      <div className="ds-toast-content">
        {title && <strong className="ds-toast-title">{title}</strong>}
        <div className="ds-toast-msg">{message}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="ds-toast-close"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          ✕
        </button>
      )}
    </div>
  );
}
