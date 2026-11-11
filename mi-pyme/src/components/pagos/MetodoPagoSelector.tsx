"use client";

import { cn } from "@/lib/utils";
import { METODOS_PAGO_DISPONIBLES, METODOS_PAGO_PROXIMAMENTE } from "@/core/constants";
import type { MetodoPago } from "@/generated/prisma/client";

export interface MetodoPagoOption {
  value: MetodoPago;
  label: string;
  descripcion: string;
  icono: React.ReactNode;
  reservado?: boolean;
}

export interface MetodoPagoSelectorProps {
  value?: string;
  onChange: (metodo: string) => void;
  error?: string;
  className?: string;
}

const metodoOptions: MetodoPagoOption[] = [
  {
    value: "EFECTIVO_CONTRA_ENTREGA",
    label: "Efectivo contra entrega",
    descripcion: "Pagas al recibir tu pedido en efectivo",
    icono: "💵",
  },
  {
    value: "TRANSFERENCIA_BANCARIA",
    label: "Transferencia bancaria",
    descripcion: "Realiza la transferencia y sube el comprobante",
    icono: "🏦",
  },
  {
    value: "PAGO_MOVIL",
    label: "Pago móvil",
    descripcion: "Paga con tu app de pago móvil e incluye la referencia",
    icono: "📱",
  },
];

export function MetodoPagoSelector({
  value,
  onChange,
  error,
  className,
}: MetodoPagoSelectorProps) {
  return (
    <fieldset className={cn("space-y-3", className)} aria-label="Selección de método de pago">
      <legend className="text-sm font-semibold text-foreground">
        ¿Cómo quieres pagar?
      </legend>

      <div className="space-y-2">
        {metodoOptions.map((opcion) => (
          <label
            key={opcion.value}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer transition-all",
              "hover:border-primary hover:bg-muted/50",
              value === opcion.value && "border-primary bg-primary/5"
            )}
          >
            <input
              type="radio"
              name="metodoPago"
              value={opcion.value}
              checked={value === opcion.value}
              onChange={() => onChange(opcion.value)}
              className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
              aria-describedby={`metodo-desc-${opcion.value}`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  {opcion.icono}
                </span>
                <span className="font-semibold text-foreground">{opcion.label}</span>
              </div>
              <p
                id={`metodo-desc-${opcion.value}`}
                className="text-xs text-muted-foreground mt-1"
              >
                {opcion.descripcion}
              </p>
            </div>
          </label>
        ))}
      </div>

      {METODOS_PAGO_PROXIMAMENTE.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Próximamente: {METODOS_PAGO_PROXIMAMENTE.join(", ")}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

MetodoPagoSelector.displayName = "MetodoPagoSelector";
