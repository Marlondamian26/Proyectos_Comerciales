"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import * as React from "react";
import { Input } from "./Input";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label": string;
  disabled?: boolean;
  showClearButton?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  "aria-label": ariaLabel,
  disabled = false,
  showClearButton = true,
  className,
  ...props
}: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="relative w-full">
      <Input
        {...props}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        leftIcon={
          <Search className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        }
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
          ) : null
        }
        className={cn(
          "w-full h-11 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
          className
        )}
      />
    </div>
  );
}

SearchInput.displayName = "SearchInput";
