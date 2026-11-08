import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  verCarrito,
  listarReservas,
  listarPedidos,
  listarFacturas,
} from "@/lib/actions";
import { listarNegocios } from "@/lib/actions";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { LogoutButton } from "@/components/LogoutButton";
import { RegistroNotification } from "@/components/RegistroNotification";
import {
  ShoppingBag,
  Calendar,
  Package,
  Receipt,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const userRol = session?.user?.rol;

  if (!userRol || userRol !== "CLIENTE") {
    redirect("/");
  }

  const [carrito, reservas, pedidos, facturas, negocios] = await Promise.all([
    verCarrito(userId),
    listarReservas(userId),
    listarPedidos(userId),
    listarFacturas(userId),
    listarNegocios(),
  ]);

  const carritoCount = carrito?.items?.length ?? 0;
  const carritoTotal = carrito?.items?.reduce((sum: number, item: { precioUnitario: number; cantidad: number }) => sum + item.precioUnitario * item.cantidad, 0) ?? 0;
  const pedidosData = Array.isArray(pedidos) ? pedidos : pedidos?.data ?? [];
  const facturasData = Array.isArray(facturas) ? facturas : facturas?.data ?? [];
  const negociosSlice = negocios.slice(0, 4);

  return (
    <main className="min-h-screen app-background">
      <div className="app-blob app-blob--primary top-20 left-20 w-72 h-72" />
      <div className="app-blob app-blob--secondary bottom-20 right-20 w-96 h-96" />

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Panel de Cliente</h1>
              <p className="text-muted-foreground mt-1">Gestiona tus compras y reservas</p>
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary"><ShoppingBag className="h-5 w-5" /></div>
              <span className="text-xs font-medium text-muted-foreground">{carritoCount} items</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Carrito</p>
            <p className="text-xl sm:text-2xl font-bold">${carritoTotal.toFixed(2)}</p>
            <Link href="/carrito"><Button variant="ghost" size="sm" className="mt-3 w-full">Ver carrito <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent"><Calendar className="h-5 w-5" /></div>
              <span className="text-xs font-medium text-muted-foreground">{reservas.length} activas</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Reservas</p>
            <p className="text-xl sm:text-2xl font-bold">{reservas.length}</p>
            <Link href="/reservas"><Button variant="ghost" size="sm" className="mt-3 w-full">Gestionar <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary"><Package className="h-5 w-5" /></div>
              <span className="text-xs font-medium text-muted-foreground">{pedidosData.length} pedidos</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Pedidos</p>
            <p className="text-xl sm:text-2xl font-bold">{pedidosData.length}</p>
            <Link href="/pedidos"><Button variant="ghost" size="sm" className="mt-3 w-full">Ver pedidos <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary"><Receipt className="h-5 w-5" /></div>
              <span className="text-xs font-medium text-muted-foreground">{facturasData.length} facturas</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Facturas</p>
            <p className="text-xl sm:text-2xl font-bold">{facturasData.length}</p>
            <Link href="/facturas"><Button variant="ghost" size="sm" className="mt-3 w-full">Ver facturas <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pedidos recientes</h2>
            <Link href="/pedidos" className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          {pedidosData.length === 0 ? (
            <EmptyStatePreset preset="orders" action={{ label: "Ir al catálogo", href: "/catalogo" }} />
          ) : (
            <div className="space-y-3">
              {pedidosData.slice(0, 3).map((p: { id: string; estado?: string; total?: number }) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-medium">Pedido #{String(p.id).slice(-6)}</p>
                    <p className="text-xs text-muted-foreground">{p.estado}</p>
                  </div>
                  <span className="font-semibold text-sm">${Number(p.total ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Reservas próximas</h2>
            <Link href="/reservas" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          {reservas.length === 0 ? (
            <EmptyStatePreset preset="reservations" action={{ label: "Explorar servicios", href: "/servicios" }} />
          ) : (
            <div className="space-y-3">
              {reservas.slice(0, 3).map((reserva) => (
                <div key={reserva.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-medium">{reserva.servicio?.nombre}</p>
                    <p className="text-xs text-muted-foreground">{new Date(reserva.fechaHoraInicio).toLocaleDateString("es-ES")}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${reserva.estado === "confirmada" ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"}`}>{reserva.estado}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <section>
          <h2 className="text-xl font-semibold mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link href="/catalogo"><Button variant="outline" className="w-full justify-start min-h-[44px]"><ShoppingBag className="h-4 w-4 mr-2" />Catálogo</Button></Link>
            <Link href="/servicios"><Button variant="outline" className="w-full justify-start min-h-[44px]"><Calendar className="h-4 w-4 mr-2" />Reservar</Button></Link>
            <Link href="/notificaciones"><Button variant="outline" className="w-full justify-start min-h-[44px]"><Receipt className="h-4 w-4 mr-2" />Notificaciones</Button></Link>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Negocios destacados</h2>
            <Link href="/catalogo" className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {negociosSlice.map((negocio) => (
              <Card key={negocio.id} className="h-full" badge={{ text: negocio.activo ? "Abierto" : "Cerrado", variant: negocio.activo ? "success" : "warning" }}>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{negocio.nombre}</h3>
                  {negocio.descripcion && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{negocio.descripcion}</p>}
                  <Button variant="primary" size="sm" className="w-full" asChild><Link href={`/catalogo?negocioId=${negocio.id}`}>Ver productos <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t bg-background py-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm text-muted-foreground">Mi-Pyme - Plataforma para pequeños comercios</p>
        </div>
      </footer>
      <RegistroNotification />
    </main>
  );
}
