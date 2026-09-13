"use client";

import { useState, useEffect } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { LoadingTable } from "@/components/ui/Loading";
import { Package, Eye, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DashboardBackLink } from "@/components/DashboardBackLink";

type PedidoItem = {
  id: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  negocioId: string;
  tipo?: string;
  producto?: { id: string; nombre: string; imagenUrl?: string };
  servicio?: { id: string; nombre: string; imagenUrl?: string };
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
  factura?: { id: string; numero: string } | null;
};

const ESTADO_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  pendiente: { label: "Pendiente", variant: "warning" },
  procesando: { label: "Procesando", variant: "info" },
  enviado: { label: "Enviado", variant: "info" },
  completado: { label: "Completado", variant: "success" },
  cancelado: { label: "Cancelado", variant: "error" },
};

const TIPO_LABELS: Record<string, string> = {
  producto: "Productos",
  servicio: "Servicios",
  mixto: "Mixto",
};

export default function PedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [emitiendoFactura, setEmitiendoFactura] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/pedidos");
        if (!res.ok) throw new Error("error");
        const result = await res.json();
        if (!cancelled) setPedidos(result.data);
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

  const handleVerDetalle = (pedido: Pedido) => {
    setSelectedPedido(pedido);
  };

  const handleEmitirFactura = async (pedidoId: string) => {
    setEmitiendoFactura(pedidoId);
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
    setEmitiendoFactura(null);
  };

  const handleCerrarModal = () => setSelectedPedido(null);

  if (loading) return <LoadingTable rows={5} cols={6} />;

  const columns: Column<Pedido>[] = [
    {
      key: "pedido",
      header: "Pedido",
      accessor: (pedido) => (
        <div>
          <p className="font-mono text-sm">#{pedido.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(pedido.fechaCreacion).toLocaleDateString("es-ES")}
          </p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      accessor: (pedido) => (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          <Package className="h-3 w-3" />
          {TIPO_LABELS[pedido.tipo] ?? pedido.tipo}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (pedido) => {
        const estado = ESTADO_LABELS[pedido.estado] ?? { label: pedido.estado, variant: "default" };
        const variantColors = {
          default: "bg-neutral-100 text-neutral-800",
          success: "bg-success/10 text-success border-success/20",
          warning: "bg-warning/10 text-warning border-warning/20",
          error: "bg-destructive/10 text-destructive border-destructive/20",
          info: "bg-primary/10 text-primary border-primary/20",
        };
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variantColors[estado.variant]}`}>
            {estado.label}
          </span>
        );
      },
    },
    {
      key: "logistica",
      header: "Logística",
      accessor: (pedido) => (
        <span className={pedido.logistica ? "text-sm" : "text-xs text-muted-foreground"}>
          {pedido.logistica?.nombre ?? "Sin asignar"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      accessor: (pedido) => (
        <span className="font-semibold">${pedido.total.toFixed(2)}</span>
      ),
    },
    {
      key: "acciones",
      header: "",
      accessor: (pedido) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerDetalle(pedido)}
            aria-label={`Ver detalle del pedido ${pedido.id.slice(0, 8)}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {!pedido.factura && pedido.estado === "completado" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEmitirFactura(pedido.id)}
              disabled={emitiendoFactura === pedido.id}
              aria-label={`Emitir factura para pedido ${pedido.id.slice(0, 8)}`}
            >
              {emitiendoFactura === pedido.id ? "Emitiendo..." : "Factura"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingTable rows={5} cols={7} />;

  return (
    <main className="max-w-6xl mx-auto py-12 px-6">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <DashboardBackLink />
        </div>
        <h1 className="text-3xl font-bold mb-2">Mis Pedidos</h1>
        <p className="text-muted-foreground">Historial y seguimiento de tus pedidos</p>
      </header>

      {error && (
        <div
          className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <section aria-labelledby="pedidos-title">
        <h2 id="pedidos-title" className="text-xl font-semibold mb-4">
          Pedidos ({pedidos.length})
        </h2>
        {pedidos.length === 0 ? (
          <EmptyStatePreset
            preset="orders"
            action={{
              label: "Explorar catálogo",
              href: "/catalogo",
            }}
          />
        ) : (
          <Table
            data={pedidos}
            columns={columns}
            emptyMessage="No tienes pedidos"
            isLoading={false}
          />
        )}
      </section>

      <Modal
        isOpen={!!selectedPedido}
        onClose={handleCerrarModal}
        title={`Pedido #${selectedPedido?.id.slice(0, 8)}`}
        description={`Estado: ${ESTADO_LABELS[selectedPedido?.estado ?? ""]?.label ?? selectedPedido?.estado}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCerrarModal}>
              Cerrar
            </Button>
          </div>
        }
      >
        {selectedPedido && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Fecha</h4>
                <p>{new Date(selectedPedido.fechaCreacion).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Tipo</h4>
                <p>{TIPO_LABELS[selectedPedido.tipo] ?? selectedPedido.tipo}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Estado</h4>
                <p>{ESTADO_LABELS[selectedPedido.estado]?.label ?? selectedPedido.estado}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Dirección de entrega</h4>
                <p>{selectedPedido.direccionEntrega || "No especificada"}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Items del pedido</h4>
              <div className="space-y-2">
                {selectedPedido.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {(item.producto?.imagenUrl || item.servicio?.imagenUrl) && (
                        <Image
                          src={(item.producto?.imagenUrl || item.servicio?.imagenUrl) as string}
                          alt={item.producto?.nombre || item.servicio?.nombre || ""}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">
                          {item.tipo === "producto"
                            ? item.producto?.nombre
                            : item.servicio?.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          x{item.cantidad} · ${item.precioUnitario.toFixed(2)} c/u
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedPedido.logistica && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Información de logística</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Proveedor</p>
                    <p className="font-medium">{selectedPedido.logistica.proveedor.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opción</p>
                    <p className="font-medium">{selectedPedido.logistica.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tarifa</p>
                    <p className="font-medium">${selectedPedido.logistica.precio.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedPedido.factura && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Factura emitida
                </h4>
                <p className="text-sm text-muted-foreground">
                  Número: {selectedPedido.factura.numero}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}