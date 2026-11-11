"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
  showInfo?: boolean;
  itemsPerPage?: number;
  totalItems?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
  showInfo = true,
  itemsPerPage,
  totalItems,
}: PaginationProps) {
  const generatePageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 5;
    if (totalPages <= totalNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    const leftLastShowMore = leftSiblingIndex > 2;
    const rightFirstShowMore = rightSiblingIndex < totalPages - 1;

    const truncatedStart = 1;
    const truncatedEnd = totalPages;

    const pages: (number | string)[] = [truncatedStart];

    if (leftLastShowMore) {
      pages.push("ellipsis-left");
    }

    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i);
    }

    if (rightFirstShowMore) {
      pages.push("ellipsis-right");
    }

    pages.push(truncatedEnd);

    return pages;
  };

  const pages = totalPages > 0 ? generatePageNumbers() : [1];
  const startItem = totalItems ? (currentPage - 1) * itemsPerPage! + 1 : 0;
  const endItem = totalItems
    ? Math.min(currentPage * itemsPerPage!, totalItems)
    : 0;

  const renderPageButton = (page: number | string, index: number) => {
    if (page === "ellipsis-left" || page === "ellipsis-right") {
      return (
        <span
          key={`${page}-${index}`}
          className="flex h-10 w-10 items-center justify-center text-sm text-secondary"
          aria-hidden="true"
        >
          <MoreHorizontal className="h-4 w-4" />
        </span>
      );
    }

    const isCurrent = page === currentPage;
    return (
      <button
        key={page}
        type="button"
        onClick={() => onPageChange(page as number)}
        disabled={isCurrent}
        aria-current={isCurrent ? "page" : undefined}
        aria-label={
          isCurrent ? `Página ${page} actual` : `Ir a página ${page}`
        }
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-default",
          isCurrent
            ? "bg-primary text-content-inverse"
            : "text-secondary hover:bg-muted hover:text-primary"
        )}
      >
        {page}
      </button>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4",
        className
      )}
    >
      {showInfo && totalItems !== undefined && itemsPerPage !== undefined && (
        <p className="text-sm text-secondary">
          Mostrando {startItem}-{endItem} de {totalItems} resultados
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            "border border-border-subtle bg-surface hover:bg-muted transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-0.5" role="navigation" aria-label="Paginación">
          {pages.map((page, index) => renderPageButton(page, index))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            "border border-border-subtle bg-surface hover:bg-muted transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

Pagination.displayName = "Pagination";