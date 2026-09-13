"use client";

import { cn } from "@/lib/utils";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  passwordToggle?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  passwordToggle = false,
  className,
  id,
  type,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && passwordToggle ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-foreground tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center group">
        {leftIcon && (
          <span
            className={cn(
              "absolute left-3.5 flex items-center transition-colors duration-200 pointer-events-none",
              "text-muted-foreground group-focus-within:text-primary"
            )}
          >
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          type={inputType}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-background/80 px-3.5 py-2.5 text-sm transition-all duration-200",
            "ring-offset-background placeholder:text-muted-foreground/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            "shadow-theme-sm hover:shadow-theme-md focus-visible:shadow-theme-glow",
            leftIcon && "pl-10.5",
            rightIcon || (isPassword && passwordToggle) ? "pr-10.5" : "pr-3.5",
            error && "border-destructive/60 focus-visible:ring-destructive focus-visible:border-destructive/50",
            "border-border",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {isPassword && passwordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={cn(
              "absolute right-3 flex items-center justify-center p-1 rounded-md",
              "text-muted-foreground hover:text-foreground transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            )}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
        {!isPassword && rightIcon && (
          <span
            className={cn(
              "absolute right-3.5 flex items-center transition-colors duration-200 pointer-events-none",
              "text-muted-foreground group-focus-within:text-primary"
            )}
          >
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-destructive font-medium"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          id={`${inputId}-hint`}
          className="text-xs text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
}

export function Textarea({
  label,
  error,
  hint,
  rows = 4,
  className,
  id,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-sm font-semibold text-foreground tracking-wide"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          "flex w-full rounded-lg border bg-background/80 px-3.5 py-2.5 text-sm transition-all duration-200",
          "ring-offset-background placeholder:text-muted-foreground/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          "shadow-theme-sm hover:shadow-theme-md focus-visible:shadow-theme-glow",
          error && "border-destructive/60 focus-visible:ring-destructive focus-visible:border-destructive/50",
          "border-border",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
        }
        {...props}
      />
      {error && (
        <p
          id={`${textareaId}-error`}
          className="text-sm text-destructive font-medium"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          id={`${textareaId}-hint`}
          className="text-xs text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  className,
  id,
  placeholder,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-semibold text-foreground tracking-wide"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "flex h-11 w-full rounded-lg border bg-background/80 px-3.5 py-2.5 text-sm transition-all duration-200",
          "ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          "shadow-theme-sm hover:shadow-theme-md focus-visible:shadow-theme-glow",
          error && "border-destructive/60 focus-visible:ring-destructive focus-visible:border-destructive/50",
          "border-border",
          "appearance-none bg-no-repeat bg-right pr-10",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')]",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
        }
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={`${selectId}-error`}
          className="text-sm text-destructive font-medium"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          id={`${selectId}-hint`}
          className="text-xs text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

Select.displayName = "Select";