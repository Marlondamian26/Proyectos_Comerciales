"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { actualizarHorariosAction } from "@/lib/actions";
import type { HorarioNegocioDTO } from "@/shared/negocio.types";

interface Props {
  negocioId: string;
  horariosIniciales: Array<{
    diaSemana: number;
    horaApertura: string;
    horaCierre: string;
    cerrado: boolean;
  }>;
}

const DIAS_LABEL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const DEFAULT_HORARIOS: HorarioNegocioDTO[] = [
  { diaSemana: 0, horaApertura: "00:00", horaCierre: "00:00", cerrado: true },
  { diaSemana: 1, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 2, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 3, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 4, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 5, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 6, horaApertura: "08:00", horaCierre: "13:00", cerrado: false },
];

function mergeHorarios(iniciales: Props["horariosIniciales"]): HorarioNegocioDTO[] {
  const map = new Map<number, HorarioNegocioDTO>();
  for (const h of iniciales) {
    map.set(h.diaSemana, { ...h });
  }
  for (const h of DEFAULT_HORARIOS) {
    if (!map.has(h.diaSemana)) {
      map.set(h.diaSemana, { ...h });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.diaSemana - b.diaSemana);
}

export default function HorarioEditor({ negocioId, horariosIniciales }: Props) {
  const [horarios, setHorarios] = useState<HorarioNegocioDTO[]>(
    () => mergeHorarios(horariosIniciales)
  );
  const [loading, setLoading] = useState(false);
  const { success, error: errorToast } = useToast();

  const toggleCerrado = (idx: number) => {
    const nuevos = [...horarios];
    nuevos[idx] = { ...nuevos[idx], cerrado: !nuevos[idx].cerrado };
    setHorarios(nuevos);
  };

  const updateField = (idx: number, field: "horaApertura" | "horaCierre", value: string) => {
    const nuevos = [...horarios];
    nuevos[idx] = { ...nuevos[idx], [field]: value };
    setHorarios(nuevos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await actualizarHorariosAction(negocioId, horarios);
      success("Horarios actualizados correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Horarios del negocio
        </h1>
        <p className="text-muted-foreground mt-1">
          Define el horario de apertura y cierre para cada día de la semana
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Día
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Abierto
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Apertura
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Cierre
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {horarios.map((h, idx) => {
                const diaLabel = DIAS_LABEL[h.diaSemana] ?? "Desconocido";
                const isClosed = h.cerrado;
                return (
                  <tr key={h.diaSemana}>
                    <td className="py-3.5 px-4 font-medium">{diaLabel}</td>
                    <td className="text-center py-3.5">
                      <Checkbox
                        checked={!isClosed}
                        onChange={() => toggleCerrado(idx)}
                        aria-label={`Abierto ${diaLabel}`}
                      />
                    </td>
                    <td className="text-center py-3.5">
                      {isClosed ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <input
                          type="time"
                          value={h.horaApertura}
                          onChange={(e) =>
                            updateField(idx, "horaApertura", e.target.value)
                          }
                          className="w-32 border border-border rounded-lg px-2.5 py-1.5 text-sm text-center bg-background"
                          disabled={isClosed}
                          aria-label={`Hora apertura ${diaLabel}`}
                        />
                      )}
                    </td>
                    <td className="text-center py-3.5">
                      {isClosed ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <input
                          type="time"
                          value={h.horaCierre}
                          onChange={(e) =>
                            updateField(idx, "horaCierre", e.target.value)
                          }
                          className="w-32 border border-border rounded-lg px-2.5 py-1.5 text-sm text-center bg-background"
                          disabled={isClosed}
                          aria-label={`Hora cierre ${diaLabel}`}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" loading={loading} disabled={loading}>
            Guardar horarios
          </Button>
        </div>
      </form>
    </main>
  );
}
