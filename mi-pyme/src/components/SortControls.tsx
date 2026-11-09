"use client";

import { Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type SortOption = "popularity-desc" | "popularity-asc" | "alpha-asc" | "alpha-desc";

interface SortControlsProps {
  currentSort: SortOption;
}

export function SortControls({ currentSort }: SortControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const options: { value: SortOption; label: string }[] = [
    { value: "popularity-desc", label: "Más populares" },
    { value: "popularity-asc", label: "Menos populares" },
    { value: "alpha-asc", label: "A - Z" },
    { value: "alpha-desc", label: "Z - A" },
  ];

  const [selectedSort, setSelectedSort] = useState<SortOption>(currentSort);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSortChange = useCallback(
    (value: SortOption) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", value);
        const query = params.toString();
        router.replace(query ? `/?${query}` : "/", { scroll: false });
        setSelectedSort(value);
      }, 300);
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-4 w-4" />
        <span>Ordenar por:</span>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ordenar resultados">
        {options.map((opt) => {
          const isActive = selectedSort === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleSortChange(opt.value)}
              className={cn(
                "text-sm px-3 py-1.5 rounded-lg border transition-colors min-h-[44px]",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50 text-foreground"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
