import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import {
  verCarrito,
  listarReservas,
  listarPedidos,
  listarFacturas,
  cancelarReserva,
} from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? "";
  const userRol = session?.user?.rol;

  const [carrito, reservas, pedidos, facturas] = await Promise.all([
    verCarrito(userId),
    listarReservas(userId),
    listarPedidos(userId),
    listarFacturas(userId),
  ]);

  return (
    <main className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Panel de Cliente</h1>
      <p className="text-sm text-gray-500 mb-8">
        Rol: <span className="font-medium">{userRol ?? "CLIENTE"}</span>
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Carrito Actual</h2>
        {carrito?.items.length === 0 || !carrito ? (
          <p className="text-sm text-gray-500">El carrito está vacío.</p>
        ) : (
          <ul className="space-y-2">
            {carrito.items.map((item) => (
              <li key={item.id} className="border-b pb-1 flex justify-between">
                <span>
                  {item.tipo === "producto"
                    ? item.producto?.nombre
                    : item.servicio?.nombre}{" "}
                  x{item.cantidad}
                </span>
                <span>${(item.precioUnitario * item.cantidad).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Link
            href="/carrito"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ver carrito →
          </Link>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Reservas Activas</h2>
        {reservas.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes reservas activas.</p>
        ) : (
          <ul className="space-y-3">
            {reservas.map((reserva) => (
              <li
                key={reserva.id}
                className="border rounded p-3 flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">{reserva.servicio?.nombre}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(reserva.fechaHoraInicio).toLocaleString()}
                  </span>
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded ${
                      reserva.estado === "confirmada"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {reserva.estado}
                  </span>
                </div>
                {reserva.estado !== "cancelada" && (
                  <form action={cancelarReserva.bind(null, reserva.id, userId)}>
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Cancelar
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Pedidos Realizados</h2>
        {pedidos.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes pedidos.</p>
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
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Facturas Emitidas</h2>
        {facturas.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes facturas.</p>
        ) : (
          <ul className="space-y-3">
            {facturas.map((factura) => (
              <li key={factura.id} className="border rounded p-3 flex justify-between">
                <div>
                  <span className="font-medium">{factura.numero}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(factura.fecha).toLocaleDateString()}
                  </span>
                </div>
                <span className="font-bold">${factura.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
