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
  width?: string | number;
  height?: string | number;
  lines?: number;
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
  width,
  height,
  lines,
  style,
  ...props
}: SkeletonProps) {
  const lineCount = lines ?? rows;

  if (variant === "text" && lineCount > 1) {
    return (
      <div
        className={cn("flex flex-col gap-2", className)}
        aria-hidden="true"
        {...props}
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "skeleton-shimmer h-4 rounded",
              i === lineCount - 1 && "w-3/4"
            )}
            style={{
              width: i === lineCount - 1 ? undefined : width,
              height,
              ...style,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "table-row" && count > 1) {
    return (
      <div className={cn("space-y-3", className)} aria-hidden="true" {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-4 w-full rounded"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-md",
        skeletonClasses[variant],
        className
      )}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}

Skeleton.displayName = "Skeleton";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border-subtle bg-surface p-4",
        className
      )}
      aria-hidden="true"
    >
      <Skeleton variant="rect" className="mb-4 aspect-square h-auto w-full" />
      <div className="space-y-3">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" className="h-8 w-8" />
          <Skeleton variant="text" className="h-4 w-1/3" />
        </div>
        <Skeleton variant="text" className="h-6 w-1/3" />
      </div>
    </div>
  );
}

ProductCardSkeleton.displayName = "ProductCardSkeleton";

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 rounded-lg border border-border-subtle bg-surface p-4"
        >
          <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

NotificationListSkeleton.displayName = "NotificationListSkeleton";

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
      <table className="w-full border-collapse text-sm" aria-hidden="true">
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
    <div className={cn("space-y-6", className)} aria-hidden="true">
      <div className="space-y-3">
        <Skeleton variant="text" className="h-8 w-1/3" />
        <Skeleton variant="text" className="h-4 w-1/2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
            <div className="flex items-center justify-between">
              <Skeleton variant="circle" className="h-10 w-10" />
              <Skeleton variant="badge" />
            </div>
            <Skeleton variant="text" className="h-4 w-3/4" />
            <Skeleton variant="text" className="h-6 w-1/2" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}

DashboardSkeleton.displayName = "DashboardSkeleton";