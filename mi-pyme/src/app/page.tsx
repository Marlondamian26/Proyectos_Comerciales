import { auth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/auth/dashboard-paths";
import { Rol } from "@/lib/auth/roles";
import { listarAreas, listarNegocios, listarServicios } from "@/lib/actions";
import prisma from "@/lib/db/prisma";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { SortControls } from "@/components/SortControls";
import { CARD_TYPOGRAPHY } from "@/components/ui/CardTypography";
import { HeroCarousel } from "@/components/home/HeroCarousel";
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
  const isLoggedIn = !!session?.user;
  const userRol = session?.user?.rol;
  const dashboardUrl = userRol ? getDashboardPath(userRol) : "/cliente";
  const canReserveFromHome = !isLoggedIn || userRol === Rol.CLIENTE;

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

  const heroImagesDb = await prisma.heroImage.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  });

  const heroImages =
    heroImagesDb.length > 0
      ? heroImagesDb.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        }))
      : [
          {
            id: "1",
            url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80",
            alt: "Marketplace local",
          },
          {
            id: "2",
            url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80",
            alt: "Tienda de barrio",
          },
          {
            id: "3",
            url: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1920&q=80",
            alt: "Compras en la comunidad",
          },
        ];

  const areasSlice = areas.slice(0, 6);
  const negociosSlice = negocios.slice(0, 6);
  const serviciosSlice = servicios.slice(0, 6);
  const negociosConEnvio = negocios.filter((n) => n.permiteEnvio).slice(0, 6);

  return (
    <main className="min-h-screen app-background">
      {/* Decorative blobs */}
      <div className="app-blob app-blob--primary top-20 left-20 w-72 h-72" />
      <div className="app-blob app-blob--secondary bottom-20 right-20 w-96 h-96" />
      <div className="app-blob app-blob--accent top-1/2 left-1/3 w-80 h-80" />
      {/* Navigation */}
      {/* HomeNav eliminado: navbar única en layout.tsx raíz */}

      {/* Hero Section con Carrusel */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] overflow-hidden">
        {/* Carrusel de fondo */}
        <HeroCarousel images={heroImages} />

        {/* Overlay gradiente con la paleta de Mi-Pyme + oscuro para contraste */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/55 via-primary/35 to-interactive-secondary/60" />
        <div className="absolute inset-0 bg-black/25" />

        {/* Contenido del hero */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center pt-12 sm:pt-16 pb-8 sm:pb-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white">
            <CheckCircle className="h-4 w-4" />
            Plataforma #1 para PYMEs
          </div>

          <div className="mb-6 flex justify-center">
            <Image
              src="/images/logos/logo-principal.png"
              alt="Mi-Pyme"
              width={768}
              height={288}
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 60vw, 50vw"
              priority
              className="mx-auto h-32 sm:h-40 md:h-48 w-auto object-contain drop-shadow-lg"
            />
          </div>

          <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg text-white/95 drop-shadow-md leading-7">
            Tu plataforma integral para negocios locales. Catálogo, reservas, logística, facturación y ventas en un solo lugar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {isLoggedIn ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="w-full border-2 border-white/60 bg-primary text-primary-foreground hover:border-white hover:bg-primary/90 sm:w-auto sm:min-w-[200px]"
                >
                  <Link href={dashboardUrl}>
                    Ir a mi dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-white/60 text-white hover:bg-white/10 sm:w-auto sm:min-w-[200px]"
                >
                  <Link href="/catalogo">
                    Explorar catálogo
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="w-full border-2 border-white/60 bg-primary text-primary-foreground hover:border-white hover:bg-primary/90 sm:w-auto sm:min-w-[200px]"
                >
                  <Link href="/auth/registro">
                    Comenzar gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-white/60 text-white hover:bg-white/10 sm:w-auto sm:min-w-[200px]"
                >
                  <Link href="/catalogo">
                    Explorar catálogo
                  </Link>
                </Button>
              </>
            )}
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-white/90 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-white" />
              <span>Gratis para comenzar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-white" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-white" />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-b from-transparent to-[var(--color-background)] sm:h-32"
        />
      </section>

      {/* Sort Bar */}
      <section className="bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Suspense fallback={<div className="h-9 w-52 animate-pulse rounded-md bg-muted/40" />}>
            <SortControls currentSort={sortParam} />
          </Suspense>
        </div>
      </section>
      <div className="section-divider" />

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
            <div
              className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
              data-testid="servicios-populares-grid"
            >
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
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {servicio.duracionMinutos} min
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {servicio.capacidad}
                      </span>
                    </div>
                  }
                >
                  <div className="p-4 sm:p-6 pt-0">
                    <h3
                      className={`${CARD_TYPOGRAPHY.title} mb-2`}
                      data-testid="card-title"
                    >
                      {servicio.nombre}
                    </h3>
                    {servicio.descripcion && (
                      <p
                        className={`${CARD_TYPOGRAPHY.subtitle} mb-4`}
                        data-testid="card-subtitle"
                      >
                        {servicio.descripcion}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {servicio.permiteReservas !== false && canReserveFromHome && (
                        <Button variant="primary" size="sm" className="flex-1 w-full sm:text-base" asChild>
                          <Link href={`/reservas?servicioId=${servicio.id}`}>
                            Reservar ahora
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      )}
                      <Link href={`/catalogo?servicioId=${servicio.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full sm:text-base">
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
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {areasSlice.map((area) => (
              <Link key={area.id} href={`/catalogo?area=${area.slug}`}>
                <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <div className="p-3 sm:p-4 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3
                      className={`${CARD_TYPOGRAPHY.title} mb-2 text-center`}
                      data-testid="card-title"
                    >
                      {area.nombre}
                    </h3>
                    <p
                      className={`${CARD_TYPOGRAPHY.subtitle} mb-4 text-center`}
                      data-testid="card-subtitle"
                    >
                      /{area.slug}
                    </p>
                    <span className="inline-flex items-center text-xs sm:text-sm text-primary font-medium">
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
      <section className="py-16 sm:py-24 bg-background-alt">
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
            <div
              className="
                grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                gap-2 sm:gap-4
              "
              data-testid="negocios-destacados-grid"
            >
              {negociosSlice.map((negocio) => (
                <Card
                  key={negocio.id}
                  className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  badge={{
                    text: negocio.activo ? "Abierto" : "Cerrado",
                    variant: negocio.activo ? "success" : "warning",
                  }}
                >
                <div className="p-3 sm:p-4">
                  <h3
                    className={`${CARD_TYPOGRAPHY.title} mb-1`}
                    data-testid="card-title"
                  >
                    {negocio.nombre}
                  </h3>
                  {negocio.descripcion && (
                    <p
                      className={`${CARD_TYPOGRAPHY.subtitle} mb-3`}
                      data-testid="card-subtitle"
                    >
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
                    <Button variant="primary" size="sm" className="w-full sm:text-base" asChild>
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

      {/* Envío y Transporte */}
      {negociosConEnvio.length > 0 && (
        <section className="py-16 sm:py-24 bg-background-alt">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Envío y Transporte
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Entrega rápida para productos de los mejores negocios
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {negociosConEnvio.map((negocio) => (
                <Card
                  key={negocio.id}
                  className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  badge={{
                    text: "Envío disponible",
                    variant: "success",
                  }}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                      <Truck className="h-6 w-6" />
                    </div>
                    <h3
                      className={`${CARD_TYPOGRAPHY.title} mb-2`}
                      data-testid="card-title"
                    >
                      {negocio.nombre}
                    </h3>
                    {negocio.descripcion && (
                      <p
                        className={`${CARD_TYPOGRAPHY.subtitle} mb-4`}
                        data-testid="card-subtitle"
                      >
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
                    <Button variant="primary" size="sm" className="w-full sm:text-base" asChild>
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

      {/* Cómo funciona */}
      <section className="py-16 sm:py-24 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12 sm:text-4xl">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Explora</h3>
              <p className="text-muted-foreground">Descubre negocios y servicios cerca de ti.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Compra o reserva</h3>
              <p className="text-muted-foreground">Agrega al carrito, reserva y paga de forma segura.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Recibe</h3>
              <p className="text-muted-foreground">Recibe tu pedido en casa o recógelo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="
            relative overflow-hidden rounded-2xl sm:rounded-3xl
            bg-gradient-to-br from-primary/10 via-primary/5 to-interactive-secondary/10
            border border-primary/20 p-6 text-center
            dark:from-[var(--color-background)] dark:via-[var(--color-surface-alt)] dark:to-[var(--color-background)] dark:border-border sm:p-12 lg:p-16
          " data-testid="home-cta">
            {/* Blobs decorativos sutiles */}
            <div className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20" aria-hidden="true">
              <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-white/10 sm:h-72 sm:w-72" />
              <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-interactive-secondary/10 blur-3xl dark:bg-white/10 sm:h-96 sm:w-96" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:mb-4 sm:text-3xl lg:text-4xl dark:text-white">
                ¿Listo para empezar?
              </h2>
              <p className="mb-6 text-base text-muted-foreground sm:mb-8 sm:text-lg dark:text-white/90">
                Únete a cientos de negocios que ya confían en Mi-Pyme para gestionar su operación diaria.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  href={isLoggedIn ? dashboardUrl : "/auth/registro"}
                  className="
                    inline-flex items-center justify-center gap-2
                    w-full sm:w-auto
                    h-12 px-6
                    rounded-lg
                    bg-primary text-primary-foreground
                    font-semibold
                    hover:bg-primary/90
                    active:scale-[0.98]
                    transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary
                    min-h-[48px]
                  "
                >
                  {isLoggedIn ? "Ir a mi dashboard" : "Crear cuenta gratis"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contacto"
                  className="
                    inline-flex items-center justify-center gap-2
                    w-full sm:w-auto
                    h-12 px-6
                    rounded-lg
                    border-2 border-primary/30 text-primary dark:border-white/60 dark:text-white
                    font-semibold
                    hover:bg-primary/5 hover:border-primary dark:hover:bg-white/10 dark:hover:border-white
                    active:scale-[0.98]
                    transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary
                    min-h-[48px]
                  "
                >
                  Contactar ventas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
