"use client";

import { SelectorFechaDisponibilidad } from "@/components/ui/SelectorFechaDisponibilidad";
import type { ItemCheckoutDTO } from "@/shared/checkout.types";
import { Calendar } from "lucide-react";

export interface SelectorFechaEntregaProps {
  items: ItemCheckoutDTO[];
  selectedFecha?: Date;
  onChange?: (fecha: Date | null) => void;
  className?: string;
}

export function SelectorFechaEntrega({
  items,
  selectedFecha,
  onChange,
  className,
}: SelectorFechaEntregaProps) {
  if (items.length === 0) return null;

  const itemConFecha = items.find((item) => item.fechaEntrega);
  if (!itemConFecha) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>No se requiere selección de fecha para estos productos.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
        <Calendar className="h-4 w-4" />
        Fecha de entrega
      </label>
      <p className="text-xs text-muted-foreground mb-2">
        Fecha mínima: {new Date(itemConFecha.fechaEntrega!).toLocaleDateString("es-ES")}
      </p>
      <SelectorFechaDisponibilidad
        id={`fecha-entrega-${itemConFecha.id}`}
        tipo={itemConFecha.tipo === "producto" ? "producto" : "servicio"}
        selectedFecha={selectedFecha ?? undefined}
        onChange={(fecha) => onChange?.(fecha)}
      />
    </div>
  );
}
