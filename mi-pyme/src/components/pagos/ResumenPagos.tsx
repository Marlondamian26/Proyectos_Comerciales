"use client";

import { Card } from "@/components/ui/Card";
import type { ResumenPagosDTO } from "@/shared/pagos.types";

const MONEDA = "CUP";

interface ResumenPagosProps {
  resumen: ResumenPagosDTO | null;
  className?: string;
}

export function ResumenPagos({ resumen, className }: ResumenPagosProps) {
  if (!resumen) return null;

  return (
    <div className={className}>
      <div className="grid gap-4 sm:grid-cols-5 mb-8">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Total cobrado
          </p>
          <p className="text-2xl font-bold">
            {resumen.totalCobrado.toFixed(2)} {MONEDA}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Pendientes
          </p>
          <p className="text-2xl font-bold">
            {resumen.totalPendiente.toFixed(2)} {MONEDA}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Reembolsados
          </p>
          <p className="text-2xl font-bold">
            {resumen.totalReembolsado.toFixed(2)} {MONEDA}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Fallidos
          </p>
          <p className="text-2xl font-bold">
            {resumen.totalFallido.toFixed(2)} {MONEDA}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Cantidad total
          </p>
          <p className="text-2xl font-bold">{resumen.cantidadTotal}</p>
        </Card>
      </div>

      {resumen.porEstado && Object.keys(resumen.porEstado).length > 0 && (
        <Card className="p-4 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
            Por estado
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            {Object.entries(resumen.porEstado).map(([estado, count]) => (
              <span key={estado} className="flex items-center gap-1">
                <span className="font-semibold">{estado}:</span>
                <span>{count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

ResumenPagos.displayName = "ResumenPagos";
