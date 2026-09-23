import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { DisponibilidadBadge } from "@/components/ui/DisponibilidadBadge";
import { SelectorFechaDisponibilidad } from "@/components/ui/SelectorFechaDisponibilidad";
import { Home, Clock, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { obtenerServicioConCuposAction } from "@/lib/actions";

interface ServicioDetalle {
  id: string;
  nombre: string;
  descripcion?: string | null;
  duracionMinutos: number;
  capacidad: number;
  imagenUrl: string;
  activo: boolean;
  negocio: { nombre: string };
  cuposDisponiblesHoy: {
    capacidad: number;
    reservadas: number;
    cuposDisponibles: number;
    disponible: boolean;
  } | null;
}

export const dynamic = "force-dynamic";

export default async function ServicioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const servicioResult = await obtenerServicioConCuposAction(id);

  if (!servicioResult) {
    notFound();
  }

  const servicio = servicioResult as unknown as ServicioDetalle;

  if (!servicio) {
    notFound();
  }

  const cupos = servicio.cuposDisponiblesHoy;
  const disponible = cupos?.disponible ?? servicio.activo;

  return (
    <main className="container py-12">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/servicios">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            Volver a servicios
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {servicio.imagenUrl ? (
            <img
              src={servicio.imagenUrl}
              alt={servicio.nombre}
              className="w-full rounded-xl object-cover h-80"
            />
          ) : (
            <div className="w-full rounded-xl bg-muted h-80 flex items-center justify-center">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{servicio.nombre}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {servicio.negocio.nombre}
            </p>
            {servicio.descripcion && (
              <p className="text-muted-foreground mt-4">{servicio.descripcion}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {servicio.duracionMinutos} minutos
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                Capacidad: {servicio.capacidad}
              </span>
            </div>

            <DisponibilidadBadge
              disponible={disponible}
              cantidad={cupos?.cuposDisponibles ?? 0}
              variante="servicio"
            />

            {cupos && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
                <p>
                  <span className="font-medium text-muted-foreground">
                    Capacidad:
                  </span>{" "}
                  {cupos.capacidad}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Reservadas:
                  </span>{" "}
                  {cupos.reservadas}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Disponibles:
                  </span>{" "}
                  {cupos.cuposDisponibles}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Selecciona una fecha
            </label>
            <SelectorFechaDisponibilidad
              id={servicio.id}
              tipo="servicio"
            />
          </div>

          <Button
            variant={disponible ? "primary" : "outline"}
            size="lg"
            className="w-full"
            asChild
            disabled={!disponible}
          >
            <Link
              href={
                disponible
                  ? `/reservas?servicioId=${servicio.id}`
                  : "#"
              }
              onClick={(e) => {
                if (!disponible) e.preventDefault();
              }}
            >
              {disponible ? "Reservar ahora" : "Sin cupos disponibles hoy"}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
