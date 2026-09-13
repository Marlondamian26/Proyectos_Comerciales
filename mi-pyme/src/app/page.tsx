import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listarAreas, listarNegocios, listarServicios } from "@/lib/actions";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { SortControls } from "@/components/SortControls";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Star,
  Truck,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

type SortOption = "popularity-desc" | "popularity-asc" | "alpha-asc" | "alpha-desc";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await auth();
  const userRol = session?.user?.rol;

  if (userRol) {
    const rolToPath: Record<string, string> = {
      CLIENTE: "/cliente",
      NEGOCIO: "/negocio",
      LOGISTICA: "/logistica",
      ADMIN: "/admin",
    };
    if (rolToPath[userRol]) {
      redirect(rolToPath[userRol]);
    }
  }

  const sortParam = (await searchParams).sort as SortOption || "popularity-desc";

  const sortNegocio = sortParam === "alpha-asc"
    ? { sort: { campo: "nombre" as const, orden: "asc" as const } }
    : sortParam === "alpha-desc"
    ? { sort: { campo: "nombre" as const, orden: "desc" as const } }
    : undefined;

  const sortServicio = sortParam === "alpha-asc"
    ? { sort: { campo: "nombre" as const, orden: "asc" as const } }
    : sortParam === "alpha-desc"
    ? { sort: { campo: "nombre" as const, orden: "desc" as const } }
    : undefined;

  const [areas, negocios, servicios] = await Promise.all([
    listarAreas(),
    listarNegocios(sortNegocio),
    listarServicios(sortServicio),
  ]);

  const areasSlice = areas.slice(0, 6);
  const negociosSlice = negocios.slice(0, 6);
  const serviciosSlice = servicios.slice(0, 6);
  const negociosConEnvio = negocios.filter((n) => n.permiteEnvio).slice(0, 6);

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <Link href="/" className="text-lg font-bold bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
                Mi-Pyme
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/catalogo" className="text-muted-foreground hover:text-foreground transition-colors">
                Catálogo
              </Link>
              <Link href="/servicios" className="text-muted-foreground hover:text-foreground transition-colors">
                Servicios
              </Link>
              <Link href="/contacto" className="text-muted-foreground hover:text-foreground transition-colors">
                Contacto
              </Link>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Iniciar sesión</Button>
              </Link>
              <Link href="/auth/registro">
                <Button size="sm">Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <CheckCircle className="h-4 w-4" />
              Plataforma #1 para PYMEs
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl mb-6">
              <span className="bg-gradient-to-r from-primary via-violet to-primary bg-clip-text text-transparent">
                Mi-Pyme
              </span>
            </h1>
            <p className="text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto mb-10">
              Tu plataforma integral para negocios locales. Catálogo, reservas, logística, facturación y ventas en un solo lugar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/registro">
                <Button size="lg" className="min-w-[200px]">
                  Comenzar gratis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/catalogo">
                <Button size="lg" variant="outline" className="min-w-[200px]">
                  Explorar catálogo
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Gratis para comenzar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sort Bar */}
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <SortControls currentSort={sortParam} />
        </div>
      </section>

      {/* Áreas Explorar */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Explora por Áreas
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre negocios organizados por categorías para encontrar exactamente lo que necesitas
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {areasSlice.map((area) => (
              <Link key={area.id} href={`/catalogo?area=${area.slug}`}>
                <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{area.nombre}</h3>
                    <p className="text-sm text-muted-foreground mb-4">/{area.slug}</p>
                    <span className="inline-flex items-center text-sm text-primary font-medium">
                      Ver más <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {areas.length > 6 && (
            <div className="mt-8 text-center">
              <Link href="/catalogo">
                <Button variant="outline" size="lg">
                  Ver todas las áreas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Negocios Destacados */}
      <section className="py-16 sm:py-24 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Negocios Destacados
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Conoce los mejores negocios de la plataforma
            </p>
          </div>
          {negociosSlice.length === 0 ? (
            <EmptyStatePreset preset="search" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {negociosSlice.map((negocio) => (
                <Card
                  key={negocio.id}
                  className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  badge={{
                    text: negocio.activo ? "Abierto" : "Cerrado",
                    variant: negocio.activo ? "success" : "warning",
                  }}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{negocio.nombre}</h3>
                    {negocio.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {negocio.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      {negocio.area && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {negocio.area.nombre}
                        </span>
                      )}
                      {negocio.subareas.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5" />
                          {negocio.subareas.length} subáreas
                        </span>
                      )}
                    </div>
                    <Button variant="primary" size="sm" className="w-full" asChild>
                      <Link href={`/catalogo?negocioId=${negocio.id}`}>
                        Ver productos
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {negocios.length > 6 && (
            <div className="mt-12 text-center">
              <Link href="/catalogo">
                <Button variant="outline" size="lg">
                  Ver todos los negocios
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Servicios Populares */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Servicios Populares
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Reserva los servicios más solicitados por la comunidad
            </p>
          </div>
          {serviciosSlice.length === 0 ? (
            <EmptyStatePreset preset="search" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {serviciosSlice.map((servicio) => (
                <Card
                  key={servicio.id}
                  className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  image={{
                    src: servicio.imagenUrl || "/placeholder-service.jpg",
                    alt: servicio.nombre,
                  }}
                  badge={{
                    text: servicio.activo ? "Disponible" : "Inactivo",
                    variant: servicio.activo ? "success" : "warning",
                  }}
                  footer={
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
                  }
                >
                  <div className="p-6 pt-0">
                    <h3 className="text-lg font-semibold mb-2">{servicio.nombre}</h3>
                    {servicio.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {servicio.descripcion}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {servicio.permiteReservas !== false && (
                        <Button variant="primary" size="sm" className="flex-1" asChild>
                          <Link href={`/reservas?servicioId=${servicio.id}`}>
                            Reservar ahora
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      )}
                      <Link href={`/catalogo?servicioId=${servicio.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver más
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {servicios.length > 6 && (
            <div className="mt-8 text-center">
              <Link href="/servicios">
                <Button variant="outline" size="lg">
                  Ver todos los servicios
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Envío y Transporte */}
      {negociosConEnvio.length > 0 && (
        <section className="py-16 sm:py-24 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Envío y Transporte
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Entrega rápida para productos de los mejores negocios
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {negociosConEnvio.map((negocio) => (
                <Card
                  key={negocio.id}
                  className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  badge={{
                    text: "Envío disponible",
                    variant: "success",
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                      <Truck className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{negocio.nombre}</h3>
                    {negocio.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {negocio.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      {negocio.area && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {negocio.area.nombre}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        Logística
                      </span>
                    </div>
                    <Button variant="primary" size="sm" className="w-full" asChild>
                      <Link href={`/catalogo?negocioId=${negocio.id}`}>
                        Ver productos
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {negocios.filter((n) => n.permiteEnvio).length > 6 && (
              <div className="mt-8 text-center">
                <Link href="/catalogo">
                  <Button variant="outline" size="lg">
                    Ver todas las opciones de envío
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-violet p-8 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              ¿Listo para empezar?
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Únete a cientos de negocios que ya confían en Mi-Pyme para gestionar su operación diaria.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/registro">
                <Button size="lg" variant="secondary" className="min-w-[200px]">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contacto">
                <Button size="lg" variant="outline" className="min-w-[200px] border-white/20 text-white hover:bg-white/10">
                  Contactar ventas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            Mi-Pyme - Plataforma para pequeños comercios
          </p>
        </div>
      </footer>
    </main>
  );
}
