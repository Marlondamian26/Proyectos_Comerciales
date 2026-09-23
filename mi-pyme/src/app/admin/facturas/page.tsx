"use client";

import { useState, useEffect } from "react";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { Button } from "@/components/ui/Button";
import { Table, type Column } from "@/components/ui/Table";
import { LoadingTable } from "@/components/ui/Loading";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { RegimenFiscalBadge } from "@/components/fiscal/RegimenFiscalBadge";
import { FileText, Filter, Download } from "lucide-react";
import Link from "next/link";

interface FacturaAdmin {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  total: number;
  baseImponible: number | null;
  montoIVA: number | null;
  negocio?: { id: string; nombre: string } | null;
  pedido?: { id: string; estado: string } | null;
  usuario: { id: string; email: string; nombre: string | null };
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  emitida: "Emitida",
  pagada: "Pagada",
  anulada: "Anulada",
};

export default function AdminFacturasPage() {
  const [facturas, setFacturas] = useState<FacturaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroRegimen, setFiltroRegimen] = useState<string>("");
  const [filtroNegocio, setFiltroNegocio] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "50");
        if (filtroNegocio) params.set("negocioId", filtroNegocio);
        const res = await fetch(`/api/facturas?${params.toString()}`);
        if (!res.ok) throw new Error("Error al cargar facturas");
        const result = await res.json();
        if (!cancelled) setFacturas(result.data ?? []);
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
  }, [filtroNegocio]);

  const descargarHTML = async (facturaId: string, numero: string) => {
    const res = await fetch(`/api/facturas/${facturaId}?html=true`);
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${numero}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingTable rows={8} cols={6} />;

  const columns: Column<FacturaAdmin>[] = [
    {
      key: "numero",
      header: "Factura",
      accessor: (f) => (
        <Link href={`/facturas/${f.id}`} className="font-mono text-sm text-primary hover:underline">
          {f.numero}
        </Link>
      ),
    },
    {
      key: "negocio",
      header: "Negocio",
      accessor: (f) => f.negocio?.nombre ?? "—",
    },
    {
      key: "cliente",
      header: "Cliente",
      accessor: (f) => (
        <span className="text-sm">
          {f.usuario.nombre ?? f.usuario.email}
        </span>
      ),
    },
    {
      key: "fecha",
      header: "Fecha",
      accessor: (f) => new Date(f.fecha).toLocaleDateString("es-ES"),
    },
    {
      key: "base",
      header: "Base imponible",
      accessor: (f) => `$${Number(f.baseImponible ?? 0).toFixed(2)}`,
    },
    {
      key: "iva",
      header: "IVA",
      accessor: (f) => `$${Number(f.montoIVA ?? 0).toFixed(2)}`,
    },
    {
      key: "total",
      header: "Total",
      accessor: (f) => (
        <span className="font-semibold">${Number(f.total).toFixed(2)}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (f) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/30">
          {ESTADO_LABELS[f.estado] ?? f.estado}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "",
      accessor: (f) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => descargarHTML(f.id, f.numero)}
          aria-label={`Descargar factura ${f.numero}`}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-4">
          <DashboardBackLink />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
            <p className="text-muted-foreground mt-1">
              Todas las facturas emitidas en la plataforma
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrar por negocio..."
              value={filtroNegocio}
              onChange={(e) => setFiltroNegocio(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-md border border-border"
              aria-label="Filtrar por negocio"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive mb-4" role="alert">
            {error}
          </p>
        )}

        {facturas.length === 0 ? (
          <EmptyStatePreset preset="orders" />
        ) : (
          <Table
            data={facturas}
            columns={columns}
            emptyMessage="No hay facturas"
          />
        )}
      </div>
    </main>
  );
}
