import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import {
  listarProveedoresLogisticos,
  listarOpcionesLogistica,
  listarPedidosAsignados,
  actualizarEstadoPedido,
} from "@/lib/actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? "";
  const userRol = session?.user?.rol;

  const [proveedores, opciones, pedidosAsignados] = await Promise.all([
    listarProveedoresLogisticos(),
    listarOpcionesLogistica(),
    listarPedidosAsignados(userId),
  ]);

  return (
    <main className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Panel de Logística</h1>
      <p className="text-sm text-gray-500 mb-8">
        Rol: <span className="font-medium">{userRol ?? "LOGISTICA"}</span>
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Pedidos Asignados
        </h2>
        {pedidosAsignados.length === 0 ? (
          <p className="text-sm text-gray-500">
            No tienes pedidos asignados.
          </p>
        ) : (
          <ul className="space-y-3">
            {pedidosAsignados.map((pedido) => (
              <li key={pedido.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500">
                      {new Date(pedido.fechaCreacion).toLocaleDateString()}
                    </p>
                    <span className="font-medium">
                      Pedido #{pedido.id.slice(0, 8)}
                    </span>
                    <span
                      className={`ml-2 text-xs px-2 py-1 rounded ${
                        pedido.estado === "completado"
                          ? "bg-green-100 text-green-800"
                          : pedido.estado === "en_camino"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {pedido.estado}
                    </span>
                    <p className="text-sm text-gray-500">
                      Cliente: {pedido.usuario?.nombre ?? pedido.usuario?.email}
                    </p>
                  </div>
                  <span className="font-bold">${pedido.total.toFixed(2)}</span>
                </div>
                <form action={async () => {
                  "use server";
                  await actualizarEstadoPedido(pedido.id, "completado");
                  revalidatePath("/logistica");
                }}>
                  <button
                    type="submit"
                    disabled={pedido.estado === "completado"}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Marcar como entregado
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Opciones Logísticas Disponibles
        </h2>
        {opciones.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay opciones logísticas disponibles.
          </p>
        ) : (
          <ul className="space-y-3">
            {opciones.map((op) => (
              <li key={op.id} className="border rounded p-3">
                <span className="font-medium">{op.nombre}</span>
                <span className="text-sm text-gray-500 ml-2">
                  Tarifa base: ${op.tarifaBase.toFixed(2)} · Tipo: {op.tipo}
                </span>
                <p className="text-xs text-gray-500">
                  Proveedor: {op.proveedor?.nombre}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Proveedores Logísticos
        </h2>
        {proveedores.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay proveedores disponibles.
          </p>
        ) : (
          <ul className="space-y-3">
            {proveedores.map((prov) => (
              <li key={prov.id} className="border rounded p-3">
                <span className="font-medium">{prov.nombre}</span>
                <span className="text-sm text-gray-500 ml-2">
                  Zona: {prov.zonaCobertura} · Contacto: {prov.contacto}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
