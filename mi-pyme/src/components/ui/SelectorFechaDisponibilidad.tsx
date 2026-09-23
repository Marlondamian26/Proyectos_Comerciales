"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatFechaISO, fechaHoy } from "@/shared/utils/fecha";
import { DIAS_VISTA_DISPONIBILIDAD } from "@/core/constants";
import type {
  DisponibilidadProductoDTO,
  CuposServicioDTO,
  ListadoDisponibilidadDia,
} from "@/shared/disponibilidad.types";

export type SelectorTipo = "producto" | "servicio";

export interface SelectorFechaDisponibilidadProps {
  id: string;
  tipo: SelectorTipo;
  selectedFecha?: Date;
  onChange?: (fecha: Date) => void;
  className?: string;
}

interface DiaData {
  fechaISO: string;
  fecha: Date;
  disponible: boolean;
  cantidad?: number;
}

const NOMBRES_DIAS = [
  "Dom",
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
];

const MESES_CORTE = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function SelectorFechaDisponibilidad({
  id,
  tipo,
  selectedFecha,
  onChange,
  className,
}: SelectorFechaDisponibilidadProps) {
  const [dias, setDias] = useState<DiaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hoy = fechaHoy();
  const fechaSeleccionada = selectedFecha ?? hoy;

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (tipo === "producto") {
          const res = await fetch(
            `/api/disponibilidad/producto/${id}/semana`
          );
          if (!res.ok) throw new Error("Error al cargar disponibilidad");
          const data: ListadoDisponibilidadDia[] = await res.json();
          const parsed: DiaData[] = data.map((d) => ({
            fechaISO: d.fecha,
            fecha: new Date(d.fechaNormalizada),
            disponible: d.disponible,
            cantidad: d.cantidadDisponible,
          }));
          if (!cancelled) setDias(parsed);
        } else {
          const fechas: Date[] = [];
          for (let i = 0; i < DIAS_VISTA_DISPONIBILIDAD; i++) {
            const d = new Date(hoy);
            d.setUTCDate(d.getUTCDate() + i);
            fechas.push(d);
          }
          const results = await Promise.all(
            fechas.map(async (f) => {
              const iso = formatFechaISO(f);
              const res = await fetch(
                `/api/disponibilidad/servicio/${id}?fecha=${iso}`
              );
              const cupos: CuposServicioDTO = res.ok
                ? await res.json()
                : { capacidad: 0, reservadas: 0, cuposDisponibles: 0, disponible: false };
              return {
                fechaISO: iso,
                fecha: f,
                disponible: cupos.disponible,
                cantidad: cupos.cuposDisponibles,
              };
            })
          );
          if (!cancelled) setDias(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, tipo, hoy]);

  const handleSelect = (d: DiaData) => {
    if (!d.disponible) return;
    onChange?.(d.fecha);
  };

  const isSelected = (d: DiaData) =>
    formatFechaISO(d.fecha) === formatFechaISO(fechaSeleccionada);

  if (loading) {
    return (
      <div
        className={cn("flex gap-2 overflow-x-auto py-2", className)}
        aria-label="Cargando fechas disponibles"
      >
        {Array.from({ length: DIAS_VISTA_DISPONIBILIDAD }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 min-w-[60px]"
          >
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-8 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className={cn("flex gap-2 overflow-x-auto py-2", className)}>
      <div
        className="flex gap-2"
        role="radiogroup"
        aria-label="Seleccionar fecha de disponibilidad"
      >
        {dias.map((d) => {
          const selected = isSelected(d);
          const diaNombre = NOMBRES_DIAS[d.fecha.getUTCDay()];
          const diaNumero = d.fecha.getUTCDate();
          const mesCorto = MESES_CORTE[d.fecha.getUTCMonth()];

          return (
            <button
              key={d.fechaISO}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!d.disponible}
              onClick={() => handleSelect(d)}
              className={cn(
                "relative flex flex-col items-center gap-1 min-w-[60px] px-3 py-2 rounded-lg border text-center transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                d.disponible
                  ? selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:border-primary/30"
                  : "border-border bg-muted/30 text-muted-foreground cursor-not-allowed",
                className
              )}
            >
              <span className="text-xs font-medium">{diaNombre}</span>
              <span className="text-sm font-bold">{diaNumero}</span>
              <span className="text-[10px] text-muted-foreground">{mesCorto}</span>

              {d.disponible ? (
                <span
                  className="absolute -bottom-1 h-2 w-2 rounded-full bg-success"
                  aria-label={`Disponible ${d.cantidad ?? 0} unidades`}
                />
              ) : (
                <span
                  className="absolute -bottom-1 h-2 w-2 rounded-full bg-destructive"
                  aria-label="Sin cupos"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

SelectorFechaDisponibilidad.displayName = "SelectorFechaDisponibilidad";
