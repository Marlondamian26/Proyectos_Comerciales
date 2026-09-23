import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario, reporteVentasPorDia, reporteProductosMasVendidos } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { TrendingUp, Package } from "lucide-react";

export const dynamic = "force-dynamic";

interface VentasPorDia {
  fecha: string;
  totalVentas: number;
  cantidad: number;
}

interface ProductoVendido {
  id: string;
  nombre: string;
  cantidad: number;
  totalVentas: number;
}

export default async function VentasPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const [ventasPorDia, productosVendidos] = await Promise.all([
    reporteVentasPorDia(negocio.id),
    reporteProductosMasVendidos(negocio.id),
  ]);

  const totalVentas = ventasPorDia.reduce((sum, v) => sum + (v as VentasPorDia).totalVentas, 0);
  const totalItems = ventasPorDia.reduce((sum, v) => sum + (v as VentasPorDia).cantidad, 0);

  return (
    <main className="min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ventas</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Reporte de ventas y productos más vendidos de tu negocio.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Total ventas</p>
          <p className="text-2xl font-bold">${Number(totalVentas).toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Artículos vendidos</p>
          <p className="text-2xl font-bold">{totalItems}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Días con ventas</p>
          <p className="text-2xl font-bold">{ventasPorDia.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3 mb-4 p-6 pb-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Ventas por día</h2>
              <p className="text-sm text-muted-foreground">{ventasPorDia.length} días registrados</p>
            </div>
          </div>
          {ventasPorDia.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No hay ventas registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Fecha</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Artículos</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ventasPorDia.map((v) => (
                    <tr key={v.fecha} className="hover:bg-muted/30">
                      <td className="py-3 px-4">{new Date((v as VentasPorDia).fecha).toLocaleDateString("es-AR")}</td>
                      <td className="py-3 px-4 text-right">${Number((v as VentasPorDia).totalVentas).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">{(v as VentasPorDia).cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4 p-6 pb-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Productos más vendidos</h2>
              <p className="text-sm text-muted-foreground">{productosVendidos.length} productos</p>
            </div>
          </div>
          {productosVendidos.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No hay productos vendidos todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Producto</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Cantidad</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productosVendidos.map((p) => (
                    <tr key={(p as ProductoVendido).id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{(p as ProductoVendido).nombre}</td>
                      <td className="py-3 px-4 text-right">{(p as ProductoVendido).cantidad}</td>
                      <td className="py-3 px-4 text-right">${Number((p as ProductoVendido).totalVentas).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
