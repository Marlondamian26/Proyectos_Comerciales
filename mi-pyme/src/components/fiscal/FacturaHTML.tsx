import type { ModoPrecio, RegimenFiscal, TratamientoIVA } from "@/generated/prisma/client";

interface FacturaItem {
  cantidad: number;
  precioUnitario: number;
  precioUnitarioBase?: number | null;
  precioUnitarioConIVA?: number | null;
  tasaIVA?: number | null;
  tratamientoIVA?: TratamientoIVA | null;
  baseImponible?: number | null;
  montoIVA?: number | null;
  subtotal: number;
  producto?: { nombre: string } | null;
  servicio?: { nombre: string } | null;
}

interface Factura {
  id: string;
  numero: string;
  fecha: string | Date;
  estado: string;
  subtotal?: number | null;
  impuestos?: number | null;
  total: number;
  baseImponible?: number | null;
  montoIVA?: number | null;
  nitEmisor?: string | null;
  nitReceptor?: string | null;
  desgloseIVA?: Record<string, unknown> | null;
  negocio?: { id: string; nombre: string; nit?: string | null } | null;
  items: FacturaItem[];
  datosPago?: {
    idTransferencia: string | null;
    entidadPago: string | null;
    fechaTransferencia: Date | null;
  } | null;
}

export interface FacturaHTMLProps {
  factura: Factura;
}

function formatearMoneda(valor: number | null | undefined): string {
  return `$${(valor ?? 0).toFixed(2)}`;
}

function formatearTratamiento(tratamiento: TratamientoIVA | null | undefined): string {
  if (tratamiento === "EXENTO") return "Exento";
  if (tratamiento === "NO_SUJETO") return "No sujeto";
  return "Gravado";
}

export function FacturaHTML({ factura }: FacturaHTMLProps) {
  const fecha = new Date(factura.fecha).toLocaleDateString("es-ES");
  const negocioNombre = factura.negocio?.nombre ?? "—";
  const negocioNIT = factura.nitEmisor ?? factura.negocio?.nit ?? "—";
  const receptorNIT = factura.nitReceptor ?? "—";
  const baseImponible = factura.baseImponible ?? factura.subtotal ?? 0;
  const montoIVA = factura.montoIVA ?? factura.impuestos ?? 0;

  const itemsHTML = factura.items
    .map((item) => {
      const nombre = item.producto?.nombre ?? item.servicio?.nombre ?? "Artículo";
      const tratamiento = formatearTratamiento(item.tratamientoIVA);
      return `
        <tr>
          <td>${nombre}</td>
          <td style="text-align:center;">${item.cantidad}</td>
          <td style="text-align:right;">${formatearMoneda(item.precioUnitarioConIVA ?? item.precioUnitario)}</td>
          <td style="text-align:center;">${tratamiento}</td>
          <td style="text-align:right;">${formatearMoneda(item.baseImponible)}</td>
          <td style="text-align:right;">${formatearMoneda(item.montoIVA)}</td>
          <td style="text-align:right; font-weight:bold;">${formatearMoneda(item.subtotal)}</td>
        </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${factura.numero}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 13px; }
    td { padding: 10px; border: 1px solid #ddd; font-size: 13px; }
    .totals tr:last-child td { font-weight: bold; border-top: 2px solid #333; }
    .page-break { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0; font-size:24px;">FACTURA</h1>
    <p style="margin:5px 0; color:#666;">Número: <strong>${factura.numero}</strong></p>
    <p style="margin:5px 0; color:#666;">Fecha: ${fecha}</p>
    <p style="margin:5px 0; color:#666;">Estado: ${factura.estado}</p>
  </div>

  <table>
    <tr>
      <td><strong>Emisor:</strong></td>
      <td><strong>Receptor:</strong></td>
    </tr>
    <tr>
      <td>Negocio: ${negocioNombre}</td>
      <td>NIT: ${receptorNIT}</td>
    </tr>
    <tr>
      <td>NIT: ${negocioNIT}</td>
      <td></td>
    </tr>
  </table>

  <table class="page-break">
    <thead>
      <tr>
        <th>Concepto</th>
        <th>Cant.</th>
        <th>Precio U.</th>
        <th>Tratamiento</th>
        <th>Base imponible</th>
        <th>IVA</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td style="width:70%;"></td>
      <td style="width:15%;"><strong>Base imponible:</strong></td>
      <td style="width:15%; text-align:right;">${formatearMoneda(baseImponible)}</td>
    </tr>
    <tr>
      <td></td>
      <td><strong>IVA:</strong></td>
      <td style="text-align:right;">${formatearMoneda(montoIVA)}</td>
    </tr>
    <tr>
      <td></td>
      <td><strong>TOTAL:</strong></td>
      <td style="text-align:right;">${formatearMoneda(factura.total)}</td>
    </tr>
  </table>

  <p style="margin-top:30px; font-size:12px; color:#999;">Factura electrónica - Sistema Mi-Pyme</p>
  ${factura.datosPago?.idTransferencia ? `
  <table class="page-break" style="margin-top:15px;">
    <tr>
      <td><strong>ID Transferencia:</strong> ${factura.datosPago.idTransferencia}</td>
      <td><strong>Entidad:</strong> ${factura.datosPago.entidadPago ?? "—"}</td>
    </tr>
    ${factura.datosPago.fechaTransferencia ? `
    <tr>
      <td><strong>Fecha transferencia:</strong> ${new Date(factura.datosPago.fechaTransferencia).toLocaleDateString("es-ES")}</td>
      <td></td>
    </tr>` : ""}
  </table>` : ""}
</body>
</html>`;
}

export type { Factura as FacturaType, FacturaItem as FacturaItemType };
