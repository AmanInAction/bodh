import { cn } from "@/lib/utils";

export type ProgressBarProps = {
  value: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning";
  className?: string;
};

export function ProgressBar({
  value,
  label,
  showValue = false,
  size = "md",
  variant = "primary",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("ds-progress-wrap", className)}>
      {(label || showValue) && (
        <div className="ds-progress-header">
          {label && <span className="ds-progress-label">{label}</span>}
          {showValue && <span className="ds-progress-value">{clamped}%</span>}
        </div>
      )}
      <div
        className={cn(
          "progress-track",
          `progress-track-${size}`,
          `progress-track-${variant}`,
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${clamped}%` : `${clamped}% complete`}
      >
        <span style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
