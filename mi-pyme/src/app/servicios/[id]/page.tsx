import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { DisponibilidadBadge } from "@/components/ui/DisponibilidadBadge";
import { Home, Clock, Users, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { obtenerServicioConCuposAction } from "@/lib/actions";
import { TransporteForm } from "@/components/servicios/TransporteForm";

interface ServicioDetalle {
  id: string;
  nombre: string;
  descripcion?: string | null;
  duracionMinutos: number;
  capacidad: number;
  precio: number;
  imagenUrl: string;
  activo: boolean;
  tipo: string;
  tipoTransporte?: string | null;
  pesoMaximo?: { toNumber(): number } | null;
  dimensionesMaximas?: string | null;
  origenBase?: string | null;
  destinoBase?: string | null;
  alcanceNacional?: boolean;
  negocio: { nombre: string };
  cuposDisponiblesHoy: {
    capacidad: number;
    reservadas: number;
    cuposDisponibles: number;
    disponible: boolean;
  } | null;
}

function tipoTransporteLabel(tipo: string): string {
  const labels: Record<string, string> = {
    ENVIO_PAQUETE: "Envío de paquetes",
    MUDANZA: "Mudanza",
    TRASLADO_MUEBLE: "Traslado de muebles",
    TRANSPORTE_PERSONAS: "Transporte de personas",
    OTRO: "Otro",
  };
  return labels[tipo] ?? tipo;
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
  const isTransporte = servicio.tipo === "TRANSPORTE";

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
            <Image
              src={servicio.imagenUrl}
              alt={servicio.nombre}
              width={400}
              height={320}
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
              {!isTransporte && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Capacidad: {servicio.capacidad}
                </span>
              )}
              {servicio.precio != null && servicio.precio > 0 && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Package className="h-4 w-4" />
                  ${Number(servicio.precio).toFixed(2)}
                </span>
              )}
            </div>

            {isTransporte && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                {servicio.tipoTransporte && (
                  <p>
                    <span className="font-medium text-muted-foreground">Tipo:</span>{" "}
                    {tipoTransporteLabel(servicio.tipoTransporte)}
                  </p>
                )}
                {servicio.pesoMaximo && (
                  <p>
                    <span className="font-medium text-muted-foreground">Peso máximo:</span>{" "}
                    {Number(servicio.pesoMaximo.toNumber())} kg
                  </p>
                )}
                {servicio.dimensionesMaximas && (
                  <p>
                    <span className="font-medium text-muted-foreground">Dimensiones máximas:</span>{" "}
                    {servicio.dimensionesMaximas}
                  </p>
                )}
                {servicio.alcanceNacional ? (
                  <p>
                    <span className="font-medium text-muted-foreground">Cobertura:</span> Nacional
                  </p>
                ) : (
                  <>
                    {servicio.origenBase && (
                      <p>
                        <span className="font-medium text-muted-foreground">Origen base:</span>{" "}
                        {servicio.origenBase}
                      </p>
                    )}
                    {servicio.destinoBase && (
                      <p>
                        <span className="font-medium text-muted-foreground">Destino base:</span>{" "}
                        {servicio.destinoBase}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <DisponibilidadBadge
              disponible={disponible}
              cantidad={cupos?.cuposDisponibles ?? 0}
              variante="servicio"
            />

            {cupos && !isTransporte && (
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

          {isTransporte ? (
            <TransporteForm servicioId={servicio.id} disponible={disponible} />
          ) : (
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
          )}
        </div>
      </div>
    </main>
  );
}
