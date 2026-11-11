"use client";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export type DisponibilidadVariante = "producto" | "servicio";

export interface DisponibilidadBadgeProps {
  disponible: boolean;
  cantidad?: number;
  fecha?: Date;
  variante?: DisponibilidadVariante;
  className?: string;
}

const ULTIMAS_UNIDADES_UMBRAL = 3;

export function DisponibilidadBadge({
  disponible,
  cantidad,
  fecha,
  variante = "producto",
  className,
}: DisponibilidadBadgeProps) {
  const content = useMemo(() => {
    if (!disponible) {
      if (variante === "servicio") {
        return {
          text: "Sin cupos hoy",
          variant: "error" as const,
        };
      }
      return {
        text: "No disponible hoy",
        variant: "error" as const,
      };
    }

    if (cantidad !== undefined && cantidad <= ULTIMAS_UNIDADES_UMBRAL) {
      if (variante === "servicio") {
        return {
          text: `Últimos ${cantidad} cupo(s)`,
          variant: "warning" as const,
        };
      }
      return {
        text: `Últimas ${cantidad} unidad(es)`,
        variant: "warning" as const,
      };
    }

    if (variante === "servicio") {
      const cupos = cantidad ?? 0;
      return {
        text: `Cupos disponibles: ${cupos}`,
        variant: "success" as const,
      };
    }

    const unidades = cantidad ?? 0;
    return {
      text: `Disponible hoy · ${unidades} unidad(es)`,
      variant: "success" as const,
    };
  }, [disponible, cantidad, variante]);

  const fechaTexto = useMemo(() => {
    if (!fecha) return "";
    const hoy = new Date();
    const diffDias = Math.round(
      (fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDias === 0) return "hoy";
    if (diffDias === 1) return "mañana";
    return `para ${fecha.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
    })}`;
  }, [fecha]);

  return (
    <Badge
      variant={content.variant}
      role="status"
      aria-live="polite"
      data-testid="disponibilidad-badge"
      className={cn("whitespace-nowrap", className)}
    >
      {content.text}
      {fechaTexto && !disponible && (
        <span className="sr-only"> — {fechaTexto}</span>
      )}
    </Badge>
  );
}

DisponibilidadBadge.displayName = "DisponibilidadBadge";
