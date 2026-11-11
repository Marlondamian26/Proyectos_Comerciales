"use client";

import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import * as React from "react";

export interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  label?: string;
  inputId?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  showButtons?: boolean;
}

export function QuantitySelector({
  quantity,
  min = 1,
  max = 99,
  step = 1,
  onChange,
  onIncrement,
  onDecrement,
  label = "Cantidad",
  inputId,
  size = "md",
  disabled = false,
  showButtons = true,
}: QuantitySelectorProps) {
  const generatedId = React.useId();
  const id = inputId || generatedId;
  const [inputValue, setInputValue] = React.useState(String(quantity));

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(String(quantity));
  }, [quantity]);

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Math.min(quantity + step, max);
    if (newValue !== quantity) {
      setInputValue(String(newValue));
      onChange(newValue);
      onIncrement?.();
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(quantity - step, min);
    if (newValue !== quantity) {
      setInputValue(String(newValue));
      onChange(newValue);
      onDecrement?.();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const clamped = Math.max(min, Math.min(numValue, max));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < min) {
      const clamped = min;
      setInputValue(String(clamped));
      onChange(clamped);
    } else if (numValue > max) {
      setInputValue(String(max));
      onChange(max);
    } else {
      setInputValue(String(numValue));
    }
  };

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-base",
    lg: "h-12 text-lg",
  };

  const buttonSizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex items-center">
        {showButtons && (
          <button
            type="button"
            id={`${id}-decrement`}
            onClick={handleDecrement}
            disabled={disabled || quantity <= min}
            aria-label={`Restar ${label.toLowerCase()}`}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-l-lg border-r-0",
              "bg-muted/50 text-secondary hover:bg-muted hover:text-primary",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors duration-200",
              sizeClasses[size],
              buttonSizeClasses[size]
            )}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          aria-label={label}
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          className={cn(
            "w-12 border-0 text-center font-medium",
            "focus:outline-none focus:ring-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            "spin-button-none",
            sizeClasses[size]
          )}
        />
        {showButtons && (
          <button
            type="button"
            id={`${id}-increment`}
            onClick={handleIncrement}
            disabled={disabled || quantity >= max}
            aria-label={`Agregar ${label.toLowerCase()}`}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-r-lg border-l-0",
              "bg-muted/50 text-secondary hover:bg-muted hover:text-primary",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors duration-200",
              sizeClasses[size],
              buttonSizeClasses[size]
            )}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

QuantitySelector.displayName = "QuantitySelector";