"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, type Column } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingTable } from "@/components/ui/Loading";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { EstadoPagoBadge } from "@/components/pagos/EstadoPagoBadge";
import { Eye, CreditCard } from "lucide-react";
import type { PagoConRelacionesDTO } from "@/shared/pagos.types";

const METODO_LABELS: Record<string, string> = {
  EFECTIVO_CONTRA_ENTREGA: "Efectivo contra entrega",
  TRANSFERENCIA_BANCARIA: "Transferencia bancaria",
  PAGO_MOVIL: "Pago móvil",
};

const columns: Column<PagoConRelacionesDTO>[] = [
  {
    key: "pedido",
    header: "Pedido",
    accessor: (p) => (
      <span className="font-mono text-xs text-foreground">
        #{p.pedido.id.slice(-8)}
      </span>
    ),
  },
  {
    key: "metodo",
    header: "Método",
    accessor: (p) => METODO_LABELS[p.metodo] ?? p.metodo,
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
      <Link
        href={`/pagos/${p.id}`}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Ver detalle de pago #${p.id.slice(-8)}`}
      >
        <Eye className="h-4 w-4" />
      </Link>
    ),
  },
];

export default function PagosPage() {
  const router = useRouter();
  const [pagos, setPagos] = useState<PagoConRelacionesDTO[]>([]);
  const [pagoFromPedido, setPagoFromPedido] = useState<PagoConRelacionesDTO | null>(null);
  const [pedidoIdParam, setPedidoIdParam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const pedidoId = urlParams.get("pedidoId");

        if (pedidoId && !cancelled) {
          setPedidoIdParam(pedidoId);
          const res = await fetch(`/api/pagos?pedidoId=${pedidoId}`);
          if (!res.ok) {
            if (res.status === 404) {
              if (!cancelled) setPagoFromPedido(null);
            } else {
              throw new Error("No se pudo cargar el pago");
            }
          } else {
            if (!cancelled) setPagoFromPedido(await res.json());
          }
        } else {
          const res = await fetch("/api/pagos");
          if (!res.ok) throw new Error("No se pudieron cargar los pagos");
          const result = await res.json();
          if (!cancelled) setPagos(result.data ?? []);
        }
      } catch {
        if (!cancelled) setError("No se pudieron cargar los pagos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <h1 className="text-3xl font-bold mb-6">Mis pagos</h1>
        <LoadingTable />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <h1 className="text-3xl font-bold mb-6">Mis pagos</h1>
        <p className="text-destructive">{error}</p>
      </main>
    );
  }

  if (pedidoIdParam && pagoFromPedido) {
    router.push(`/pagos/${pagoFromPedido.id}`);
    return null;
  }

  if (pedidoIdParam && !pagoFromPedido) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <h1 className="text-3xl font-bold mb-6">Pago del pedido #{pedidoIdParam.slice(-8)}</h1>
        <EmptyState
          title="Aún no has realizado el pago"
          message="Selecciona un método de pago para este pedido."
          icon={<CreditCard className="h-12 w-12" />}
        />
      </main>
    );
  }

  if (pagos.length === 0) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <h1 className="text-3xl font-bold mb-6">Mis pagos</h1>
        <EmptyState
          title="No tienes pagos registrados"
          message="Cuando realices pedidos, aquí podrás ver el estado de tus pagos."
          icon={<CreditCard className="h-12 w-12" />}
        />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto py-12 px-6">
      <DashboardBackLink />
      <h1 className="text-3xl font-bold mb-6">Mis pagos</h1>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table columns={columns} data={pagos} />
      </div>
    </main>
  );
}
