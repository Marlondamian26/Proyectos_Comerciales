"use client";

import type { TotalesCheckoutDTO } from "@/shared/checkout.types";
import type { ModoPrecio, RegimenFiscal } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type DecimalValue = number | string;

interface TotalesFiscalDTO {
  baseImponible?: DecimalValue | null;
  montoIVA?: DecimalValue | null;
  totalConIVA?: DecimalValue | null;
  regimenFiscal?: RegimenFiscal | null;
  tasaIVA?: DecimalValue | null;
  modoPrecio?: ModoPrecio | null;
}

export interface ResumenTotalesProps {
  totales: TotalesCheckoutDTO & TotalesFiscalDTO;
  className?: string;
}

const REGIMENES_SIN_IVA: RegimenFiscal[] = ["SIMPLIFICADO", "EXENTO", "NO_SUJETO"];

function numeroFinito(valor: DecimalValue | null | undefined): number | undefined {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : undefined;
  }
  if (typeof valor === "string" && valor.trim() !== "") {
    const parsed = Number(valor);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function formatearMoneda(valor: DecimalValue | null | undefined, fallback = 0): string {
  return `$${(numeroFinito(valor) ?? fallback).toFixed(2)}`;
}

function formatearTasa(valor: DecimalValue | null | undefined): string | undefined {
  const tasa = numeroFinito(valor);
  if (tasa === undefined) return undefined;
  const valorFormateado = Number.isInteger(tasa)
    ? String(tasa)
    : String(Number(tasa.toFixed(2))).replace(/\.0+$/, "");
  return `${valorFormateado}%`;
}

function esRegimenSinIVA(regimen: RegimenFiscal | null | undefined): boolean {
  return regimen !== undefined && regimen !== null && REGIMENES_SIN_IVA.includes(regimen);
}

function obtenerTasa(totales: TotalesCheckoutDTO & TotalesFiscalDTO): string | undefined {
  const tasaExplicita = formatearTasa(totales.tasaIVA);
  if (tasaExplicita !== undefined) return tasaExplicita;

  const base = numeroFinito(totales.baseImponible) ?? numeroFinito(totales.subtotal);
  const iva = numeroFinito(totales.montoIVA) ?? numeroFinito(totales.iva);
  if (base === undefined || iva === undefined || base <= 0) return undefined;
  return formatearTasa((iva / base) * 100);
}

export function ResumenTotales({ totales, className }: ResumenTotalesProps) {
  const baseImponible =
    numeroFinito(totales.baseImponible) ?? numeroFinito(totales.subtotal) ?? 0;
  const iva = numeroFinito(totales.montoIVA) ?? numeroFinito(totales.iva) ?? 0;
  const envio = numeroFinito(totales.envio) ?? 0;
  const total =
    numeroFinito(totales.total) ??
    ((numeroFinito(totales.totalConIVA) ?? baseImponible + iva) + envio);
  const regimenSinIVA = esRegimenSinIVA(totales.regimenFiscal);
  const tasaIVA = obtenerTasa(totales);
  const ivaLabel = tasaIVA === undefined ? "IVA" : `IVA (${tasaIVA})`;

  const lineItems = [
    { id: "base", label: "Base imponible", value: baseImponible },
    ...(!regimenSinIVA
      ? [{ id: "iva", label: ivaLabel, value: iva }]
      : []),
    { id: "envio", label: "Envío", value: envio },
  ];

  return (
    <section
      className={cn("rounded-xl border border-border bg-surface p-5 space-y-3", className)}
      aria-live="polite"
      aria-label="Resumen de totales"
    >
      <dl className="space-y-3">
        {lineItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="text-foreground font-medium" aria-label={`${item.label}: ${formatearMoneda(item.value)} CUP`}>
              {formatearMoneda(item.value)}
            </dd>
          </div>
        ))}
      </dl>
      {regimenSinIVA && (
        <p className="text-xs text-muted-foreground" role="status">
          Este resumen no desglosa IVA.
        </p>
      )}
      <div className="border-t border-border pt-3 flex justify-between">
        <span className="text-lg font-semibold text-foreground">Total</span>
        <span
          className="text-2xl font-bold text-primary"
          aria-label={`Total: ${formatearMoneda(total)} CUP`}
        >
          {formatearMoneda(total)}
        </span>
      </div>
    </section>
  );
}
