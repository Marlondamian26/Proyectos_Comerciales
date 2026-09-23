"use client";

import type { GrupoCheckoutDTO } from "@/shared/checkout.types";
import type { ModoPrecio, RegimenFiscal, TratamientoIVA } from "@/generated/prisma/client";
import { Card } from "@/components/ui/Card";
import { SelectorEntrega } from "./SelectorEntrega";

export type DecimalValue = number | string;

export interface ItemFiscalDTO {
  tratamientoIVA?: TratamientoIVA | null;
  tasaIVA?: DecimalValue | null;
  precioUnitarioBase?: DecimalValue | null;
  precioUnitarioConIVA?: DecimalValue | null;
  baseImponible?: DecimalValue | null;
  montoIVA?: DecimalValue | null;
  subtotal?: DecimalValue | null;
}

export interface NegocioFiscalDTO {
  regimenFiscal?: RegimenFiscal | null;
  tasaIVA?: DecimalValue | null;
  modoPrecio?: ModoPrecio | null;
}

export interface GrupoFiscalDTO {
  baseImponible?: DecimalValue | null;
  montoIVA?: DecimalValue | null;
  totalConIVA?: DecimalValue | null;
  total?: DecimalValue | null;
  regimenFiscal?: RegimenFiscal | null;
  tasaIVA?: DecimalValue | null;
  modoPrecio?: ModoPrecio | null;
}

export type GrupoNegocioCardGrupo = GrupoCheckoutDTO &
  GrupoFiscalDTO & {
    negocio: GrupoCheckoutDTO["negocio"] & NegocioFiscalDTO;
    items: Array<GrupoCheckoutDTO["items"][number] & ItemFiscalDTO>;
  };

export interface GrupoNegocioCardProps {
  grupo: GrupoNegocioCardGrupo;
  seleccion: {
    tipoEntrega: "DOMICILIO" | "RECOGIDA_TIENDA";
    opcionLogisticaId?: string;
    direccionEntrega?: string;
    notas?: string;
  };
  direccionUsuario?: string | null;
  onSeleccionChange: (grupo: GrupoNegocioCardGrupo, seleccion: GrupoNegocioCardProps["seleccion"]) => void;
  onNotasChange: (grupo: GrupoNegocioCardGrupo, notas: string) => void;
}

const REGIMENES_SIN_IVA: RegimenFiscal[] = ["SIMPLIFICADO", "EXENTO", "NO_SUJETO"];

