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
}: TableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-border bg-surface", className)}>
      <table
        className="w-full border-collapse text-sm"
        role="table"
        aria-busy={isLoading}
        aria-label={emptyMessage}
      >
        <thead>
          <tr className="bg-muted/50 border-b border-border">
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
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-muted-foreground">Cargando...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center">
                <span className="text-sm text-muted-foreground">{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
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
            })
          )}
        </tbody>
      </table>
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