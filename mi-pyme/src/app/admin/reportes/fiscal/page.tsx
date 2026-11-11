"use client";

import { useState, useEffect } from "react";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { Card } from "@/components/ui/Card";
import { LoadingTable } from "@/components/ui/Loading";
import { FileBarChart, Calendar, DollarSign, Receipt } from "lucide-react";

interface KPIFiscal {
  totalFacturado: number;
  totalIVACobrado: number;
  totalIVAPagado: number;
  totalBaseImponible: number;
  facturasEmitidas: number;
  numeroFacturas: number;
  negociosActivos: number;
}

interface NegocioConFiscal {
  id: string;
  nombre: string;
  nit: string | null;
  regimenFiscal: string;
  totalFacturado: number;
}

export default function AdminReportesFiscalPage() {
  const [kpi, setKpi] = useState<KPIFiscal | null>(null);
  const [negocios, setNegocios] = useState<NegocioConFiscal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/reportes/fiscal");
        if (!res.ok) throw new Error("Error al cargar reporte");
        const data = await res.json();
        setKpi(data.kpi);
        setNegocios(data.negocios ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingTable rows={6} cols={4} />;

  if (!kpi) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-destructive">No se pudo cargar el reporte fiscal</p>
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    `CUP $${Number(n).toFixed(2)}`;

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-4">
          <DashboardBackLink />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileBarChart className="h-7 w-7 text-primary" />
              Reporte Fiscal
            </h1>
            <p className="text-muted-foreground mt-1">
              Resumen de IVA y facturación de la plataforma
            </p>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Actualizado: {new Date().toLocaleDateString("es-ES")}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="p-4">
            <dt className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              Facturas emitidas
            </dt>
            <dd className="text-2xl font-bold mt-1">{kpi.facturasEmitidas}</dd>
          </Card>
          <Card className="p-4">
            <dt className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total facturado
            </dt>
            <dd className="text-2xl font-bold mt-1">{formatCurrency(kpi.totalFacturado)}</dd>
          </Card>
          <Card className="p-4">
            <dt className="text-xs font-semibold text-muted-foreground uppercase">
              Base imponible
            </dt>
            <dd className="text-2xl font-bold mt-1">{formatCurrency(kpi.totalBaseImponible)}</dd>
          </Card>
          <Card className="p-4">
            <dt className="text-xs font-semibold text-muted-foreground uppercase">
              IVA (10%)
            </dt>
            <dd className="text-2xl font-bold text-primary mt-1">
              +{formatCurrency(kpi.totalIVACobrado)}
            </dd>
          </Card>
        </section>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Desglose por negocio</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Negocio</th>
                  <th className="text-center py-2 font-medium">Régimen</th>
                  <th className="text-right py-2 font-medium">NIT</th>
                  <th className="text-right py-2 font-medium">Facturado</th>
                </tr>
              </thead>
              <tbody>
                {negocios.map((n) => (
                  <tr key={n.id} className="border-b">
                    <td className="py-2">{n.nombre}</td>
                    <td className="py-2 text-center text-xs">
                      {n.regimenFiscal}
                    </td>
                    <td className="py-2 text-right font-mono text-xs">
                      {n.nit ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(n.totalFacturado)}
                    </td>
                  </tr>
                )) ?? []}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Resumen ONAT</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Base imponible total
              </span>
              <span className="font-medium">
                {formatCurrency(kpi.totalBaseImponible)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                IVA a la alícuota del 10%
              </span>
              <span className="font-medium text-primary">
                {formatCurrency(kpi.totalIVACobrado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                IVA retenido (si aplica)
              </span>
              <span className="font-medium">
                {formatCurrency(kpi.totalIVAPagado)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3 mt-3 font-semibold text-lg">
              <span>Total facturado</span>
              <span>{formatCurrency(kpi.totalFacturado)}</span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
