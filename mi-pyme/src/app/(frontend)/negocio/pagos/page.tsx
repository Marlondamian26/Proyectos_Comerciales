"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { EstadoPagoBadge } from "@/components/pagos/EstadoPagoBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingTable } from "@/components/ui/Loading";
import { Table, type Column } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { CreditCard, RefreshCw, XCircle, Loader2 } from "lucide-react";
import type { PagoConRelacionesDTO } from "@/shared/pagos.types";

const METODO_LABELS: Record<string, string> = {
  EFECTIVO_CONTRA_ENTREGA: "Efectivo contra entrega",
  TRANSFERENCIA_BANCARIA: "Transferencia bancaria",
  PAGO_MOVIL: "Pago móvil",
};

const columns: Column<PagoConRelacionesDTO>[] = [
  {
    key: "cliente",
    header: "Cliente",
    accessor: (p) => p.pedido.usuario.nombre ?? p.pedido.usuario.email,
  },
  {
    key: "metodo",
    header: "Método",
    accessor: (p) => METODO_LABELS[p.metodo] ?? p.metodo,
  },
  {
    key: "idTransferencia",
    header: "ID Transferencia",
    accessor: (p) => p.idTransferencia ?? "—",
  },
  {
    key: "entidadPago",
    header: "Entidad",
    accessor: (p) => p.entidadPago ?? "—",
  },
  {
    key: "monto",
    header: "Monto",
    accessor: (p) => `${p.monto.toFixed(2)} ${p.moneda}`,
  },
  {
    key: "estado",
    header: "Estado",
    accessor: (p) => <EstadoPagoBadge estado={p.estado} />,
  },
  {
    key: "fecha",
    header: "Fecha",
    accessor: (p) => new Date(p.createdAt).toLocaleDateString("es-ES"),
  },
  {
    key: "acciones",
    header: "",
    align: "right",
    accessor: (p) => (
      <AccionesColumn pago={p} onAction={() => {}} />
    ),
  },
];

function AccionesColumn({ pago, onAction }: { pago: PagoConRelacionesDTO; onAction: (id: string) => void }) {
  const [accionLoading, setAccionLoading] = useState<string | null>(null);

  const handleAccion = async (accion: string, payload?: Record<string, unknown>) => {
    setAccionLoading(pago.id);
    try {
      const res = await fetch(`/api/pagos/${pago.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, ...payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Error");
      } else {
        onAction(pago.id);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setAccionLoading(null);
    }
  };

  const acciones = [];
  if (pago.estado === "PENDIENTE" || pago.estado === "EN_PROCESO") {
    acciones.push(
      <Button
        key="confirmar"
        size="sm"
        onClick={() => handleAccion("confirmar")}
        loading={accionLoading === pago.id}
      >
        <Loader2 className="h-3 w-3 mr-1" /> Confirmar
      </Button>
    );
    acciones.push(
      <Button
        key="rechazar"
        size="sm"
        variant="destructive"
        onClick={() => {
          const motivo = prompt("Motivo del rechazo:");
          if (motivo && motivo.trim().length >= 3) handleAccion("rechazar", { motivo });
        }}
        loading={accionLoading === pago.id}
      >
        <XCircle className="h-3 w-3 mr-1" /> Rechazar
      </Button>
    );
  }
  if (pago.estado === "COMPLETADO") {
    acciones.push(
      <Button
        key="reembolsar"
        size="sm"
        variant="destructive"
        onClick={() => {
          const motivo = prompt("Motivo del reembolso:");
          if (motivo && motivo.trim().length >= 3) {
            const idReembolso = prompt("ID de transferencia de reembolso (opcional):");
            handleAccion("reembolsar", {
              motivo,
              datosReembolso: idReembolso
                ? { idTransferenciaReembolso: idReembolso.trim(), fechaReembolso: new Date() }
                : undefined,
            });
          }
        }}
        loading={accionLoading === pago.id}
      >
        <RefreshCw className="h-3 w-3 mr-1" /> Reembolsar
      </Button>
    );
  }
  return <div className="flex gap-1 justify-end">{acciones}</div>;
}

export default function NegocioPagosPage() {
  const [pagos, setPagos] = useState<PagoConRelacionesDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>("TODOS");
  const { addToast } = useToast();

  const ESTADO_FILTERS = ["TODOS", "PENDIENTE", "EN_PROCESO", "COMPLETADO", "FALLIDO", "CANCELADO", "REEMBOLSADO"];

  async function loadPagos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estadoFilter !== "TODOS") {
        params.set("estado", estadoFilter);
      }
      const res = await fetch(`/api/negocio/pagos?${params.toString()}`);
      if (!res.ok) throw new Error("No se pudieron cargar los pagos");
      const result = await res.json();
      setPagos(result.data ?? []);
    } catch {
      setError("No se pudieron cargar los pagos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPagos();
  }, [estadoFilter]);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <h1 className="text-3xl font-bold mb-6">Pagos de mi negocio</h1>
        <LoadingTable />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <h1 className="text-3xl font-bold mb-6">Pagos de mi negocio</h1>
        <p className="text-destructive">{error}</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto py-12 px-6">
      <DashboardBackLink />
      <h1 className="text-3xl font-bold mb-6">Pagos de mi negocio</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {ESTADO_FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={estadoFilter === f ? "primary" : "outline"}
            onClick={() => setEstadoFilter(f)}
          >
            {f === "TODOS" ? "Todos" : f}
          </Button>
        ))}
      </div>

      {pagos.length === 0 ? (
        <EmptyState
          title="No hay pagos para este filtro"
          message="Cambia los filtros o vuelve cuando tengas pedidos."
          icon={<CreditCard className="h-12 w-12" />}
        />
      ) : (
        <Card className="overflow-x-auto">
          <Table columns={columns} data={pagos} />
        </Card>
      )}
    </main>
  );
}
