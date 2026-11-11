"use client";

import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, RotateCw } from "lucide-react";
import * as React from "react";
import { Badge } from "./Badge";

export type EstadoPago =
  | "pendiente"
  | "procesando"
  | "completado"
  | "fallido"
  | "reembolsado"
  | "cancelado";

export interface EstadoPagoBadgeProps {
  estado: EstadoPago;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
}

const estadoConfig: Record<
  EstadoPago,
  {
    label: string;
    icon: React.ReactNode;
    badgeVariant: "warning" | "info" | "success" | "error" | "default" | "secondary";
  }
> = {
  pendiente: {
    label: "Pendiente",
    icon: <Clock className="h-3 w-3" />,
    badgeVariant: "warning",
  },
  procesando: {
    label: "Procesando",
    icon: <RotateCw className="h-3 w-3" />,
    badgeVariant: "info",
  },
  completado: {
    label: "Completado",
    icon: <CheckCircle className="h-3 w-3" />,
    badgeVariant: "success",
  },
  fallido: {
    label: "Fallido",
    icon: <XCircle className="h-3 w-3" />,
    badgeVariant: "error",
  },
  reembolsado: {
    label: "Reembolsado",
    icon: <RotateCw className="h-3 w-3" />,
    badgeVariant: "secondary",
  },
  cancelado: {
    label: "Cancelado",
    icon: <XCircle className="h-3 w-3" />,
    badgeVariant: "default",
  },
};

export function EstadoPagoBadge({
  estado,
  className,
  showIcon = true,
  size = "md",
}: EstadoPagoBadgeProps) {
  const config = estadoConfig[estado];

  return (
    <Badge
      variant={config.badgeVariant}
      size={size}
      icon={showIcon ? config.icon : undefined}
      className={cn("font-medium", className)}
      role="status"
      aria-live="polite"
    >
      {config.label}
    </Badge>
  );
}

EstadoPagoBadge.displayName = "EstadoPagoBadge";