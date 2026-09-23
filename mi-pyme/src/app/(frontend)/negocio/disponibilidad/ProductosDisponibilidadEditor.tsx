"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { DisponibilidadBadge } from "@/components/ui/DisponibilidadBadge";
import { useToast } from "@/components/ui/Toast";
import {
  setDisponibilidadAction,
  bulkSetDisponibilidadAction,
  eliminarDisponibilidadAction,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

type SemanaDia = {
  fecha: string;
  cantidadDisponible: number;
  disponible: boolean;
  cantidadReservada: number;
};

type ProductoDisponibilidad = {
  id: string;
  nombre: string;
  precio: number;
  unidadMedida: string;
  imagenUrl: string | null;
  cantidadDisponibleHoy: number;
  disponibleHoy: boolean;
  semana: SemanaDia[];
};

type Props = {
  productos: ProductoDisponibilidad[];
};

const CANTIDADES_PRESET = [0, 1, 2, 5, 10, 20];

export function ProductosDisponibilidadEditor({ productos }: Props) {
  const [loadingSet, setLoadingSet] = useState<string | null>(null);
  const [loadingEliminar, setLoadingEliminar] = useState<string | null>(null);
  const { success, error: errorToast } = useToast();

  const handleSetDisponibilidad = async (
    productoId: string,
    fechaISO: string,
    cantidad: number
  ) => {
    const key = `${productoId}-${fechaISO}`;
    setLoadingSet(key);
    try {
      await setDisponibilidadAction(productoId, new Date(fechaISO), cantidad);
      success("Disponibilidad actualizada correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      errorToast(msg);
    } finally {
      setLoadingSet(null);
    }
  };

  const handleEliminar = async (productoId: string, fechaISO: string) => {
    const key = `${productoId}-${fechaISO}`;
    setLoadingEliminar(key);
    try {
      await eliminarDisponibilidadAction(productoId, new Date(fechaISO));
      success("Disponibilidad eliminada correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      errorToast(msg);
    } finally {
      setLoadingEliminar(null);
    }
  };

  const handleBulkSet = async (productoId: string, cantidad: number) => {
    const key = `${productoId}-bulk`;
    setLoadingSet(key);
    try {
      await bulkSetDisponibilidadAction(
        productoId,
        productos
          .find((p) => p.id === productoId)
          ?.semana.map((d) => d.fecha) ?? [],
        cantidad
      );
      success(`Disponibilidad aplicada: ${cantidad} unidades`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al aplicar";
      errorToast(msg);
    } finally {
      setLoadingSet(null);
    }
  };

  return (
    <div className="space-y-6">
      {productos.map((producto) => (
        <div key={producto.id} className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4 mb-4">
            {producto.imagenUrl ? (
              <Image
                src={producto.imagenUrl}
                alt={producto.nombre}
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{producto.nombre}</h3>
              <p className="text-sm text-muted-foreground">
                ${producto.precio.toFixed(2)} · {producto.unidadMedida}
              </p>
            </div>
            <DisponibilidadBadge disponible={producto.disponibleHoy} />
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Aplicar cantidad a toda la semana
            </label>
            <div className="flex flex-wrap gap-2">
              {CANTIDADES_PRESET.map((c) => (
                <button
                  key={c}
                  onClick={() => handleBulkSet(producto.id, c)}
                  disabled={loadingSet === `${producto.id}-bulk`}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                    "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {c} unidades
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground text-xs uppercase">
                    Fecha
                  </th>
                  <th className="text-center py-2 font-medium text-muted-foreground text-xs uppercase">
                    Disponible
                  </th>
                  <th className="text-center py-2 font-medium text-muted-foreground text-xs uppercase">
                    Reservado
                  </th>
                  <th className="text-center py-2 font-medium text-muted-foreground text-xs uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {producto.semana.map((dia) => {
                  const esHoy =
                    new Date(dia.fecha).toDateString() ===
                    new Date().toDateString();
                  const diaKey = `${producto.id}-${dia.fecha}`;
                  return (
                    <tr
                      key={dia.fecha}
                      className="hover:bg-muted/30"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Date(dia.fecha).toLocaleDateString("es-ES", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {esHoy && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              Hoy
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3">
                        <DisponibilidadBadge disponible={dia.disponible} />
                        <div className="text-xs text-muted-foreground mt-1">
                          {dia.cantidadDisponible}
                        </div>
                      </td>
                      <td className="text-center py-3">
                        {dia.cantidadReservada}
                      </td>
                      <td className="text-center py-3">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {CANTIDADES_PRESET.map((c) => (
                            <button
                              key={c}
                              onClick={() =>
                                handleSetDisponibilidad(
                                  producto.id,
                                  dia.fecha,
                                  c
                                )
                              }
                              disabled={loadingSet === diaKey}
                              className={cn(
                                "px-2 py-1 rounded border text-xs font-medium transition-colors",
                                "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                              )}
                            >
                              {c}
                            </button>
                          ))}
                          <button
                            onClick={() =>
                              handleEliminar(producto.id, dia.fecha)
                            }
                            disabled={loadingEliminar === diaKey}
                            className={cn(
                              "px-2 py-1 rounded border text-xs text-destructive hover:bg-destructive/10",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
