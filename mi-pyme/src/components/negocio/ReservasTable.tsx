"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarReservaAction } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { Clock } from "lucide-react";

interface Reserva {
  id: string;
  estado: string;
  fechaHoraInicio: Date;
  fechaHoraFin?: Date | null;
  servicio?: { nombre: string };
  usuario?: { email: string; nombre: string | null };
}

interface Props {
  negocioId: string;
  reservas: Reserva[];
}

const estados = [
  { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmada", label: "Confirmada", color: "bg-blue-100 text-blue-800" },
  { value: "completada", label: "Completada", color: "bg-green-100 text-green-800" },
  { value: "cancelada", label: "Cancelada", color: "bg-red-100 text-red-800" },
];

export default function ReservasTable({ negocioId, reservas: reservasIniciales }: Props) {
  const [reservas, setReservas] = useState<Reserva[]>(reservasIniciales);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { success, error: errorToast } = useToast();

  const handleEstadoChange = async (reservaId: string, nuevoEstado: string) => {
    setLoading(true);
    try {
      await actualizarReservaAction(negocioId, reservaId, nuevoEstado);
      setReservas((prev) =>
        prev.map((r) => (r.id === reservaId ? { ...r, estado: nuevoEstado } : r))
      );
      success("Estado actualizado");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const e = estados.find((x) => x.value === estado) ?? estados[0];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${e.color}`}>
        {e.label}
      </span>
    );
  };

  if (reservas.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tienes reservas todavía.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Servicio</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Cliente</th>
            <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Fecha / Hora</th>
            <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {reservas.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="py-3.5 px-4 font-medium">{r.servicio?.nombre ?? "Servicio"}</td>
              <td className="py-3.5 px-4">{r.usuario?.nombre ?? r.usuario?.email ?? "—"}</td>
              <td className="py-3.5 px-4 text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <span>{new Date(r.fechaHoraInicio).toLocaleDateString("es-AR")}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.fechaHoraInicio).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-center">
                {getEstadoBadge(r.estado)}
                <div className="mt-2">
                  <Select
                    value={r.estado}
                    onChange={(e) => handleEstadoChange(r.id, e.target.value)}
                    options={estados.map((e) => ({ value: e.value, label: e.label }))}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
