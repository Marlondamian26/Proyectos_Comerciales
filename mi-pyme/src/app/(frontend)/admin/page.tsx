import { auth } from "@/lib/auth";
import {
  listarAreas,
  listarNegocios,
  listarUsuarios,
  reporteVentasGlobal,
} from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { LogoutButton } from "@/components/LogoutButton";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import {
  Building2,
  Users,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  const userRol = session?.user?.rol;

  const [areas, negocios, usuarios, ventas] = await Promise.all([
    listarAreas(),
    listarNegocios(),
    listarUsuarios(),
    reporteVentasGlobal(),
  ]);

  const totalVentas = ventas.reduce((sum, v) => sum + v.totalVentas, 0);
  const totalPedidos = ventas.reduce((sum, v) => sum + v.cantidad, 0);

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Panel de Administrador
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Gestiona áreas, negocios, usuarios y reportes globales
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DashboardBackLink />
              <LogoutButton />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                {userRol ?? "ADMIN"}
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
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-success flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                Activo
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Áreas</p>
            <p className="text-2xl font-bold">{areas.length}</p>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-success flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {negocios.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Negocios</p>
            <p className="text-2xl font-bold">{negocios.length}</p>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-success flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {usuarios.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Usuarios</p>
            <p className="text-2xl font-bold">{usuarios.length}</p>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet/10 text-violet">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-success flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                {totalPedidos}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Ventas Totales</p>
            <p className="text-2xl font-bold">${totalVentas.toFixed(2)}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Áreas</h2>
                  <p className="text-sm text-muted-foreground">
                    {areas.length} área{areas.length !== 1 ? "s" : ""} registrada{areas.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            {areas.length === 0 ? (
              <EmptyStatePreset preset="areas" />
            ) : (
              <div className="space-y-3">
                {areas.slice(0, 5).map((area) => (
                  <div
                    key={area.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{area.nombre}</p>
                        <p className="text-xs text-muted-foreground">/{area.slug}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        area.activo
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                      }`}
                    >
                      {area.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Usuarios Recientes</h2>
                  <p className="text-sm text-muted-foreground">
                    {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado{usuarios.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            {usuarios.length === 0 ? (
              <EmptyStatePreset preset="users" />
            ) : (
              <div className="space-y-3">
                {usuarios.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet text-xs font-bold text-white">
                        {(u.nombre ?? u.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.nombre ?? "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
                      {u.rol}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Reporte Global de Ventas</h2>
                <p className="text-sm text-muted-foreground">
                  Resumen de ventas por día
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          {ventas.length === 0 ? (
            <EmptyStatePreset preset="search" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Total Ventas
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Tendencia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ventas.slice(0, 10).map((v, idx) => {
                    const prev = ventas[idx + 1];
                    const trend = prev ? ((v.totalVentas - prev.totalVentas) / prev.totalVentas) * 100 : 0;
                    return (
                      <tr key={v.fecha} className="hover:bg-muted/30 transition-colors duration-200">
                        <td className="py-3.5 px-4">
                          <span className="font-medium">{v.fecha}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-semibold">${v.totalVentas.toFixed(2)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-muted-foreground">
                          {v.cantidad}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {trend !== 0 && (
                            <span
                              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                trend > 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              {trend > 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {Math.abs(trend).toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