export function numeroFinito(valor: DecimalValue | null | undefined): number | undefined {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : undefined;
  }
  if (typeof valor === "string" && valor.trim() !== "") {
    const parsed = Number(valor);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function formatearMoneda(valor: DecimalValue | null | undefined, fallback = 0): string {
  return `$${(numeroFinito(valor) ?? fallback).toFixed(2)}`;
}

export function formatearTasa(valor: DecimalValue | null | undefined): string | undefined {
  const tasa = numeroFinito(valor);
  if (tasa === undefined) return undefined;
  const valorFormateado = Number.isInteger(tasa)
    ? String(tasa)
    : String(Number(tasa.toFixed(2))).replace(/\.0+$/, "");
  return `${valorFormateado}%`;
}

export function esRegimenSinIVA(regimen: RegimenFiscal | null | undefined): boolean {
  return regimen !== undefined && regimen !== null && REGIMENES_SIN_IVA.includes(regimen);
}

export function obtenerBaseImponibleGrupo(grupo: GrupoNegocioCardGrupo): number {
  return numeroFinito(grupo.baseImponible) ?? numeroFinito(grupo.subtotal) ?? 0;
}

export function obtenerMontoIVAGrupo(grupo: GrupoNegocioCardGrupo): number {
  return numeroFinito(grupo.montoIVA) ?? numeroFinito(grupo.iva) ?? 0;
}

export function obtenerTotalGrupo(grupo: GrupoNegocioCardGrupo): number {
  return (
    numeroFinito(grupo.totalConIVA) ??
    numeroFinito(grupo.total) ??
    obtenerBaseImponibleGrupo(grupo) + obtenerMontoIVAGrupo(grupo)
  );
}

export function obtenerTasaGrupo(grupo: GrupoNegocioCardGrupo): string | undefined {
  const tasaExplicita = formatearTasa(
    grupo.tasaIVA ?? grupo.negocio.tasaIVA
  );
  if (tasaExplicita !== undefined) return tasaExplicita;

  const base = obtenerBaseImponibleGrupo(grupo);
  const iva = obtenerMontoIVAGrupo(grupo);
  if (base <= 0 || iva === 0) return undefined;
  return formatearTasa((iva / base) * 100);
}

export function grupoNoDesglosaIVA(grupo: GrupoNegocioCardGrupo): boolean {
  if (esRegimenSinIVA(grupo.regimenFiscal ?? grupo.negocio.regimenFiscal)) {
    return true;
  }
  return grupo.items.length > 0 && grupo.items.every(
    (item) => item.tratamientoIVA === "EXENTO" || item.tratamientoIVA === "NO_SUJETO"
  );
}

export function itemTieneDetalleFiscal(item: GrupoNegocioCardGrupo["items"][number]): boolean {
  return (
    item.tratamientoIVA !== undefined ||
    item.tasaIVA !== undefined ||
    item.precioUnitarioBase !== undefined ||
    item.precioUnitarioConIVA !== undefined ||
    item.baseImponible !== undefined ||
    item.montoIVA !== undefined ||
    item.subtotal !== undefined
  );
}

export function formatearTratamientoIVA(tratamiento: TratamientoIVA | null | undefined): string {
  if (tratamiento === "EXENTO") return "Exento";
  if (tratamiento === "NO_SUJETO") return "No sujeto";
  if (tratamiento === "GRAVADO") return "Gravado";
  return "Fiscal";
}

function nombreItem(item: GrupoNegocioCardGrupo["items"][number]): string {
  return item.producto?.nombre ?? item.servicio?.nombre ?? "Producto";
}

function totalItem(item: GrupoNegocioCardGrupo["items"][number]): number {
  return (
    numeroFinito(item.subtotal) ??
    ((numeroFinito(item.precioUnitarioConIVA) ?? numeroFinito(item.precioUnitario) ?? 0) *
      item.cantidad)
  );
}

export function GrupoNegocioCard({
  grupo,
  seleccion,
  direccionUsuario,
  onSeleccionChange,
  onNotasChange,
}: GrupoNegocioCardProps) {
  const handleTipoChange = (tipoEntrega: "DOMICILIO" | "RECOGIDA_TIENDA") => {
    onSeleccionChange(grupo, {
      ...seleccion,
      tipoEntrega,
      opcionLogisticaId: tipoEntrega === "RECOGIDA_TIENDA" ? undefined : seleccion.opcionLogisticaId,
      direccionEntrega:
        tipoEntrega === "RECOGIDA_TIENDA"
          ? undefined
          : seleccion.direccionEntrega ?? direccionUsuario ?? undefined,
    });
  };

  const handleOpcionChange = (opcionLogisticaId: string) => {
    onSeleccionChange(grupo, { ...seleccion, opcionLogisticaId });
  };

  const handleDireccionChange = (direccionEntrega: string) => {
    onSeleccionChange(grupo, { ...seleccion, direccionEntrega });
  };

  const handleNotasChange = (notas: string) => {
    onNotasChange(grupo, notas);
  };

  const baseImponible = obtenerBaseImponibleGrupo(grupo);
  const montoIVA = obtenerMontoIVAGrupo(grupo);
  const totalGrupo = obtenerTotalGrupo(grupo);
  const noDesglosaIVA = grupoNoDesglosaIVA(grupo);
  const tasaIVA = obtenerTasaGrupo(grupo);
  const ivaLabel = tasaIVA === undefined ? "IVA" : `IVA (${tasaIVA})`;
  const hayItemsExentos = grupo.items.some(
    (item) => item.tratamientoIVA === "EXENTO" || item.tratamientoIVA === "NO_SUJETO"
  );

  return (
    <Card
      title={grupo.negocio.nombre}
      description={grupo.negocio.direccion ?? "Sin dirección registrada"}
      shadow="md"
      className="w-full"
    >
      <div className="space-y-4">
        <ul className="space-y-3 text-sm" aria-label={`Artículos de ${grupo.negocio.nombre}`}>
          {grupo.items.map((item) => {
            const nombre = nombreItem(item);
            const tratamiento = item.tratamientoIVA;
            const tasa = formatearTasa(item.tasaIVA);
            const base = numeroFinito(item.baseImponible);
            const iva = numeroFinito(item.montoIVA);
            const tieneDetalle = itemTieneDetalleFiscal(item);
            const detalleFiscal = [
              tratamiento ? formatearTratamientoIVA(tratamiento) : undefined,
              tratamiento === "GRAVADO" && tasa ? `IVA ${tasa}` : undefined,
              base !== undefined ? `Base ${formatearMoneda(base)}` : undefined,
              iva !== undefined ? `IVA ${formatearMoneda(iva)}` : undefined,
            ].filter((detalle): detalle is string => Boolean(detalle));

            return (
              <li key={item.id} className="flex justify-between gap-4">
                <span className="min-w-0">
                  <span className="block truncate" aria-label={`${nombre}, cantidad ${item.cantidad}`}>
                    {nombre} × {item.cantidad}
                  </span>
                  {tieneDetalle && (
                    <span className="block text-xs text-muted-foreground" aria-label={`Detalle fiscal de ${nombre}: ${detalleFiscal.join(", ")}`}>
                      {detalleFiscal.join(" · ")}
                    </span>
                  )}
                </span>
                <span className="font-medium whitespace-nowrap" aria-label={`Total de ${nombre}: ${formatearMoneda(totalItem(item))}`}>
                  {formatearMoneda(totalItem(item))}
                </span>
              </li>
            );
          })}
        </ul>

        <dl className="border-t pt-2 space-y-1" aria-label={`Desglose fiscal de ${grupo.negocio.nombre}`}>
          <div className="flex justify-between text-sm">
            <dt className="text-muted-foreground">Base imponible</dt>
            <dd className="font-medium">{formatearMoneda(baseImponible)}</dd>
          </div>
          {!noDesglosaIVA && (
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">{ivaLabel}</dt>
              <dd className="font-medium">{formatearMoneda(montoIVA)}</dd>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold">
            <dt>Total</dt>
            <dd>{formatearMoneda(totalGrupo)}</dd>
          </div>
        </dl>

        {noDesglosaIVA && (
          <p className="rounded-lg bg-info/10 border border-info/20 p-3 text-sm text-info" role="status">
            Este negocio no desglosa IVA.
          </p>
        )}
        {!noDesglosaIVA && hayItemsExentos && (
          <p className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning" role="status">
            Incluye artículos exentos o no sujetos a IVA.
          </p>
        )}

        {!grupo.disponibilidadOk && (
          <div
            className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
            role="alert"
          >
            <p className="font-semibold mb-1">Problemas de disponibilidad:</p>
            <ul className="list-disc list-inside space-y-1">
              {grupo.erroresDisponibilidad.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <SelectorEntrega
          grupo={grupo}
          seleccion={seleccion}
          direccionUsuario={direccionUsuario}
          onTipoChange={handleTipoChange}
          onOpcionChange={handleOpcionChange}
          onDireccionChange={handleDireccionChange}
        />

        <div className="pt-2">
          <label
            htmlFor={`notas-${grupo.negocioId}`}
            className="text-sm font-medium text-foreground"
          >
            Instrucciones para el negocio (opcional)
          </label>
          <textarea
            id={`notas-${grupo.negocioId}`}
            value={seleccion.notas ?? ""}
            onChange={(e) => handleNotasChange(e.target.value)}
            placeholder="Ej: entregar en la puerta trasera"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
            maxLength={200}
            aria-label="Instrucciones para el negocio"
          />
        </div>
      </div>
    </Card>
  );
}
