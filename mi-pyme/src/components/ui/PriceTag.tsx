"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface PriceTagProps
  extends React.HTMLAttributes<HTMLDivElement> {
  price: number;
  originalPrice?: number;
  currency?: string;
  discountBadge?: boolean;
  locale?: string;
  showInstallments?: boolean;
  installments?: number;
  size?: "sm" | "md" | "lg";
}

export function PriceTag({
  price,
  originalPrice,
  currency = "USD",
  discountBadge = true,
  locale = "es-ES",
  showInstallments,
  installments,
  size = "md",
  className,
  ...props
}: PriceTagProps) {
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice! - price) / originalPrice!) * 100)
    : 0;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {hasDiscount && discountBadge && discountPercent > 0 ? (
        <span className="rounded-full bg-success text-success-foreground px-2 py-0.5 text-xs font-bold">
          -{discountPercent}%
        </span>
      ) : null}
      <span className="font-bold text-primary">
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-secondary line-through">
          {formatPrice(originalPrice!)}
        </span>
      )}
      {showInstallments && installments && installments > 1 && (
        <span className="text-xs text-tertiary">
          {installments}x {formatPrice(price / installments)}
        </span>
      )}
    </div>
  );
}

PriceTag.displayName = "PriceTag";