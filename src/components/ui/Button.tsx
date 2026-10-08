import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type BaseStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

export function getButtonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: BaseStyleProps = {}) {
  return cn(
    "button",
    `button-${variant}`,
    `button-${size}`,
    fullWidth && "full-button",
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  BaseStyleProps & {
    loading?: boolean;
    loadingLabel?: string;
  };

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="ds-spinner" aria-hidden="true" />}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

export type ButtonLinkProps = LinkProps &
  BaseStyleProps & {
    children: ReactNode;
    ariaLabel?: string;
  };

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  ariaLabel,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClasses({ variant, size, fullWidth, className })}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Link>
  );
}
