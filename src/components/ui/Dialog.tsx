"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeLabel = "Close",
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={cn("ds-dialog", className)}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-labelledby="ds-dialog-title"
      aria-describedby={description ? "ds-dialog-desc" : undefined}
    >
      <div className="ds-dialog-panel">
        <div className="ds-dialog-header">
          <div>
            <h2 id="ds-dialog-title" className="ds-dialog-title">
              {title}
            </h2>
            {description && (
              <p id="ds-dialog-desc" className="ds-dialog-desc">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="ds-dialog-close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ✕
          </button>
        </div>
        <div className="ds-dialog-body">{children}</div>
        {footer && <div className="ds-dialog-footer">{footer}</div>}
      </div>
    </dialog>
  );
}
