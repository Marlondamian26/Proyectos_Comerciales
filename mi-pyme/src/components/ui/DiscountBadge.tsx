"use client";

import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";
import * as React from "react";
import { Badge, type BadgeVariant } from "./Badge";

export type DiscountBadgeType = "percentage" | "fixed" | "free-shipping";

export interface DiscountBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  type: DiscountBadgeType;
  value?: number;
  originalPrice?: number;
  discountedPrice?: number;
  currency?: string;
  badgeVariant?: "promo" | "error" | "success" | "warning";
}

const badgeVariants: Record<
  NonNullable<DiscountBadgeProps["badgeVariant"]>,
  BadgeVariant
> = {
   promo: "promo",
  error: "error",
  success: "success",
  warning: "warning",
};

export function DiscountBadge({
  type,
  value,
  originalPrice,
  discountedPrice,
  currency = "USD",
  badgeVariant = "promo",
  className,
  ...props
}: DiscountBadgeProps) {
  const getContent = (): string => {
    switch (type) {
      case "percentage":
        return value !== undefined ? `-${value}%` : "";
      case "fixed":
        if (originalPrice && discountedPrice) {
          const amount = originalPrice - discountedPrice;
          const formatted = new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
          }).format(amount);
          return `Ahorras ${formatted}`;
        }
        return "";
      case "free-shipping":
        return "Envío gratis";
      default:
        return "";
    }
  };

  if (!getContent()) return null;

  return (
    <Badge
      variant={badgeVariants[badgeVariant]}
      size="sm"
      className={cn("font-semibold", className)}
      {...props}
    >
      <Tag className="h-3 w-3" aria-hidden="true" />
      <span>{getContent()}</span>
    </Badge>
  );
}

DiscountBadge.displayName = "DiscountBadge";