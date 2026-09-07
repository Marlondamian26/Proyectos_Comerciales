import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { listarPedidos } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>
        <p className="text-sm text-gray-500">
          Debes iniciar sesión para ver tus pedidos.
        </p>
      </main>
    );
  }

  const pedidos = await listarPedidos(session.user.id);

  const formatoEstado = (estado: string) => {
    const map: Record<string, string> = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      cancelada: "Cancelada",
    };
    return map[estado] ?? estado;
  };

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>

      {pedidos.length === 0 ? (
        <p className="text-sm text-gray-500">No tienes pedidos.</p>
      ) : (
        <ul className="space-y-6">
          {pedidos.map((pedido) => {
            const negocios = Array.from(
              new Map(
                pedido.items
                  .filter((item) => item.negocio)
                  .map((item) => [item.negocio!.id, item.negocio!])
              ).values()
            );

            return (
              <li key={pedido.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg">
                    Pedido #{pedido.id.slice(-8)}
                  </h3>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded ${
                      pedido.estado === "pendiente"
                        ? "bg-yellow-100 text-yellow-800"
                        : pedido.estado === "confirmada"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {formatoEstado(pedido.estado)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mt-2">
                  Total: ${pedido.total.toFixed(2)}
                </p>

                {negocios.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Negocios:{" "}
                    {negocios.map((n) => n.nombre).join(", ")}
                  </p>
                )}

                {pedido.logistica && (
                  <p className="text-sm text-gray-600 mt-1">
                    Logística asignada: {pedido.logistica.nombre}
                  </p>
                )}

                {pedido.items.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {pedido.items.map((item) => {
                      const nombre =
                        item.producto?.nombre ??
                        item.servicio?.nombre ??
                        "Item";
                      return (
                        <li
                          key={item.id}
                          className="text-sm text-gray-600 flex justify-between"
                        >
                          <span>
                            {nombre} × {item.cantidad}
                          </span>
                          <span>${item.subtotal.toFixed(2)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
