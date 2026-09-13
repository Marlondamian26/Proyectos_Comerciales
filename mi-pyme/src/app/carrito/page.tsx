"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { LoadingTable } from "@/components/ui/Loading";
import { Plus, Minus, Trash2, CreditCard, ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DashboardBackLink } from "@/components/DashboardBackLink";

type CarritoItem = {
  id: string;
  cantidad: number;
  precioUnitario: number;
  tipo: string;
  producto?: { id: string; nombre: string; precio: number; imagenUrl?: string };
  servicio?: { id: string; nombre: string; imagenUrl?: string };
};

type Carrito = {
  id: string;
  estado: string;
  items: CarritoItem[];
};

const TASA_IMPUESTO = 0.21;
const COSTO_ENVIO = 5.99;

export default function CarritoPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: false });
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      const params = new URLSearchParams({
        callbackUrl: "/carrito",
        intent: JSON.stringify({ action: "pedido" }),
      });
      router.push(`/auth/registro?${params.toString()}`);
    }
  }, [status, router]);

  const isLoading = status === "loading" || status === "unauthenticated";

  const userId = session?.user?.id ?? "";

  const fetchCarrito = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/carrito");
      if (!res.ok) throw new Error("No se pudo cargar el carrito");
      const data = await res.json();
      setCarrito(data);
    } catch {
      setError("No se pudo cargar el carrito");
    } finally {
      setLoading(false);
    }
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
      } catch {
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

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/carrito/item/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad: newQuantity }),
      });
      if (res.ok) {
        await fetchCarrito();
      } else {
        setError("No se pudo actualizar la cantidad");
      }
    } catch {
      setError("No se pudo actualizar la cantidad");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const res = await fetch(`/api/carrito/item/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchCarrito();
      } else {
        setError("No se pudo eliminar el item");
      }
    } catch {
      setError("No se pudo eliminar el item");
    } finally {
      setUpdating(null);
    }
  };

  const handleVaciar = async () => {
    try {
      const res = await fetch("/api/carrito", { method: "DELETE" });
      if (res.ok) {
        await fetchCarrito();
      } else {
        setError("No se pudo vaciar el carrito");
      }
    } catch {
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

  const subtotal =
    carrito?.items.reduce(
      (sum, item) => sum + item.precioUnitario * item.cantidad,
      0
    ) ?? 0;
  const impuestos = subtotal * TASA_IMPUESTO;
  const total = subtotal + impuestos + COSTO_ENVIO;

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto py-12 px-6">
        <div className="flex items-center gap-2 mb-6">
          <DashboardBackLink />
        </div>
        <LoadingTable rows={5} cols={6} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <DashboardBackLink />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold">Mi Carrito</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Revisa tu pedido antes de proceder al pago
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {error && (
          <div
            className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        {carrito && carrito.items.length === 0 ? (
          <div className="max-w-md mx-auto">
            <EmptyStatePreset
              preset="cart"
              action={{
                label: "Ir al catálogo",
                href: "/catalogo",
              }}
            />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b bg-muted/30">
                  <h2 className="font-semibold">
                    Items del carrito ({carrito?.items.length ?? 0})
                  </h2>
                </div>
                <div className="divide-y">
                  {carrito?.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {(item.producto?.imagenUrl || item.servicio?.imagenUrl) && (
                          <Image
                            src={(item.producto?.imagenUrl || item.servicio?.imagenUrl) as string}
                            alt={item.producto?.nombre || item.servicio?.nombre || ""}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {item.tipo === "producto"
                              ? item.producto?.nombre
                              : item.servicio?.nombre}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.precioUnitario.toFixed(2)} c/u
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1 || updating === item.id}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm transition-colors",
                            "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-medium">{item.cantidad}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                          disabled={updating === item.id}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm transition-colors",
                            "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right sm:w-32">
                        <p className="font-semibold">
                          ${(item.precioUnitario * item.cantidad).toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={updating === item.id}
                        className={cn(
                          "text-sm text-destructive hover:text-destructive/80 transition-colors",
                          "disabled:opacity-50 flex items-center gap-1"
                        )}
                        aria-label={`Eliminar ${item.tipo === "producto" ? item.producto?.nombre : item.servicio?.nombre}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border bg-card p-6 sticky top-6">
                <h2 className="text-lg font-semibold mb-6">Resumen del pedido</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuestos (21%)</span>
                    <span className="font-medium">${impuestos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío estimado</span>
                    <span className="font-medium">${COSTO_ENVIO.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleVaciar}
                      disabled={!carrito || carrito.items.length === 0}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Vaciar carrito
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleCheckout}
                      disabled={!carrito || carrito.items.length === 0}
                      className="w-full"
                    >
                      Proceder al pago
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
