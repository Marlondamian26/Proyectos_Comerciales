"use client";

import { useEffect, useState } from "react";

type FacturaItem = {
  id: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  producto?: { nombre: string };
  servicio?: { nombre: string };
};

type Factura = {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  subtotal: number;
  impuestos: number;
  total: number;
  pedido: { id: string };
  negocio?: { nombre: string } | null;
  items: FacturaItem[];
};

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/facturas");
        if (!res.ok) throw new Error("error");
        const data = await res.json();
        if (!cancelled) setFacturas(data);
      } catch {
        if (!cancelled) setError("No se pudieron cargar las facturas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="p-6">Cargando facturas...</p>;

  const descargarFactura = (factura: Factura) => {
    const html = generarHTMLFactura(factura);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${factura.numero}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Mis Facturas</h1>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {facturas.length === 0 ? (
        <p className="text-sm text-gray-500">No tienes facturas.</p>
      ) : (
        <ul className="space-y-4">
          {facturas.map((factura) => (
            <li key={factura.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold">{factura.numero}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(factura.fecha).toLocaleDateString()}
                  </span>
                </div>
                <span className="font-bold">${factura.total.toFixed(2)}</span>
              </div>

              <ul className="text-sm text-gray-600 mb-2 space-y-1">
                {factura.items.map((item) => (
                  <li key={item.id}>
                    {item.producto?.nombre ?? item.servicio?.nombre} x
                    {item.cantidad}
                  </li>
                ))}
              </ul>

              <div className="text-xs text-gray-500 mb-2">
                <p>Subtotal: ${factura.subtotal.toFixed(2)}</p>
                <p>IVA (21%): ${factura.impuestos.toFixed(2)}</p>
              </div>

              <button
                onClick={() => descargarFactura(factura)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Descargar factura
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function generarHTMLFactura(factura: Factura): string {
  return `
    <html><head><title>Factura ${factura.numero}</title></head>
    <body style="font-family: Arial, sans-serif; padding: 40px;">
      <h1>Factura ${factura.numero}</h1>
      <p>Fecha: ${new Date(factura.fecha).toLocaleDateString()}</p>
      <p>Estado: ${factura.estado}</p>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${factura.items
            .map(
              (item) => `
            <tr style="border:1px solid #ddd; padding: 5px;">
              <td>${item.producto?.nombre ?? item.servicio?.nombre}</td>
              <td>${item.cantidad}</td>
              <td>$${item.precioUnitario.toFixed(2)}</td>
              <td>$${item.subtotal.toFixed(2)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <p>Subtotal: $${factura.subtotal.toFixed(2)}</p>
      <p>IVA: $${factura.impuestos.toFixed(2)}</p>
      <h2>Total: $${factura.total.toFixed(2)}</h2>
    </body></html>
  `;
}
