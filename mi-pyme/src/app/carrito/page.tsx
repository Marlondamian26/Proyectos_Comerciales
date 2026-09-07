"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type CarritoItem = {
  id: string;
  cantidad: number;
  precioUnitario: number;
  tipo: string;
  producto?: { id: string; nombre: string; precio: number };
  servicio?: { id: string; nombre: string };
};

type Carrito = {
  id: string;
  estado: string;
  items: CarritoItem[];
};

export default function CarritoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCarrito = async () => {
    setLoading(true);
    const res = await fetch("/api/carrito");
    if (res.ok) {
      setCarrito(await res.json());
    } else {
      setError("No se pudo cargar el carrito");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/carrito");
        if (!res.ok) throw new Error("No se pudo cargar el carrito");
        const data = await res.json();
        if (!cancelled) setCarrito(data);
      } catch (err: unknown) {
        console.error("Carrito load error:", err);
        if (!cancelled) setError("No se pudo cargar el carrito");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemove = async (itemId: string) => {
    const res = await fetch(`/api/carrito/item?itemId=${itemId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchCarrito();
    } else {
      setError("No se pudo eliminar el item");
    }
  };

  const handleVaciar = async () => {
    const res = await fetch("/api/carrito", { method: "DELETE" });
    if (res.ok) {
      await fetchCarrito();
    } else {
      setError("No se pudo vaciar el carrito");
    }
  };

  const handleCheckout = async () => {
    const res = await fetch("/api/pedidos", { method: "POST" });
    if (res.ok) {
      router.push("/pedidos");
    } else {
      const data = await res.json();
      setError(data.error || "No se pudo crear el pedido");
    }
  };

  const total =
    carrito?.items.reduce(
      (sum, item) => sum + item.precioUnitario * item.cantidad,
      0
    ) ?? 0;

  if (loading) return <p className="p-6">Cargando carrito...</p>;

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Mi Carrito</h1>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {carrito && carrito.items.length === 0 ? (
        <p className="text-sm text-gray-500">El carrito está vacío.</p>
      ) : (
        <>
          <ul className="space-y-3 mb-6">
            {carrito?.items.map((item) => (
              <li
                key={item.id}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">
                    {item.tipo === "producto"
                      ? item.producto?.nombre
                      : item.servicio?.nombre}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    x{item.cantidad} · ${item.precioUnitario.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t pt-4 mb-6">
            <p className="font-bold text-lg">
              Total: ${total.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleVaciar}
              className="border rounded px-4 py-2 text-sm hover:bg-gray-50"
            >
              Vaciar carrito
            </button>
            <button
              onClick={handleCheckout}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700"
            >
              Proceder al pago
            </button>
          </div>
        </>
      )}
    </main>
  );
}
