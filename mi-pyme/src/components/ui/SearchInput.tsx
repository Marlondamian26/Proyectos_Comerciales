"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import * as React from "react";
import { Input } from "./Input";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showClearButton?: boolean;
  loading?: boolean;
  onClear?: () => void;
}

export function SearchInput({
  onSearch,
  placeholder = "Buscar...",
  debounceMs = 300,
  showClearButton = true,
  loading = false,
  onClear,
  className,
  ...props
}: SearchInputProps) {
  const [value, setValue] = React.useState("");
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
    onClear?.();
  };

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          showClearButton && value.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              className="p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          ) : null
        }
        className={cn("pr-10", className)}
      />
    </div>
  );
}

SearchInput.displayName = "SearchInput";