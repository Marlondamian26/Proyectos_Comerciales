"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface PasoCheckoutProps {
  titulo: string;
  descripcion?: string;
  icono?: React.ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
  isDisabled?: boolean;
}

export function PasoCheckout({
  titulo,
  descripcion,
  icono,
  isActive,
  isCompleted,
  isDisabled,
}: PasoCheckoutProps) {
  const estadoClase = isCompleted
    ? "bg-success text-success-foreground"
    : isActive
    ? "bg-primary text-primary-foreground"
    : "bg-muted text-muted-foreground";

  const contornoClase = isActive
    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
    : isCompleted
    ? "ring-1 ring-success/50"
    : "ring-1 ring-border";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
        isDisabled && "opacity-50 cursor-not-allowed",
        contornoClase
      )}
      aria-current={isActive ? "step" : undefined}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
          estadoClase
        )}
        aria-hidden="true"
      >
        {icono ?? (isCompleted ? "✓" : "")}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        {descripcion && (
          <p className="text-xs text-muted-foreground">{descripcion}</p>
        )}
      </div>
    </div>
  );
}
