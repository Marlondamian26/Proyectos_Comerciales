"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { EstadoPagoBadge } from "@/components/pagos/EstadoPagoBadge";
import { CheckCircle, Package, QrCode } from "lucide-react";

type PedidoCreado = {
  id: string;
  negocioId: string;
  total: number;
  estado: string;
  estadoPago: string;
  codigoEntrega?: string | null;
};

type ConfirmacionData = {
  pedidosCreados: PedidoCreado[];
  totalGeneral: number;
};

export default function CheckoutConfirmacionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoParam = searchParams.get("pedidos");

  const [data, setData] = useState<ConfirmacionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (pedidoParam && !data && !error) {
    try {
      const parsed = JSON.parse(pedidoParam) as ConfirmacionData;
      setData(parsed);
    } catch {
      setError("Error al leer los datos de confirmación.");
    }
  } else if (!pedidoParam && !error) {
    setError("No se encontraron datos de confirmación.");
  }

  const handleVerPedidos = () => {
    router.push("/pedidos");
  };

  if (error) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            {error}
          </h2>
          <Button onClick={handleVerPedidos}>Ver mis pedidos</Button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <DashboardBackLink />

      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-success" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-success">
          ¡Pedido confirmado!
        </h1>
        <p className="text-muted-foreground">
          Se crearon {data.pedidosCreados.length} pedido(s) correctamente.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {data.pedidosCreados.map((pedido) => (
          <div
            key={pedido.id}
            className="border border-border rounded-xl p-5 bg-surface flex items-start gap-4"
          >
            <Package className="h-6 w-6 text-primary mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                Pedido #{pedido.id.slice(0, 8)}
              </p>
              <p className="text-sm text-muted-foreground">
                Negocio ID: {pedido.negocioId}
              </p>
              <p className="text-sm text-muted-foreground">
                Estado: <span className="font-medium">{pedido.estado}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Pago: <EstadoPagoBadge estado={(pedido.estadoPago as "PENDIENTE" | "EN_PROCESO" | "COMPLETADO" | "FALLIDO" | "REEMBOLSADO" | "CANCELADO") ?? "PENDIENTE"} size="sm" />
              </p>
              {pedido.codigoEntrega && (
                <div className="mt-3 p-4 bg-info/5 border border-info/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="h-5 w-5 text-info" />
                    <span className="font-semibold text-foreground">Código de confirmación</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Entrega este código de 6 dígitos al mensajero para confirmar tu pago:
                  </p>
                  <div className="flex justify-center my-3">
                    <div className="bg-background border-2 border-dashed border-info/30 rounded-lg px-4 py-3 font-mono text-4xl font-bold tracking-[0.25em] text-info">
                      {pedido.codigoEntrega}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pedido.codigoEntrega!);
                    }}
                    className="text-xs text-info hover:text-info/80 underline"
                  >
                    Copiar código
                  </button>
                </div>
              )}
              <p className="text-lg font-bold text-foreground mt-1">
                ${pedido.total.toFixed(2)}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/pagos?pedidoId=${pedido.id}`)}
                >
                  Ver mi pago
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 mb-8">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total general</span>
          <span className="text-primary">${data.totalGeneral.toFixed(2)}</span>
        </div>
      </div>

      {data.pedidosCreados.length === 0 && (
        <div className="text-center py-8">
          <EmptyStatePreset preset="orders" action={{ label: "Volver al catálogo", href: "/catalogo" }} />
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button onClick={handleVerPedidos}>Ver mis pedidos</Button>
        <Button variant="outline" onClick={() => router.push("/carrito")}>
          Volver al carrito
        </Button>
      </div>
    </main>
  );
}
