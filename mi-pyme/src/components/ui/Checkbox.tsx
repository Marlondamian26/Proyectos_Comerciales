"use client";

import { cn } from "@/lib/utils";
import React, { forwardRef, useId } from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            "h-4 w-4 rounded border border-border-default text-interactive-primary",
            "focus:ring-2 focus:ring-interactive-primary focus:ring-offset-2 focus:ring-offset-surface-base",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-200",
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";