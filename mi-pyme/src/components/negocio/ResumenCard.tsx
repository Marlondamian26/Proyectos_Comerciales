"use client";

import { Card } from "@/components/ui/Card";
import type { DashboardResumenDTO } from "@/shared/negocio.types";

export function ResumenCard({ resumen }: { resumen: DashboardResumenDTO }) {
  const tarjetas = [
    {
      titulo: "Ventas (30 días)",
      valor: `$${Number(resumen.ventasPeriodo ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icono: "💰",
      color: "text-green-600",
    },
    {
      titulo: "Pedidos pendientes",
      valor: String(resumen.pedidosPendientes ?? 0),
      icono: "📦",
      color: "text-blue-600",
    },
    {
      titulo: "Reservas próximas",
      valor: String(resumen.reservasProximas ?? 0),
      icono: "📅",
      color: "text-purple-600",
    },
    {
      titulo: "Stock bajo",
      valor: String(resumen.stockBajo ?? 0),
      icono: "⚠️",
      color: "text-amber-600",
    },
    {
      titulo: "Disponibles hoy",
      valor: String(resumen.disponibleHoyCount ?? 0),
      icono: "✅",
      color: "text-teal-600",
    },
    {
      titulo: "Negocio",
      valor: resumen.negocio?.nombre ?? "—",
      icono: "🏪",
      color: "text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {tarjetas.map((t) => (
        <Card key={t.titulo} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {t.titulo}
              </p>
              <p className="text-2xl font-bold mt-1">{t.valor}</p>
            </div>
            <span className="text-2xl" aria-hidden="true">
              {t.icono}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default ResumenCard;
