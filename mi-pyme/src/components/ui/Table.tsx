"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  mobileCard?: boolean;
}

export function Table<T>({
  data,
  columns,
  className,
  emptyMessage = "No hay datos disponibles.",
  isLoading = false,
  onRowClick,
  rowKey,
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
  mobileCard = true,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface", className)}>
        <table className="w-full border-collapse text-sm" aria-busy={true}>
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "font-semibold py-3.5 px-4 text-xs uppercase tracking-wider text-muted-foreground",
                    compact && "py-2 px-3"
                  )}
                >
                  <div className="h-4 w-20 bg-surface-sunken animate-pulse rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key} className={cn("py-3.5 px-4", compact && "py-2 px-3")}>
                    <div className="h-4 w-24 bg-surface-sunken animate-pulse rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface", className)}>
        <div className="p-8 text-center">
          <p className="text-sm text-secondary">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface", className)}>
      <table
        className="hidden w-full border-collapse text-sm md:table"
        role="table"
        aria-label={emptyMessage}
      >
        <thead>
          <tr className="bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "font-semibold py-3.5 px-4 text-xs uppercase tracking-wider text-muted-foreground",
                  col.align === "left" && "text-left",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                  compact && "py-2 px-3",
                  col.headerClassName
                )}
                style={{ textAlign: col.align || "left" }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn("divide-y divide-border", bordered && "divide-border")}>
          {data.map((row, i) => {
            const key = rowKey ? rowKey(row) : String(i);
            return (
              <tr
                key={key}
                className={cn(
                  "transition-colors duration-150",
                  striped && "even:bg-muted/30",
                  hoverable && onRowClick && "cursor-pointer hover:bg-muted/50",
                  hoverable && !onRowClick && "hover:bg-muted/30",
                  compact && "py-2"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                aria-label={onRowClick ? "Seleccionar fila" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "py-3.5 px-4 align-middle",
                      col.align === "left" && "text-left",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      compact && "py-2 px-3",
                      col.className
                    )}
                    style={{ textAlign: col.align || "left" }}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {mobileCard && (
        <div className="md:hidden space-y-3 p-3">
          {data.map((row, i) => {
            const key = rowKey ? rowKey(row) : String(i);
            return (
              <div
                key={key}
                className={cn(
                  "rounded-lg border border-border-subtle bg-surface p-3 space-y-2",
                  hoverable && onRowClick && "cursor-pointer hover:bg-muted/30",
                  hoverable && !onRowClick && "hover:bg-muted/20"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between gap-2">
                    <span className="text-xs font-medium text-secondary">
                      {col.header}
                    </span>
                    <span className="text-sm text-foreground text-right">
                      {col.accessor(row)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Table.displayName = "Table";

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, cols = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-border bg-surface", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} scope="col" className="text-left font-semibold py-3.5 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border/50">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="py-3.5 px-4">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
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