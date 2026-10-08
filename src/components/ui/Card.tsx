import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "subtle" | "interactive" | "focus" | "tint";
export type CardPadding = "sm" | "md" | "lg";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "card",
        variant !== "default" && `card-${variant}`,
        `card-pad-${padding}`,
        className,
      )}
      {...props}
    />
  );
}
