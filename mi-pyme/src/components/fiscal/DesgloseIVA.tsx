import { ModoPrecio, RegimenFiscal, TratamientoIVA } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

export interface DesgloseIVAProps {
  baseImponible: number | string;
  montoIVA: number | string;
  total: number | string;
  tasaIVA?: number | string | null;
  regimenFiscal?: RegimenFiscal | null;
  modoPrecio?: ModoPrecio | null;
  itemsExentos?: boolean;
  className?: string;
}

const REGIMENES_SIN_IVA: RegimenFiscal[] = ["SIMPLIFICADO", "EXENTO", "NO_SUJETO"];

function formatearMoneda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined) return "$0.00";
  const num = typeof valor === "number" ? valor : Number(valor);
  if (Number.isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

function formatearTasa(valor: number | string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const num = typeof valor === "number" ? valor : Number(valor);
  if (Number.isNaN(num)) return null;
  return `${num}%`;
}

export function DesgloseIVA({
  baseImponible,
  montoIVA,
  total,
  tasaIVA,
  regimenFiscal,
  modoPrecio,
  itemsExentos,
  className,
}: DesgloseIVAProps) {
  const esSinIVA = regimenFiscal && REGIMENES_SIN_IVA.includes(regimenFiscal);
  const tasa = formatearTasa(tasaIVA);
  const ivaLabel = tasa ? `IVA (${tasa})` : "IVA";

  return (
    <section
      className={cn("rounded-xl border border-border bg-surface p-4 space-y-3", className)}
      aria-label="Desglose fiscal"
    >
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Base imponible</dt>
          <dd className="font-medium" aria-label={`Base imponible: ${formatearMoneda(baseImponible)}`}>
            {formatearMoneda(baseImponible)}
          </dd>
        </div>

        {!esSinIVA && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{ivaLabel}</dt>
            <dd className="font-medium" aria-label={`${ivaLabel}: ${formatearMoneda(montoIVA)}`}>
              {formatearMoneda(montoIVA)}
            </dd>
          </div>
        )}

        {modoPrecio && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <dt>Modo de precio</dt>
            <dd>{modoPrecio === "IVA_INCLUIDO" ? "IVA incluido" : "IVA agregado"}</dd>
          </div>
        )}

        {itemsExentos && (
          <div className="flex justify-between text-xs">
            <dt className="text-warning">Incluye artículos exentos de IVA</dt>
            <dd className="text-warning">+</dd>
          </div>
        )}
      </dl>

      <div className="border-t border-border pt-3 flex justify-between">
        <span className="text-lg font-semibold">Total</span>
        <span
          className="text-2xl font-bold text-primary"
          aria-label={`Total: ${formatearMoneda(total)}`}
        >
          {formatearMoneda(total)}
        </span>
      </div>

      {esSinIVA && (
        <p className="text-xs text-muted-foreground" role="status">
          Este negocio no desglosa IVA.
        </p>
      )}
    </section>
  );
}

export const DesgloseIVATratamientoIVA = TratamientoIVA;
