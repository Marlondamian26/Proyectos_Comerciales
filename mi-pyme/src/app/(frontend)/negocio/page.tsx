import { auth } from "@/lib/auth";
import {
  getResumenAction,
  getPedidosRecientesAction,
  getReservasProximasAction,
  obtenerNegocioDelUsuario,
  estadoInventario,
} from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { LogoutButton } from "@/components/LogoutButton";
import {
  FileText,
  TrendingUp,
  ShoppingBasket,
  CalendarCheck,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatFiscalValue(
  value: string | null | undefined,
  labels: Record<string, string>
): string {
  return value ? labels[value] ?? value : "—";
}

export default async function NegocioDashboardPage() {
  const session = await auth();
  const userRol = session?.user?.rol;
  const userId = session?.user?.id ?? "";

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <EmptyStatePreset
            preset="search"
            action={{
              label: "Solicitar alta de negocio",
              href: "/negocios/solicitar",
            }}
          />
        </div>
      </main>
    );
  }

  const negocioId = negocio.id;

  const [resumen, pedidosRecientes, reservasProximas, inventario] =
    await Promise.all([
      getResumenAction(negocioId),
      getPedidosRecientesAction(negocioId, 5),
      getReservasProximasAction(negocioId, 5),
      estadoInventario(negocioId),
    ]);

  const inventarioBajo = inventario.filter((inv) => inv.enPuntoReorden).length;

  return (
    <main className="min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Resumen del negocio
          </h1>
          <p className="text-muted-foreground mt-1">
            {resumen.negocio.nombre}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardBackLink />
          <LogoutButton />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
            <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
            {userRol ?? "NEGOCIO"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <ShoppingBasket className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-warning">{resumen.pedidosPendientes} pendientes</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Pedidos pendientes</p>
          <p className="text-2xl font-bold">{resumen.pedidosPendientes}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-warning">{resumen.reservasProximas} próximas</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Reservas próximas</p>
          <p className="text-2xl font-bold">{resumen.reservasProximas}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet/10 text-violet">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-success flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              {inventarioBajo} bajos
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Inventario</p>
          <p className="text-2xl font-bold">{inventario.length}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-success flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              Período actual
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Ventas del período</p>
          <p className="text-2xl font-bold">${Number(resumen.ventasPeriodo).toFixed(2)}</p>
        </Card>
      </div>

      <section id="datos-fiscales" className="scroll-mt-24 mb-8">
        <Card hoverLift={false}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Datos fiscales</h2>
                <p className="text-sm text-muted-foreground">
                  Configuración tributaria aplicada al negocio
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/negocio/mi-negocio#datos-fiscales">Gestionar datos fiscales</a>
            </Button>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted/30 p-4">
              <dt className="text-xs font-medium uppercase text-muted-foreground">Régimen fiscal</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatFiscalValue(negocio.regimenFiscal, {
                  GENERAL: "General",
                  SIMPLIFICADO: "Simplificado",
                  EXENTO: "Exento",
                  NO_SUJETO: "No sujeto",
                })}
              </dd>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <dt className="text-xs font-medium uppercase text-muted-foreground">Tasa de IVA</dt>
              <dd className="mt-1 text-lg font-semibold">
                {negocio.tasaIVA == null ? "—" : `${Number(negocio.tasaIVA).toFixed(2)}%`}
              </dd>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <dt className="text-xs font-medium uppercase text-muted-foreground">Modo de precio</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatFiscalValue(negocio.modoPrecio, {
                  IVA_INCLUIDO: "IVA incluido",
                  IVA_AGREGADO: "IVA agregado",
                })}
              </dd>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <dt className="text-xs font-medium uppercase text-muted-foreground">NIT</dt>
              <dd className="mt-1 text-lg font-semibold">{negocio.nit || "—"}</dd>
            </div>
          </dl>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                <ShoppingBasket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Pedidos recientes</h2>
                <p className="text-sm text-muted-foreground">{pedidosRecientes.length} pedidos recientes</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/negocio/pedidos">Ver todos</a>
            </Button>
          </div>
          {pedidosRecientes.length === 0 ? (
            <EmptyStatePreset preset="orders" />
          ) : (
            <div className="space-y-3">
              {pedidosRecientes.map((pedido) => (
                <div key={pedido.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">
                      Pedido #{pedido.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pedido.usuario?.nombre ?? pedido.usuario?.email ?? "Cliente"} · {pedido.fechaCreacion?.toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">${Number(pedido.total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Reservas próximas</h2>
                <p className="text-sm text-muted-foreground">{reservasProximas.length} reservas próximas</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/negocio/reservas">Ver todas</a>
            </Button>
          </div>
          {reservasProximas.length === 0 ? (
            <EmptyStatePreset preset="reservations" />
          ) : (
            <div className="space-y-3">
              {reservasProximas.map((r: {
                id: string;
                estado: string;
                fechaHoraInicio: Date;
                servicio?: { nombre: string };
                usuario?: { email: string; nombre: string | null };
              }) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{r.servicio?.nombre ?? "Servicio"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.fechaHoraInicio).toLocaleDateString("es-ES", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    r.estado === "confirmada"
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-warning/10 text-warning border border-warning/20"
                  }`}>
                    {r.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
