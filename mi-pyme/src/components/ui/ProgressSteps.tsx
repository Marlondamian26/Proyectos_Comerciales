"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface Step {
  id: string;
  label: string;
  description?: string;
  status?: "pending" | "current" | "completed";
}

export interface ProgressStepsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
  currentStep?: number;
  orientation?: "horizontal" | "vertical";
}

export function ProgressSteps({
  steps,
  currentStep = 0,
  orientation = "horizontal",
  className,
  ...props
}: ProgressStepsProps) {
  const getStepStatus = (index: number): NonNullable<Step["status"]> => {
    if (steps[index]?.status) return steps[index].status;
    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "pending";
  };

  const statusTextColors = {
    completed: "text-success",
    current: "text-primary",
    pending: "text-tertiary",
  };

  if (orientation === "vertical") {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        aria-label="Pasos del proceso"
        {...props}
      >
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-all duration-200",
                    status === "completed" && "bg-success text-success-foreground",
                    status === "current" && "bg-primary text-content-inverse ring-2 ring-primary/20",
                    status === "pending" && "bg-muted-foreground/30 text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {status === "completed" ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-px flex-1",
                      status === "completed" ? "bg-success" : "bg-muted-foreground/30"
                    )}
                    style={{ height: "48px" }}
                  />
                )}
              </div>
              <div className="pb-4">
                <p
                  className={cn(
                    "font-semibold",
                    status === "completed" && "text-success",
                    status === "current" && "text-primary",
                    status === "pending" && "text-tertiary"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-sm text-secondary">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center", className)}
      aria-label="Pasos del proceso"
      {...props}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-all duration-200",
                  status === "completed" && "bg-success text-success-foreground",
                  status === "current" && "bg-primary text-content-inverse ring-2 ring-primary/20",
                  status === "pending" && "bg-muted-foreground/30 text-muted-foreground"
                )}
                aria-current={status === "current" ? "step" : undefined}
              >
                {status === "completed" ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-xs font-medium",
                  statusTextColors[status]
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn("flex-1")}
                style={{
                  height: "2px",
                  background: status === "completed"
                    ? "var(--color-success)"
                    : "var(--color-muted-foreground)",
                  opacity: status === "completed" ? 1 : 0.3,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

ProgressSteps.displayName = "ProgressSteps";