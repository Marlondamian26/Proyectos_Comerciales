"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { LoadingTable } from "@/components/ui/Loading";
import { X, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DashboardBackLink } from "@/components/DashboardBackLink";

type Servicio = {
  id: string;
  nombre: string;
  descripcion?: string;
  duracionMinutos: number;
  capacidad: number;
  negocio: { nombre: string };
};

type Reserva = {
  id: string;
  estado: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  venceEn: string;
  servicio: Servicio;
  negocio: { nombre: string };
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", color: "bg-warning/10 text-warning border-warning/20", icon: <Clock className="h-4 w-4" /> },
  confirmada: { label: "Confirmada", color: "bg-success/10 text-success border-success/20", icon: <CheckCircle className="h-4 w-4" /> },
  cancelada: { label: "Cancelada", color: "bg-destructive/10 text-destructive border-destructive/20", icon: <X className="h-4 w-4" /> },
  expirada: { label: "Expirada", color: "bg-destructive/10 text-destructive border-destructive/20", icon: <AlertCircle className="h-4 w-4" /> },
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ servicioId?: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const params = new URLSearchParams({
        callbackUrl: "/reservas",
        intent: JSON.stringify({ action: "reserva" }),
      });
      router.push(`/auth/registro?${params.toString()}`);
    }
  }, [status, router]);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [selectedServicioId, setSelectedServicioId] = useState<string>("");
  const [fechaHora, setFechaHora] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const isLoadingSession = status === "loading" || status === "unauthenticated";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = await searchParams;
      if (params.servicioId) {
        setSelectedServicioId(params.servicioId);
      }

      const [sRes, rRes] = await Promise.all([
        fetch("/api/servicios?activo=true"),
        fetch("/api/reservas"),
      ]);

      if (sRes.ok) setServicios(await sRes.json());
      if (rRes.ok) setReservas(await rRes.json());
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicioId: selectedServicioId,
        fechaHoraInicio: fechaHora,
      }),
    });

    if (res.ok) {
      const nueva = await res.json();
      setReservas([nueva, ...reservas]);
      setFechaHora("");
      setSelectedServicioId("");
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear la reserva");
    }
    setSubmitLoading(false);
  };

  const handleCancelar = async (reservaId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta reserva?")) return;

    setCancelingId(reservaId);
    const res = await fetch(`/api/reservas/${reservaId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReservas(reservas.filter((r) => r.id !== reservaId));
    } else {
      setError("No se pudo cancelar la reserva");
    }
    setCancelingId(null);
  };

  if (loading) return <LoadingTable rows={5} cols={5} />;

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-2">
            <DashboardBackLink />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold">Mis Reservas</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Gestiona tus reservas de servicios
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {error && (
          <div
            className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-destructive flex items-center gap-3"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <section className="rounded-xl border bg-card p-6 sm:p-8" aria-labelledby="nueva-reserva-title">
          <h2 id="nueva-reserva-title" className="text-xl font-semibold mb-6">
            Nueva Reserva
          </h2>
          <form onSubmit={handleCrear} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="servicio" className="text-sm font-medium">
                  Servicio
                </label>
                <select
                  id="servicio"
                  value={selectedServicioId}
                  onChange={(e) => setSelectedServicioId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.negocio.nombre}) - {s.duracionMinutos} min
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="fecha" className="text-sm font-medium">
                  Fecha y hora
                </label>
                <input
                  id="fecha"
                  type="datetime-local"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitLoading || !selectedServicioId || !fechaHora}
              className="w-full sm:w-auto"
            >
              {submitLoading ? "Creando..." : "Crear Reserva"}
            </Button>
          </form>
        </section>

        <section aria-labelledby="reservas-title">
          <h2 id="reservas-title" className="text-xl font-semibold mb-6">
            Reservas existentes
          </h2>
          {reservas.length === 0 ? (
            <EmptyStatePreset preset="reservations" />
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="divide-y">
                {reservas.map((reserva) => {
                  const estado = ESTADO_CONFIG[reserva.estado] ?? ESTADO_CONFIG.pendiente;
                  return (
                    <div
                      key={reserva.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{reserva.servicio.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {reserva.negocio.nombre}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(reserva.fechaHoraInicio)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${estado.color}`}>
                              {estado.icon}
                              {estado.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(reserva.estado !== "cancelada" && reserva.estado !== "expirada") && (
                        <button
                          onClick={() => handleCancelar(reserva.id)}
                          disabled={cancelingId === reserva.id}
                          className={cn(
                            "text-sm text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1",
                            "disabled:opacity-50"
                          )}
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
