import { auth } from "@/lib/auth";
import {
  listarProveedoresLogisticos,
  listarOpcionesLogistica,
  listarPedidosAsignados,
} from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { LogoutButton } from "@/components/LogoutButton";
import { RegistroNotification } from "@/components/RegistroNotification";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import {
  Truck,
  Package,
  MapPin,
  CheckCircle,
  MoreVertical,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const userRol = session?.user?.rol;

  const [proveedores, opciones, pedidosAsignados] = await Promise.all([
    listarProveedoresLogisticos(),
    listarOpcionesLogistica(),
    listarPedidosAsignados(userId),
  ]);

  const pedidosPendientes = pedidosAsignados.filter((p) => p.estado !== "completado").length;
  const pedidosCompletados = pedidosAsignados.filter((p) => p.estado === "completado").length;

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Panel de Logística
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Gestiona pedidos, proveedores y entregas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DashboardBackLink />
              <LogoutButton />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                {userRol ?? "LOGISTICA"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-warning">
                {pedidosPendientes} pendientes
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Pedidos Pendientes</p>
            <p className="text-2xl font-bold">{pedidosPendientes}</p>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-success">
                {pedidosCompletados} completados
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Entregados</p>
            <p className="text-2xl font-bold">{pedidosCompletados}</p>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {opciones.length} opciones
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Opciones Logísticas</p>
            <p className="text-2xl font-bold">{opciones.length}</p>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet/10 text-violet">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {proveedores.length} proveedores
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Proveedores</p>
            <p className="text-2xl font-bold">{proveedores.length}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Pedidos Asignados</h2>
                  <p className="text-sm text-muted-foreground">
                    {pedidosAsignados.length} pedido{pedidosAsignados.length !== 1 ? "s" : ""} asignado{pedidosAsignados.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            {pedidosAsignados.length === 0 ? (
              <EmptyStatePreset preset="logistics" />
            ) : (
              <div className="space-y-3">
                {pedidosAsignados.slice(0, 5).map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Pedido #{pedido.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pedido.fechaCreacion).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          pedido.estado === "completado"
                            ? "bg-success/10 text-success border border-success/20"
                            : pedido.estado === "en_camino"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-warning/10 text-warning border border-warning/20"
                        }`}
                      >
                        {pedido.estado}
                      </span>
                      <span className="font-semibold text-sm">
                        ${pedido.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Opciones Logísticas</h2>
                  <p className="text-sm text-muted-foreground">
                    {opciones.length} opción{opciones.length !== 1 ? "es" : ""} disponible{opciones.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            {opciones.length === 0 ? (
              <EmptyStatePreset preset="logistics" />
            ) : (
              <div className="space-y-3">
                {opciones.slice(0, 5).map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{op.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {op.proveedor?.nombre} · {op.tipo}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      ${op.tarifaBase.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      <RegistroNotification />
    </main>
  );
}
