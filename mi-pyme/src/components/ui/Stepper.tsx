"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import * as React from "react";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onChange?: (step: number) => void;
  allowNavigation?: boolean;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onChange,
  allowNavigation = true,
  className,
}: StepperProps) {
  return (
    <nav
      className={cn("flex items-center justify-between", className)}
      aria-label="Progreso del formulario"
    >
      {steps.map((step, index) => {
        const status =
          index < currentStep
            ? "completed"
            : index === currentStep
              ? "current"
              : "pending";
        const isClickable = allowNavigation && status !== "pending" && !!onChange;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => isClickable && onChange?.(index)}
              disabled={!isClickable}
              aria-current={status === "current" ? "step" : undefined}
              aria-label={
                status === "completed"
                  ? `Paso ${index + 1}: ${step.label} completado`
                  : status === "current"
                    ? `Paso actual: ${step.label}`
                    : `Paso pendiente: ${step.label}`
              }
              className={cn(
                "flex flex-col items-center gap-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                !isClickable && "cursor-default",
                status === "pending" && !isClickable && "cursor-not-allowed opacity-40"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  "transition-all duration-200",
                  status === "completed" &&
                    "bg-success text-success-foreground ring-2 ring-success/20",
                  status === "current" &&
                    "bg-primary text-content-inverse ring-2 ring-primary/20",
                  status === "pending" &&
                    "bg-muted-foreground/20 text-muted-foreground"
                )}
                aria-hidden="true"
              >
                {status === "completed" ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-center text-sm font-medium",
                  status === "completed" && "text-success",
                  status === "current" && "text-primary",
                  status === "pending" && "text-tertiary"
                )}
              >
                {step.label}
                {step.optional && status !== "current" && (
                  <span className="block text-xs text-tertiary">(Opcional)</span>
                )}
              </span>
              {step.description && status === "current" && (
                <span className="text-xs text-secondary">{step.description}</span>
              )}
            </button>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1",
                  status === "completed" ? "h-0.5 bg-success" : "h-0.5 bg-muted-foreground/30"
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

Stepper.displayName = "Stepper";