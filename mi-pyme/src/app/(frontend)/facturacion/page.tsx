import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { listarFacturas } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-8">Facturación</h1>
        <p className="text-sm text-gray-500">
          Debes iniciar sesión para ver tus facturas.
        </p>
      </main>
    );
  }

  const facturas = await listarFacturas(session.user.id);

  const formatoEstado = (estado: string) => {
    const map: Record<string, string> = {
      emitida: "Emitida",
      pagada: "Pagada",
      cancelada: "Cancelada",
    };
    return map[estado] ?? estado;
  };

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Facturación</h1>

      {facturas.length === 0 ? (
        <p className="text-sm text-gray-500">No tienes facturas.</p>
      ) : (
        <ul className="space-y-6">
          {facturas.map((factura) => (
            <li key={factura.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg">
                  Factura #{factura.numero}
                </h3>
                <span className="text-sm text-gray-700 font-medium">
                  Total: ${factura.total.toFixed(2)}
                </span>
              </div>

              <span
                className={`inline-block text-xs px-2 py-1 rounded ${
                  factura.estado === "emitida"
                    ? "bg-yellow-100 text-yellow-800"
                    : factura.estado === "pagada"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {formatoEstado(factura.estado)}
              </span>

              <p className="text-sm text-gray-700 mt-2">
                Fecha:{" "}
                {new Date(factura.fecha).toLocaleDateString("es-ES")}
              </p>

              <p className="text-sm text-gray-700 mt-1">
                Subtotal: ${factura.subtotal.toFixed(2)}
              </p>

              <p className="text-sm text-gray-700">
                Impuestos: ${factura.impuestos.toFixed(2)}
              </p>

              {factura.pedido && (
                <p className="text-sm text-gray-600 mt-1">
                  Pedido: #{factura.pedido.id.slice(-8)}
                </p>
              )}

              {factura.items && factura.items.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {factura.items.map((item) => {
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
          ))}
        </ul>
      )}
    </main>
  );
}
