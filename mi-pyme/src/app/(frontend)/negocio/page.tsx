import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import {
  listarProductos,
  listarServicios,
  estadoInventario,
  listarPedidosPorNegocio,
  reporteVentasPorDia,
  productosMasVendidos,
  obtenerNegocioDelUsuario,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const userRol = session?.user?.rol;
  const userId = session?.user?.id ?? "";

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;
  const negocioId = negocio?.id ?? "";

  const [productos, servicios, inventario, pedidos, ventas, masVendidos] =
    await Promise.all([
      listarProductos({ negocioId }),
      listarServicios({ negocioId }),
      estadoInventario(negocioId),
      listarPedidosPorNegocio(negocioId),
      reporteVentasPorDia(negocioId),
      productosMasVendidos(negocioId),
    ]);

  return (
    <main className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Panel de Negocio</h1>
      <p className="text-sm text-gray-500 mb-8">
        Rol: <span className="font-medium">{userRol ?? "NEGOCIO"}</span>
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Catálogo de Productos</h2>
        {productos.length === 0 ? (
          <p className="text-sm text-gray-500">No hay productos.</p>
        ) : (
          <ul className="space-y-2">
            {productos.map((p) => (
              <li key={p.id} className="border-b pb-1">
                <span className="font-medium">{p.nombre}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ${p.precio.toFixed(2)} · {p.unidadMedida}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Catálogo de Servicios</h2>
        {servicios.length === 0 ? (
          <p className="text-sm text-gray-500">No hay servicios.</p>
        ) : (
          <ul className="space-y-2">
            {servicios.map((s) => (
              <li key={s.id} className="border-b pb-1">
                <span className="font-medium">{s.nombre}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {s.duracionMinutos} min · Capacidad: {s.capacidad}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Inventario</h2>
        {inventario.length === 0 ? (
          <p className="text-sm text-gray-500">No hay inventario.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left pb-2">Producto</th>
                <th className="text-right pb-2">Cantidad</th>
                <th className="text-right pb-2">Punto Reorden</th>
                <th className="text-left pb-2">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td>{inv.producto}</td>
                  <td className="text-right">{inv.cantidadActual}</td>
                  <td className="text-right">{inv.puntoReorden}</td>
                  <td>{inv.ubicacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Pedidos Recibidos</h2>
        {pedidos.length === 0 ? (
          <p className="text-sm text-gray-500">No hay pedidos.</p>
        ) : (
          <ul className="space-y-3">
            {pedidos.map((pedido) => (
              <li key={pedido.id} className="border rounded p-3">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(pedido.fechaCreacion).toLocaleDateString()}
                  </span>
                  <span className="font-bold">${pedido.total.toFixed(2)}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ml-2 ${
                    pedido.estado === "completado"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {pedido.estado}
                </span>
                {pedido.logistica && (
                  <p className="text-xs text-gray-500">
                    Logística: {pedido.logistica.nombre}
                  </p>
                )}
                {pedido.usuario && (
                  <p className="text-xs text-gray-500">
                    Cliente: {pedido.usuario.nombre ?? pedido.usuario.email}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Reporte de Ventas por Día
        </h2>
        {ventas.length === 0 ? (
          <p className="text-sm text-gray-500">Sin ventas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left pb-2">Fecha</th>
                <th className="text-right pb-2">Total Ventas</th>
                <th className="text-right pb-2">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {ventas.slice(0, 10).map((v) => (
                <tr key={v.fecha} className="border-b">
                  <td>{v.fecha}</td>
                  <td className="text-right">${v.totalVentas.toFixed(2)}</td>
                  <td className="text-right">{v.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Productos Más Vendidos
        </h2>
        {masVendidos.length === 0 ? (
          <p className="text-sm text-gray-500">Sin ventas registradas.</p>
        ) : (
          <ul className="space-y-2">
            {masVendidos.slice(0, 10).map((p) => (
              <li key={p.id} className="border-b pb-1 flex justify-between">
                <span>{p.nombre}</span>
                <span className="text-sm text-gray-500">
                  x{p.cantidad} · ${p.totalVentas.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
