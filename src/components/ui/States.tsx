import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "./Button";

export type LoadingStateProps = {
  label?: string;
  language?: "en" | "hi";
  lines?: number;
  className?: string;
};

export function LoadingState({
  label,
  language = "en",
  lines = 3,
  className,
}: LoadingStateProps) {
  const defaultLabel =
    language === "hi"
      ? "आपकी सामग्री तैयार हो रही है…"
      : "Preparing your lesson…";

  return (
    <div
      className={cn("ds-state ds-state-loading", className)}
      role="status"
      aria-live="polite"
    >
      <div className="ds-shimmer-stack" aria-hidden="true">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "ds-shimmer-line",
              idx === lines - 1 && "ds-shimmer-short",
              idx === 1 && "ds-shimmer-medium",
            )}
          />
        ))}
      </div>
      <p className="ds-state-caption">
        <span className="ds-spinner" aria-hidden="true" />
        <span>{label ?? defaultLabel}</span>
      </p>
    </div>
  );
}

export type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn("ds-state ds-state-empty", className)}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h3 className="ds-state-title">{title}</h3>
      {description && <p className="ds-state-desc">{description}</p>}
      {children}
      {actionLabel && actionHref && (
        <div className="ds-state-actions">
          <ButtonLink href={actionHref} variant="primary">
            {actionLabel}
          </ButtonLink>
        </div>
      )}
      {actionLabel && !actionHref && onAction && (
        <div className="ds-state-actions">
          <Button type="button" variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export type ErrorStateProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  language?: "en" | "hi";
  className?: string;
};

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
  language = "en",
  className,
}: ErrorStateProps) {
  const isHindi = language === "hi";
  const resolvedTitle =
    title ?? (isHindi ? "थोड़ी रुकावट आई है" : "Something didn't load properly");
  const resolvedRetry =
    retryLabel ?? (isHindi ? "फिर से कोशिश करें" : "Try again");

  return (
    <div
      className={cn("ds-state ds-state-error", className)}
      role="alert"
      aria-live="assertive"
    >
      <div className="ds-state-error-head">
        <span className="ds-state-error-badge" aria-hidden="true">
          !
        </span>
        <div>
          <strong className="ds-state-error-title">{resolvedTitle}</strong>
          <p className="ds-state-error-msg">{message}</p>
        </div>
      </div>
      {onRetry && (
        <div className="ds-state-actions">
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            {resolvedRetry}
          </Button>
        </div>
      )}
    </div>
  );
}
