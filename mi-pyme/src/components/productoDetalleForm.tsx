"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DisponibilidadBadge } from "@/components/ui/DisponibilidadBadge";
import { SelectorFechaDisponibilidad } from "@/components/ui/SelectorFechaDisponibilidad";
import { formatFechaISO } from "@/shared/utils/fecha";
import type { ListadoDisponibilidadDia } from "@/shared/disponibilidad.types";
import { Calendar, ShoppingBag } from "lucide-react";

interface ProductoDetalleFormProps {
  productoId: string;
  nombre: string;
  precio: number;
  disponibleHoy: {
    cantidadDisponible: number;
    disponible: boolean;
    cantidadReservada: number;
  } | null;
  semanaDisponibilidad: ListadoDisponibilidadDia[];
  onAgregarAlCarrito: (formData: FormData) => void;
}

export function ProductoDetalleForm({
  productoId,
  nombre,
  precio,
  disponibleHoy,
  semanaDisponibilidad,
  onAgregarAlCarrito,
}: ProductoDetalleFormProps) {
  const hoyISO = disponibleHoy
    ? formatFechaISO(new Date())
    : semanaDisponibilidad[0]?.fecha ?? formatFechaISO(new Date());

  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoyISO);
  const diaSeleccionado = semanaDisponibilidad.find(
    (d) => d.fecha === fechaSeleccionada
  );
  const disponibleSeleccion = diaSeleccionado?.disponible ?? false;
  const cantidadSeleccion = diaSeleccionado?.cantidadDisponible ?? 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAgregarAlCarrito(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <DisponibilidadBadge
          disponible={disponibleHoy?.disponible ?? false}
          cantidad={disponibleHoy?.cantidadDisponible ?? 0}
          variante="producto"
        />
        <span className="text-sm text-muted-foreground">
          Precio: ${precio.toFixed(2)}
        </span>
      </div>

      {disponibleHoy && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
          <p>
            <span className="font-medium text-muted-foreground">Ofertadas:</span>{" "}
            {semanaDisponibilidad[0]?.cantidadOfertada ??
              disponibleHoy.cantidadDisponible}
          </p>
          <p>
            <span className="font-medium text-muted-foreground">Reservadas:</span>{" "}
            {disponibleHoy.cantidadReservada}
          </p>
          <p>
            <span className="font-medium text-muted-foreground">Disponibles:</span>{" "}
            {disponibleHoy.cantidadDisponible}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Selecciona un día para recoger
        </label>
        <SelectorFechaDisponibilidad
          id={productoId}
          tipo="producto"
          selectedFecha={
            fechaSeleccionada ? new Date(fechaSeleccionada) : undefined
          }
          onChange={(fecha) => {
            setFechaSeleccionada(formatFechaISO(fecha));
          }}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="productoId" value={productoId} />
        <input type="hidden" name="fechaEntrega" value={fechaSeleccionada} />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!disponibleSeleccion}
        >
          <ShoppingBag className="h-5 w-5 mr-2" />
          {disponibleSeleccion
            ? `Agregar "${nombre}" al carrito (${cantidadSeleccion} uds.)`
            : "No disponible para esta fecha"}
        </Button>
      </form>
    </div>
  );
}
