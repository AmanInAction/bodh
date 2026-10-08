import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  icon?: ReactNode;
};

const DEFAULT_ICONS: Record<BadgeVariant, string | null> = {
  neutral: null,
  primary: null,
  success: "✓",
  warning: "△",
  error: "!",
  info: "i",
};

export function Badge({
  variant = "neutral",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  const resolvedIcon = icon !== undefined ? icon : DEFAULT_ICONS[variant];

  return (
    <span
      className={cn("ds-badge", `ds-badge-${variant}`, className)}
      {...props}
    >
      {resolvedIcon && (
        <span className="ds-badge-icon" aria-hidden="true">
          {resolvedIcon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
