"use client";

import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import * as React from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
  selected?: boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: "checkbox" | "radio" | "range" | "select";
  options?: FilterOption[];
  selected?: string | string[];
  min?: number;
  max?: number;
  step?: number;
  onChange: (groupId: string, value: string | string[]) => void;
}

export interface FacetedFilterProps {
  groups: FilterGroup[];
  onFilterChange: (groupId: string, value: string | string[]) => void;
  onClearAll: () => void;
  className?: string;
  compact?: boolean;
}

export function FacetedFilter({
  groups,
  onFilterChange,
  onClearAll,
  className,
  compact = false,
}: FacetedFilterProps) {
  const activeFilters = groups.flatMap((g) => {
    const selected = Array.isArray(g.selected) ? g.selected : g.selected ? [g.selected] : [];
    return selected.map((v) => {
      const opt = g.options?.find((o) => o.value === v);
      return opt ? { id: opt.id, label: opt.label, groupId: g.id, groupLabel: g.label } : null;
    }).filter(Boolean) as Array<{ id: string; label: string; groupId: string; groupLabel: string }>;
  });

  const handleRemoveFilter = (_groupId: string) => {
    onFilterChange(_groupId, []);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-secondary" aria-hidden="true" />
          <h3 className="font-semibold text-foreground">Filtros</h3>
          {activeFilters.length > 0 && (
            <Badge variant="outline" size="sm">
              {activeFilters.length} activos
            </Badge>
          )}
        </div>
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            aria-label="Limpiar todos los filtros"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Filtros activos">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="outline"
              size="md"
              className="flex items-center gap-1.5"
            >
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveFilter(filter.groupId)}
                aria-label={`Quitar filtro ${filter.label}`}
                className="rounded-full p-0.5 text-secondary hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group) => (
          <FilterGroupUI
            key={group.id}
            group={group}
            onFilterChange={onFilterChange}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

function FilterGroupUI({
  group,
  onFilterChange,
  compact,
}: {
  group: FilterGroup;
  onFilterChange: (groupId: string, value: string | string[]) => void;
  compact?: boolean;
}) {
  const selectedArray = Array.isArray(group.selected)
    ? group.selected
    : group.selected
      ? [group.selected]
      : [];

  const handleToggle = (value: string) => {
    if (group.type === "radio") {
      onFilterChange(group.id, value);
    } else {
      const newValue = selectedArray.includes(value)
        ? selectedArray.filter((v) => v !== value)
        : [...selectedArray, value];
      onFilterChange(group.id, newValue);
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: "min" | "max") => {
    const val = parseInt(e.target.value, 10);
    const current = Array.isArray(group.selected) ? [...group.selected] : [group.selected ?? "", ""];
    if (type === "min") {
      current[0] = String(val);
    } else {
      current[1] = String(val);
    }
    onFilterChange(group.id, current.filter(Boolean));
  };

  return (
    <div className="border-b border-border-subtle pb-3 last:border-0">
      <h4 className="text-sm font-medium text-foreground mb-2">{group.label}</h4>

      {group.type === "range" && group.min !== undefined && group.max !== undefined && (
        <div className="space-y-2">
          <input
            type="range"
            min={group.min}
            max={group.max}
            step={group.step ?? 1}
            value={selectedArray[0] ?? group.min}
            onChange={(e) => handleRangeChange(e, "min")}
            className="w-full"
            aria-label={`Rango de precio`}
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={group.min}
              max={group.max}
              placeholder={String(group.min)}
              value={selectedArray[0] ?? ""}
              onChange={(e) =>
                onFilterChange(group.id, [e.target.value, selectedArray[1] ?? ""])
              }
              className="w-1/2 rounded-lg border border-border-subtle px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="number"
              min={group.min}
              max={group.max}
              placeholder={String(group.max)}
              value={selectedArray[1] ?? ""}
              onChange={(e) =>
                onFilterChange(group.id, [selectedArray[0] ?? "", e.target.value])
              }
              className="w-1/2 rounded-lg border border-border-subtle px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {group.type !== "range" && group.options && (
        <div className={cn("flex flex-col gap-1.5", !compact && "gap-2")}>
          {group.options.map((option) => {
            const isSelected = selectedArray.includes(option.value);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleToggle(option.value)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-200",
                  isSelected
                    ? "bg-primary/10 text-primary border-2 border-primary/20"
                    : "hover:bg-muted/50 text-secondary border border-transparent",
                  compact ? "text-xs py-1.5" : "text-sm"
                )}
                aria-pressed={isSelected}
              >
                <span>{option.label}</span>
                <div className="flex items-center gap-2">
                  {option.count !== undefined && option.count > 0 && (
                    <Badge variant="default" size="sm">
                      {option.count}
                    </Badge>
                  )}
                  {isSelected && (
                    <div
                      className="h-4 w-4 rounded-sm bg-primary text-content-inverse flex items-center justify-center"
                      aria-hidden="true"
                    >
                      ✓
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

FacetedFilter.displayName = "FacetedFilter";