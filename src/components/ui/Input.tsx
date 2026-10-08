import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, rightSlot, className, ...props },
  ref,
) {
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  const errorId = inputId && error ? `${inputId}-error` : undefined;
  const hintId = inputId && hint ? `${inputId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="ds-field">
      {label && (
        <label htmlFor={inputId} className="ds-label">
          {label}
        </label>
      )}
      <div className="ds-input-wrap">
        <input
          ref={ref}
          id={inputId}
          className={cn("ds-input", error && "ds-input-error", className)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {rightSlot && <div className="ds-input-slot">{rightSlot}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="ds-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="ds-field-error" role="alert">
          <span aria-hidden="true">!</span> {error}
        </p>
      )}
    </div>
  );
});
