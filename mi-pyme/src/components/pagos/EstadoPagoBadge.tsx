import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { EstadoPago } from "@/generated/prisma/client";

const estadoMap: Record<EstadoPago, "warning" | "info" | "success" | "error" | "default" | "secondary"> = {
  PENDIENTE: "warning",
  EN_PROCESO: "info",
  COMPLETADO: "success",
  REEMBOLSADO: "secondary",
  FALLIDO: "error",
  CANCELADO: "default",
};

const estadoLabels: Record<EstadoPago, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  REEMBOLSADO: "Reembolsado",
  FALLIDO: "Fallido",
  CANCELADO: "Cancelado",
};

export interface EstadoPagoBadgeProps {
  estado: EstadoPago;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EstadoPagoBadge({ estado, size = "md", className }: EstadoPagoBadgeProps) {
  return (
    <Badge
      variant={estadoMap[estado]}
      size={size}
      dot
      className={cn(className)}
      aria-label={`Estado de pago: ${estadoLabels[estado]}`}
    >
      {estadoLabels[estado]}
    </Badge>
  );
}

EstadoPagoBadge.displayName = "EstadoPagoBadge";
