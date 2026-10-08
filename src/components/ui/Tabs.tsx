"use client";

import { type ReactNode, type KeyboardEvent, useRef } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string = string> = {
  id: T;
  label: string;
  description?: string;
  badge?: ReactNode;
  disabled?: boolean;
};

export type TabsProps<T extends string = string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  variant?: "segmented" | "cards";
  className?: string;
};

export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  ariaLabel,
  variant = "segmented",
  className,
}: TabsProps<T>) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabledIndices = items
      .map((item, idx) => (!item.disabled ? idx : -1))
      .filter((idx) => idx !== -1);
    const currentPos = enabledIndices.indexOf(index);
    if (currentPos === -1) return;

    let nextPos: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextPos = (currentPos + 1) % enabledIndices.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextPos = (currentPos - 1 + enabledIndices.length) % enabledIndices.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextPos = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextPos = enabledIndices.length - 1;
    }

    if (nextPos !== null) {
      const targetIdx = enabledIndices[nextPos];
      tabRefs.current[targetIdx]?.focus();
      onChange(items[targetIdx].id);
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "ds-tabs",
        variant === "cards" ? "ds-tabs-cards" : "ds-tabs-segmented",
        className,
      )}
    >
      {items.map((item, index) => {
        const isSelected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "ds-tab",
              variant === "cards" ? "ds-tab-card" : "ds-tab-seg",
              isSelected && "active",
            )}
          >
            <div className="ds-tab-head">
              <span className="ds-tab-label">{item.label}</span>
              {item.badge}
            </div>
            {item.description && (
              <span className="ds-tab-desc">{item.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
