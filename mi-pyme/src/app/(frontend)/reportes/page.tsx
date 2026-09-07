import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import {
  reporteVentasPorDia,
  reporteProductosMasVendidos,
  reporteInventario,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ negocioId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { negocioId } = await searchParams;

  if (!session?.user?.id) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-8">Reportes</h1>
        <p className="text-sm text-gray-500">
          Debes iniciar sesión para ver los reportes.
        </p>
      </main>
    );
  }

  if (!negocioId) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-8">Reportes</h1>
        <p className="text-sm text-gray-500">
          Proporcione un negocioId, por ejemplo:
          /reportes?negocioId=xxx
        </p>
      </main>
    );
  }

  const [ventas, productos, inventario] = await Promise.all([
    reporteVentasPorDia(negocioId),
    reporteProductosMasVendidos(negocioId),
    reporteInventario(negocioId),
  ]);

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Reportes</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Ventas por día</h2>
        {ventas.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay ventas registradas.
          </p>
        ) : (
          <ul className="space-y-2">
            {ventas.map((venta) => (
              <li
                key={venta.fecha}
                className="border rounded p-3 flex justify-between"
              >
                <span className="text-sm text-gray-700">
                  {venta.fecha}
                </span>
                <span className="text-sm">
                  ${venta.totalVentas.toFixed(2)} (×{venta.cantidad})
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Productos más vendidos
        </h2>
        {productos.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay productos vendidos.
          </p>
        ) : (
          <ul className="space-y-2">
            {productos.map((producto) => (
              <li
                key={producto.id}
                className="border rounded p-3 flex justify-between"
              >
                <span className="text-sm text-gray-700">
                  {producto.nombre}
                </span>
                <span className="text-sm">
                  {producto.cantidad} uds — $
                  {producto.totalVentas.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Estado del inventario
        </h2>
        {inventario.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay inventario registrado.
          </p>
        ) : (
          <ul className="space-y-2">
            {inventario.map((item) => (
              <li
                key={item.id}
                className="border rounded p-3 flex justify-between"
              >
                <span className="text-sm text-gray-700">
                  {item.producto}
                </span>
                <span className="text-sm">
                  Stock: {item.cantidadActual} (reorden: {item.puntoReorden}) —{" "}
                  {item.ubicacion}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
