"use client";

import { Star } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type SortOption = "popularity-desc" | "popularity-asc" | "alpha-asc" | "alpha-desc";

interface SortControlsProps {
  currentSort: SortOption;
}

export function SortControls({ currentSort }: SortControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const options: { value: SortOption; label: string }[] = [
    { value: "popularity-desc", label: "Más populares" },
    { value: "popularity-asc", label: "Menos populares" },
    { value: "alpha-asc", label: "A - Z" },
    { value: "alpha-desc", label: "Z - A" },
  ];

  const handleSortChange = (value: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-4 w-4" />
        <span>Ordenar por:</span>
      </div>
      <select
        value={currentSort}
        onChange={(event) => handleSortChange(event.target.value as SortOption)}
        className="bg-background border-border hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary text-sm px-3 py-1.5 rounded-lg border appearance-none bg-no-repeat bg-right pr-8"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundSize: '1.5rem 1.5rem',
        }}
        aria-label="Ordenar resultados"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}