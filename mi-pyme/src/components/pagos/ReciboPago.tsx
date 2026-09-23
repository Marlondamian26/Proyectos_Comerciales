"use client";

import { cn } from "@/lib/utils";
import { EstadoPagoBadge } from "./EstadoPagoBadge";
import { Badge } from "@/components/ui/Badge";
import type { PagoConRelacionesDTO } from "@/shared/pagos.types";

export interface ReciboPagoProps {
  pago: PagoConRelacionesDTO;
  className?: string;
}

const metodoLabels: Record<string, string> = {
  EFECTIVO_CONTRA_ENTREGA: "Efectivo contra entrega",
  TRANSFERENCIA_BANCARIA: "Transferencia bancaria",
  PAGO_MOVIL: "Pago móvil",
  TARJETA: "Tarjeta",
};

export function ReciboPago({ pago, className }: ReciboPagoProps) {
  const isCompletado = pago.estado === "COMPLETADO" || pago.estado === "REEMBOLSADO";
  const metodoLabel = metodoLabels[pago.metodo] ?? pago.metodo;

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-surface p-6 space-y-6",
        className
      )}
      aria-label="Recibo de pago"
    >
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recibo de Pago</h2>
          <p className="text-sm text-muted-foreground">
            Pedido #{pago.pedido.id.slice(-8)}
          </p>
        </div>
        <EstadoPagoBadge estado={pago.estado} />
      </header>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Método de pago</span>
          <p className="font-semibold text-foreground">{metodoLabel}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Monto</span>
          <p className="font-semibold text-foreground">
            {pago.monto.toFixed(2)} {pago.moneda}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Estado</span>
          <p className="font-semibold text-foreground">
            <EstadoPagoBadge estado={pago.estado} />
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Fecha de creación</span>
          <p className="font-semibold text-foreground">
            {new Date(pago.createdAt).toLocaleDateString("es-ES")}
          </p>
        </div>
      </div>

      {pago.referencia && (
        <div>
          <span className="text-sm text-muted-foreground">Referencia</span>
          <p className="font-mono text-sm text-foreground">{pago.referencia}</p>
        </div>
      )}

      {pago.idTransferencia && (
        <div>
          <span className="text-sm text-muted-foreground">ID Transferencia</span>
          <p className="font-mono text-sm text-foreground">{pago.idTransferencia}</p>
          {pago.entidadPago && (
            <p className="text-xs text-muted-foreground">Entidad: {pago.entidadPago}</p>
          )}
        </div>
      )}

      {pago.idTransferenciaReembolso && (
        <div>
          <span className="text-sm text-muted-foreground">ID Reembolso</span>
          <p className="font-mono text-sm text-foreground">{pago.idTransferenciaReembolso}</p>
          {pago.fechaReembolso && (
            <p className="text-xs text-muted-foreground">
              Fecha: {new Date(pago.fechaReembolso).toLocaleDateString("es-ES")}
            </p>
          )}
        </div>
      )}

      {pago.comprobanteUrl && (
        <div>
          <span className="text-sm text-muted-foreground">Comprobante</span>
          <div className="mt-2">
            {pago.comprobanteUrl.match(/\.(png|jpg|jpeg)$/i) ? (
              <img
                src={pago.comprobanteUrl}
                alt="Comprobante de pago"
                className="max-w-xs rounded-md border border-border"
              />
            ) : (
              <a
                href={pago.comprobanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                    Ver comprobante (PDF)
              </a>
            )}
          </div>
        </div>
      )}

      {pago.notasCliente && (
        <div>
          <span className="text-sm text-muted-foreground">Notas del cliente</span>
          <p className="text-sm text-foreground">{pago.notasCliente}</p>
        </div>
      )}

      {pago.notasNegocio && (
        <div>
          <span className="text-sm text-muted-foreground">Observaciones del negocio</span>
          <p className="text-sm text-foreground">{pago.notasNegocio}</p>
        </div>
      )}

      {pago.confirmadoEn && (
        <div className="border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">
            Confirmado el {new Date(pago.confirmadoEn).toLocaleString("es-ES")}
          </span>
        </div>
      )}
    </section>
  );
}

export function PagoBadgeByEstado({ estado, className }: { estado: string; className?: string }) {
  const variantMap: Record<string, "warning" | "info" | "success" | "error" | "default" | "secondary" | "outline"> = {
    PENDIENTE: "warning",
    EN_PROCESO: "info",
    COMPLETADO: "success",
    REEMBOLSADO: "secondary",
    FALLIDO: "error",
    CANCELADO: "default",
  };
  const labelMap: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PROCESO: "En proceso",
    COMPLETADO: "Completado",
    REEMBOLSADO: "Reembolsado",
    FALLIDO: "Fallido",
    CANCELADO: "Cancelado",
  };
  return (
    <Badge variant={variantMap[estado] ?? "default"} className={className}>
      {labelMap[estado] ?? estado}
    </Badge>
  );
}
