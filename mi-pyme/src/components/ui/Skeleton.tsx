"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export type SkeletonVariant =
  | "text"
  | "rect"
  | "circle"
  | "product-card"
  | "table-row"
  | "avatar"
  | "badge";

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  rows?: number;
  count?: number;
}

const skeletonClasses: Record<SkeletonVariant, string> = {
  text: "h-4 w-full",
  rect: "h-4 w-full",
  circle: "h-10 w-10 rounded-full",
  avatar: "h-10 w-10 rounded-full",
  badge: "h-5 w-16 rounded-full",
  "product-card": "h-64 w-full rounded-xl",
  "table-row": "h-4 w-full",
};

export function Skeleton({
  className,
  variant = "text",
  rows = 1,
  count = 1,
  ...props
}: SkeletonProps) {
  if (variant === "text" && rows > 1) {
    return (
      <div
        className={cn("flex flex-col gap-2", className)}
        aria-label="Cargando..."
        {...props}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse rounded bg-surface-sunken",
              i === rows - 1 && "w-3/4",
              "h-4"
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === "table-row" && count > 1) {
    return (
      <div className={cn("space-y-3", className)} aria-label="Cargando...">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded bg-surface-sunken h-4 w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse rounded bg-surface-sunken",
        skeletonClasses[variant],
        className
      )}
      aria-label="Cargando..."
      {...props}
    />
  );
}

Skeleton.displayName = "Skeleton";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface p-4 space-y-3",
        className
      )}
      aria-label="Cargando producto..."
    >
      <Skeleton variant="product-card" className="aspect-square w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <Skeleton variant="text" className="h-6 w-1/3" />
      </div>
    </div>
  );
}

ProductCardSkeleton.displayName = "ProductCardSkeleton";

export function TableSkeleton({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border bg-surface", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} scope="col" className="text-left font-medium py-3.5 px-4">
                <Skeleton variant="text" className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="py-3.5 px-4">
                  <Skeleton variant="text" className="h-4 w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

TableSkeleton.displayName = "TableSkeleton";

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton variant="circle" className="h-10 w-10" />
            <Skeleton variant="badge" />
          </div>
          <Skeleton variant="text" className="h-4 w-3/4" />
          <Skeleton variant="text" className="h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
}

DashboardSkeleton.displayName = "DashboardSkeleton";