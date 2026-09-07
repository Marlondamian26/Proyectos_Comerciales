"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PedidoItem = {
  id: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  negocioId: string;
  producto?: { id: string; nombre: string };
  servicio?: { id: string; nombre: string };
};

type OpcionLogistica = {
  id: string;
  nombre: string;
  precio: number;
  proveedor: { nombre: string };
};

type Pedido = {
  id: string;
  estado: string;
  total: number;
  tipo: string;
  direccionEntrega: string;
  fechaCreacion: string;
  items: PedidoItem[];
  logistica?: OpcionLogistica | null;
  factura?: { id: string } | null;
};

export default function PedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/pedidos");
        if (!res.ok) throw new Error("error");
        const data = await res.json();
        if (!cancelled) setPedidos(data);
      } catch {
        if (!cancelled)
          setError("No se pudieron cargar los pedidos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEmitirFactura = async (pedidoId: string) => {
    const res = await fetch("/api/facturas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId }),
    });
    if (res.ok) {
      router.push("/facturas");
    } else {
      const data = await res.json();
      setError(data.error || "Error al emitir factura");
    }
  };

  if (loading) return <p className="p-6">Cargando pedidos...</p>;

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {pedidos.length === 0 ? (
        <p className="text-sm text-gray-500">No tienes pedidos.</p>
      ) : (
        <ul className="space-y-4">
          {pedidos.map((pedido) => (
            <li
              key={pedido.id}
              className="border rounded p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500">
                    {new Date(pedido.fechaCreacion).toLocaleDateString()}
                  </p>
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded ${
                      pedido.estado === "completado"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {pedido.estado}
                  </span>
                </div>
                <span className="font-bold">${pedido.total.toFixed(2)}</span>
              </div>

              <ul className="text-sm text-gray-600 mb-2 space-y-1">
                {pedido.items.map((item) => (
                  <li key={item.id}>
                    {item.producto?.nombre ?? item.servicio?.nombre} x
                    {item.cantidad}
                  </li>
                ))}
              </ul>

              {pedido.logistica && (
                <p className="text-xs text-gray-500">
                  Logística: {pedido.logistica.nombre} (
                  {pedido.logistica.proveedor.nombre})
                </p>
              )}

              {!pedido.factura && pedido.estado === "completado" && (
                <button
                  onClick={() => handleEmitirFactura(pedido.id)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Emitir factura
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
