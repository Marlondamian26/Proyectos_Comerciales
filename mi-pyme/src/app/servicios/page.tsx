import Link from "next/link";
import Image from "next/image";
import { listarServicios } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Calendar, Clock, Users, ArrowRight, Home } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ negocioId?: string }>;
}) {
  const { negocioId } = await searchParams;
  const servicios = await listarServicios(
    negocioId ? { negocioId } : undefined
  );

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                <Home className="h-4 w-4" />
                Volver al inicio
              </Link>
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {servicios.map((servicio) => (
                <Card
                  key={servicio.id}
                  image={{
                    src: servicio.imagenUrl || "/placeholder-service.jpg",
                    alt: servicio.nombre,
                  }}
                  badge={{
                    text: servicio.activo ? "Disponible" : "Inactivo",
                    variant: servicio.activo ? "success" : "warning",
                  }}
                  footer={
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {servicio.duracionMinutos} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {servicio.capacidad}
                        </span>
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
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/reservas?servicioId=${servicio.id}`}>
                      Reservar ahora
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
