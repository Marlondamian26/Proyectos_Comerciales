"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import * as React from "react";

export interface TimelineStep {
  id: string;
  label: string;
  status: "completed" | "current" | "pending" | "failed";
  description?: string;
  timestamp?: string;
  icon?: React.ReactNode;
}

export interface StatusTimelineProps
  extends React.HTMLAttributes<HTMLElement> {
  steps: TimelineStep[];
  orientation?: "horizontal" | "vertical";
  showTimestamps?: boolean;
}

const statusIcons: Record<TimelineStep["status"], React.ReactNode> = {
  completed: <CheckCircle className="h-5 w-5" />,
  current: <Clock className="h-5 w-5" />,
  pending: <Clock className="h-5 w-5" />,
  failed: <XCircle className="h-5 w-5" />,
};

const statusColors: Record<TimelineStep["status"], string> = {
  completed: "bg-success",
  current: "bg-primary",
  pending: "bg-muted-foreground/30",
  failed: "bg-destructive",
};

export function StatusTimeline({
  steps,
  orientation = "vertical",
  showTimestamps = true,
  className,
  ...props
}: StatusTimelineProps) {
  if (orientation === "horizontal" && steps.length > 0) {
    return (
      <div
        className={cn("w-full", className)}
        {...props}
        role="list"
        aria-label="Estado del pedido"
      >
        <ol className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-5 h-0.5 -z-10 bg-muted-foreground/30" />
          {steps.map((step, index) => {
             const isLast = index === steps.length - 1;
            return (
              <li
                key={step.id}
                className={cn(
                  "flex flex-col items-center",
                  !isLast && "flex-1"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-content-inverse",
                    statusColors[step.status]
                  )}
                  aria-hidden="true"
                >
                  {step.icon ?? statusIcons[step.status]}
                </div>
                <span className="mt-2 text-xs font-medium text-secondary">
                  {step.label}
                </span>
                {step.timestamp && showTimestamps && (
                  <span className="mt-1 text-xs text-tertiary">
                    {step.timestamp}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <ol
      className={cn("relative flex flex-col gap-4", className)}
      {...props}
      role="list"
      aria-label="Estado del pedido"
    >
      <div className="absolute top-0 bottom-0 left-5 w-0.5 -z-10 bg-muted-foreground/30" />

      {steps.map((step) => (
        <li key={step.id} className="relative flex gap-3">
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-content-inverse",
              statusColors[step.status]
            )}
            aria-hidden="true"
          >
            {step.icon ?? statusIcons[step.status]}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "font-medium",
                  step.status === "completed" && "text-success",
                  step.status === "current" && "text-primary",
                  step.status === "pending" && "text-tertiary",
                  step.status === "failed" && "text-destructive"
                )}
              >
                {step.label}
              </p>
              {step.timestamp && showTimestamps && (
                <span className="text-xs text-tertiary">{step.timestamp}</span>
              )}
            </div>
            {step.description && (
              <p className="mt-0.5 text-sm text-secondary">{step.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

StatusTimeline.displayName = "StatusTimeline";