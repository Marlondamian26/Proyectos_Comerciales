import Link from "next/link";
import { listarServiciosConCupos } from "@/lib/actions";
import { PageBackButton } from "@/components/ui/PageBackButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisponibilidadBadge } from "@/components/ui/DisponibilidadBadge";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReservarLink } from "@/components/ui/ReservarLink";
import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { Users, ArrowRight, Clock } from "lucide-react";
import type { ServicioConCupos } from "@/services/CatalogService";

export const dynamic = "force-dynamic";

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

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; areaId?: string; negocioId?: string; tipo?: string }>;
}) {
  const { area, areaId, negocioId, tipo } = await searchParams;
  const session = await auth();
  const canReserve = !session?.user || session.user.rol === Rol.CLIENTE;
  const servicios = (await listarServiciosConCupos({
    ...(area ? { area } : {}),
    ...(areaId ? { areaId } : {}),
    ...(negocioId ? { negocioId } : {}),
    ...(tipo ? { tipo } : { activo: true }),
  })) as ServicioConCupos[];

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between gap-4">
              <PageBackButton rol="CLIENTE" />
              <ThemeToggle />
            </div>
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
                Servicios
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Descubre servicios profesionales de negocios de confianza. Reserva en segundos.
              </p>
            </div>
          </div>

          {servicios.length === 0 ? (
            <div className="max-w-md mx-auto">
              <EmptyStatePreset
                preset="search"
                action={{
                  label: "Ver catálogo completo",
                  href: "/catalogo",
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {servicios.map((servicio) => {
                const cupos = servicio.cuposDisponiblesHoy;
                const disponible = cupos?.disponible ?? servicio.activo;
                const cantidadCupos = cupos?.cuposDisponibles ?? 0;
                const isTransporte = servicio.tipo === "TRANSPORTE";
                return (
                  <Card
                    key={servicio.id}
                    image={{
                      src: servicio.imagenUrl || "/placeholder-service.svg",
                      alt: servicio.nombre,
                    }}
                    badge={{
                      text: disponible ? (isTransporte ? "Transporte" : "Disponible") : "Sin cupos",
                      variant: disponible ? (isTransporte ? "info" : "success") : "error",
                    }}
                    footer={
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {servicio.duracionMinutos} min
                          </span>
                          {isTransporte ? (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              {servicio.precio != null ? `$${Number(servicio.precio).toFixed(2)}` : "Consultar"}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {servicio.capacidad}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {servicio.negocio.nombre}
                        </span>
                      </div>
                    }
                    className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <h3 className="text-lg font-semibold mb-2">{servicio.nombre}</h3>
                    {servicio.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {servicio.descripcion}
                      </p>
                    )}
                    {isTransporte && servicio.tipoTransporte && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Tipo: {tipoTransporteLabel(servicio.tipoTransporte)}
                      </p>
                    )}
                    <div className="mb-3">
                      <DisponibilidadBadge
                        disponible={disponible}
                        cantidad={cantidadCupos}
                        variante="servicio"
                      />
                    </div>
                    {canReserve ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        asChild
                        disabled={!disponible}
                      >
                        <ReservarLink
                          href={disponible ? `/servicios/${servicio.id}` : "#"}
                          disabled={!disponible}
                        >
                          {isTransporte ? "Contratar transporte" : "Reservar ahora"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </ReservarLink>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/servicios/${servicio.id}`}>
                          Ver detalles
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
