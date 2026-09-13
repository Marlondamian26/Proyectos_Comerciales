import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  verCarrito,
  listarReservas,
  listarPedidos,
  listarFacturas,
} from "@/lib/actions";
import { listarAreas, listarNegocios, listarServicios } from "@/lib/actions";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { LogoutButton } from "@/components/LogoutButton";
import { RegistroNotification } from "@/components/RegistroNotification";
import { SortControls } from "@/components/SortControls";
import {
  ShoppingBag,
  Calendar,
  Package,
  Receipt,
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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const userRol = session?.user?.rol;

  if (!userRol || userRol !== "CLIENTE") {
    redirect("/");
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

  const [carrito, reservas, pedidos, facturas, areas, negocios, servicios] = await Promise.all([
    verCarrito(userId),
    listarReservas(userId),
    listarPedidos(userId),
    listarFacturas(userId),
    listarAreas(),
    listarNegocios(sortNegocio),
    listarServicios(sortServicio),
  ]);

  const carritoCount = carrito?.items?.length ?? 0;
  const carritoTotal = carrito?.items?.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0) ?? 0;
  const pedidosData = Array.isArray(pedidos) ? pedidos : pedidos?.data ?? [];
  const facturasData = Array.isArray(facturas) ? facturas : facturas?.data ?? [];

  const areasSlice = areas.slice(0, 6);
  const negociosSlice = negocios.slice(0, 6);
  const serviciosSlice = servicios.slice(0, 6);
  const negociosConEnvio = negocios.filter((n) => n.permiteEnvio).slice(0, 6);

  return (
    <main className="min-h-screen">
      {/* Dashboard Summary Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Panel de Cliente
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Gestiona tus compras, reservas y pedidos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LogoutButton />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                {userRol ?? "CLIENTE"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-violet/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {carritoCount} items
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Carrito</p>
            <p className="text-2xl font-bold">${carritoTotal.toFixed(2)}</p>
            <Link href="/carrito">
              <Button variant="ghost" size="sm" className="mt-3 w-full">
                Ver carrito
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {reservas.length} activas
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Reservas</p>
            <p className="text-2xl font-bold">{reservas.length}</p>
            <Link href="/reservas">
              <Button variant="ghost" size="sm" className="mt-3 w-full">
                Gestionar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {pedidosData.length} pedidos
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Pedidos</p>
            <p className="text-2xl font-bold">{pedidosData.length}</p>
            <Link href="/pedidos">
              <Button variant="ghost" size="sm" className="mt-3 w-full">
                Ver pedidos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet/10 text-violet">
                <Receipt className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {facturasData.length} facturas
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Facturas</p>
            <p className="text-2xl font-bold">{facturasData.length}</p>
            <Link href="/facturas">
              <Button variant="ghost" size="sm" className="mt-3 w-full">
                Ver facturas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Carrito Actual</h2>
                  <p className="text-sm text-muted-foreground">
                    {carritoCount} producto{carritoCount !== 1 ? "s" : ""} en tu carrito
                  </p>
                </div>
              </div>
            </div>
            {carrito?.items.length === 0 || !carrito ? (
              <EmptyStatePreset preset="cart" action={{ label: "Ir al catálogo", href: "/catalogo" }} />
            ) : (
              <div className="space-y-3">
                {carrito.items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {item.tipo === "producto" ? item.producto?.nombre : item.servicio?.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          x{item.cantidad} · ${item.precioUnitario.toFixed(2)} c/u
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">
                      ${(item.precioUnitario * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Reservas Activas</h2>
                  <p className="text-sm text-muted-foreground">
                    Próximas reservas de servicios
                  </p>
                </div>
              </div>
            </div>
            {reservas.length === 0 ? (
              <EmptyStatePreset preset="reservations" />
            ) : (
              <div className="space-y-3">
                {reservas.slice(0, 5).map((reserva) => (
                  <div
                    key={reserva.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{reserva.servicio?.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reserva.fechaHoraInicio).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        reserva.estado === "confirmada"
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-warning/10 text-warning border border-warning/20"
                      }`}
                    >
                      {reserva.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Landing Page Sections */}
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

      <RegistroNotification />
    </main>
  );
}
