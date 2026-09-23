import { Service } from "./Service";
import prisma, { cachedQuery } from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { logAudit } from "./utils/audit";
import type { GrupoItemInput } from "@/services/IVAService";
import { TratamientoIVA } from "@/generated/prisma/client";
import type { Factura } from "@/generated/prisma/client";
import IVAService from "@/services/IVAService";

interface FacturaConDatos {
  id: string;
  numero: string;
  fecha: Date;
  estado: string;
  subtotal: number;
  impuestos: number;
  total: number;
  baseImponible: number | null;
  montoIVA: number | null;
  nitEmisor: string | null;
  nitReceptor: string | null;
  negocio?: { id: string; nombre: string; nit?: string | null } | null;
  items: Array<{
    cantidad: number;
    precioUnitario: number;
    precioUnitarioBase: number;
    precioUnitarioConIVA: number;
    tasaIVA: number;
    tratamientoIVA: string;
    baseImponible: number;
    montoIVA: number;
    subtotal: number;
    producto?: { nombre: string } | null;
    servicio?: { nombre: string } | null;
  }>;
  datosPago?: {
    idTransferencia: string | null;
    entidadPago: string | null;
    fechaTransferencia: Date | null;
  } | null;
}

function generarHTMLFacturaONAT(factura: FacturaConDatos): string {
  const negocioNombre = factura.negocio?.nombre ?? "—";
  const negocioNIT = factura.nitEmisor ?? factura.negocio?.nit ?? "—";
  const receptorNIT = factura.nitReceptor ?? "—";
  const fecha = new Date(factura.fecha).toLocaleDateString("es-ES");
  const baseImponible = factura.baseImponible ?? factura.subtotal;
  const montoIVA = factura.montoIVA ?? factura.impuestos;

  const itemsHTML = factura.items
    .map((item) => {
      const nombre = item.producto?.nombre ?? item.servicio?.nombre ?? "Artículo";
      const tratamiento = item.tratamientoIVA === "EXENTO" ? "Exento" :
                          item.tratamientoIVA === "NO_SUJETO" ? "No sujeto" : "Gravado";
      return `
        <tr style="border:1px solid #ddd; padding:8px;">
          <td style="padding:8px; border:1px solid #ddd;">${nombre}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:center;">${item.cantidad}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">$${Number(item.precioUnitarioConIVA).toFixed(2)}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${tratamiento}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">$${Number(item.baseImponible).toFixed(2)}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">$${Number(item.montoIVA).toFixed(2)}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right; font-weight:bold;">$${Number(item.subtotal).toFixed(2)}</td>
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
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td { padding: 5px 10px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: #f0f0f0; padding: 8px; border: 1px solid #ddd; text-align: left; }
    .items-table td { padding: 8px; border: 1px solid #ddd; }
    .totals { margin-top: 20px; }
    .totals td { padding: 5px 10px; }
    .totals tr:last-child td { font-weight: bold; border-top: 2px solid #333; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0; font-size:24px;">FACTURA</h1>
    <p style="margin:5px 0; color:#666; font-size:14px;">Número: <strong>${factura.numero}</strong></p>
    <p style="margin:5px 0; color:#666; font-size:14px;">Fecha: ${fecha}</p>
    <p style="margin:5px 0; color:#666; font-size:14px;">Estado: ${factura.estado}</p>
  </div>

  <table class="info-table">
    <tr>
      <td style="width:50%;"><strong>Emisor:</strong></td>
      <td style="width:50%;"><strong>Receptor:</strong></td>
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

  <table class="items-table">
    <thead>
      <tr>
        <th>Concepto</th>
        <th>Cant.</th>
        <th>Precio U.</th>
        <th>Tratamiento</th>
        <th>Base</th>
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
      <td style="width:15%; text-align:right;">$${Number(baseImponible).toFixed(2)}</td>
    </tr>
    <tr>
      <td></td>
      <td><strong>IVA:</strong></td>
      <td style="text-align:right;">$${Number(montoIVA).toFixed(2)}</td>
    </tr>
    <tr>
      <td></td>
      <td><strong>TOTAL:</strong></td>
      <td style="text-align:right;">$${Number(factura.total).toFixed(2)}</td>
    </tr>
  </table>

  <p style="margin-top:30px; font-size:12px; color:#999;">Factura electrónica - Sistema Mi-Pyme</p>
  ${factura.datosPago?.idTransferencia ? `
  <table class="info-table" style="margin-top:20px;">
    <tr>
      <td style="width:50%;"><strong>ID Transferencia:</strong> ${factura.datosPago.idTransferencia}</td>
      <td style="width:50%;"><strong>Entidad:</strong> ${factura.datosPago.entidadPago ?? "—"}</td>
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

export class FacturaService extends Service {
  private ivaService = new IVAService();
  private pagoService: { vincularFactura: (pagoId: string, facturaId: string) => Promise<unknown> } | null = null;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  setPagoService(pagoService: { vincularFactura: (pagoId: string, facturaId: string) => Promise<unknown> }): void {
    this.pagoService = pagoService;
  }

  async listarFacturas(
    usuarioId?: string,
    negocioId?: string,
    options?: { page?: number; limit?: number; [key: string]: unknown }
  ): Promise<{
    data: Factura[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
     const cacheKey = negocioId
       ? cacheKeys.facturas.negocio(negocioId, options)
       : cacheKeys.facturas.usuario(usuarioId ?? "all", options);

    return cachedQuery(cacheKey, async () => {
      const page = options?.page ?? 1;
      const limit = options?.limit ?? 10;
      const skip = (page - 1) * limit;
      const where: Record<string, unknown> = {
        ...(usuarioId && !negocioId && { usuarioId }),
        ...(negocioId && { negocioId }),
      };

      const [facturas, total] = await Promise.all([
        prisma.factura.findMany({
          where,
          include: {
            pedido: {
              include: {
                items: {
                  include: {
                    producto: true,
                    servicio: true,
                  },
                },
              },
            },
          },
          orderBy: { fecha: "desc" },
          skip,
          take: limit,
        }),
        prisma.factura.count({ where }),
      ]);

      return {
        data: facturas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async emitirFactura(pedidoId: string): Promise<Factura> {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new BusinessError("Pedido no encontrado", "NO_ENCONTRADO", 404);
    }

    const existingFactura = await prisma.factura.findUnique({
      where: { pedidoId },
    });

    if (existingFactura) {
      throw new BusinessError("Ya existe una factura para este pedido", "FACTURA_YA_EMITIDA", 409);
    }

    const negocioId = pedido.items[0]?.negocioId ?? null;

    const negocio = negocioId
      ? await prisma.negocio.findUnique({
          where: { id: negocioId },
          select: {
            nit: true,
            prefijoFactura: true,
            numeroFacturaConsecutivo: true,
            regimenFiscal: true,
            tasaIVA: true,
            modoPrecio: true,
          },
        })
      : null;

    const now = new Date();
    const año = now.getFullYear();

    const prefijo = "PR";
    let numeroFactura: string;

    if (negocio) {
      const negocioActualizado = await prisma.negocio.update({
        where: { id: negocioId },
        data: {
          numeroFacturaConsecutivo: {
            increment: 1,
          },
        },
        select: { numeroFacturaConsecutivo: true },
      });
      const consecutivo = negocioActualizado.numeroFacturaConsecutivo;
      numeroFactura = this.ivaService.formatearNumeroFactura(
        { nit: negocio.nit ?? undefined, prefijoFactura: negocio.prefijoFactura ?? undefined },
        año,
        consecutivo
      );
    } else {
      const consecutivo = await prisma.factura.count() + 1;
      numeroFactura = this.ivaService.formatearNumeroFactura(prefijo, año, consecutivo);
    }

    const baseImponibleRaw = Number(pedido.baseImponibleTotal);
    const montoIVARaw = Number(pedido.montoIVATotal);
    const totalConIVARaw = Number(pedido.totalConIVA);

    let baseImponible: number;
    let montoIVA: number;
    let total: number;
    let itemsFiscalesData: Array<{
      precioUnitarioBase: number;
      precioUnitarioConIVA: number;
      tasaIVA: number;
      tratamientoIVA: string;
      baseImponible: number;
      montoIVA: number;
      subtotal: number;
    }>;

    const tieneSnapshots = baseImponibleRaw > 0 || totalConIVARaw > 0;

    if (tieneSnapshots) {
      baseImponible = baseImponibleRaw > 0 ? baseImponibleRaw : Number(pedido.total);
      montoIVA = montoIVARaw;
      total = totalConIVARaw > 0 ? totalConIVARaw : Number(pedido.total);
      itemsFiscalesData = pedido.items.map((item) => ({
        precioUnitarioBase: Number(item.precioUnitarioBase),
        precioUnitarioConIVA: Number(item.precioUnitarioConIVA),
        tasaIVA: Number(item.tasaIVA),
        tratamientoIVA: item.tratamientoIVA,
        baseImponible: Number(item.baseImponible),
        montoIVA: Number(item.montoIVA),
        subtotal: Number(item.subtotal),
      }));
    } else {
      if (!negocio) {
        throw new BusinessError("No hay negocio asociado al pedido", "SIN_NEGOCIO", 400);
      }
      const negocioFiscal = {
        regimenFiscal: negocio.regimenFiscal ?? "GENERAL",
        tasaIVA: negocio.tasaIVA ?? 10,
        modoPrecio: negocio.modoPrecio ?? "IVA_INCLUIDO",
      };

      const itemsFiscales: GrupoItemInput[] = pedido.items.map((item) => {
        const tratamiento = item.tratamientoIVA ?? "GRAVADO";
        const tasaOverride = item.tasaIVA && Number(item.tasaIVA) > 0
          ? Number(item.tasaIVA)
          : null;
        return {
          precio: Number(item.precioUnitario),
          cantidad: item.cantidad,
          tratamientoIVA: tratamiento,
          tasaOverride,
        };
      });

      const calculoGrupo = this.ivaService.calcularGrupo(itemsFiscales, negocioFiscal);
      baseImponible = Number(calculoGrupo.baseImponible.toFixed(2));
      montoIVA = Number(calculoGrupo.montoIVA.toFixed(2));
      total = Number(calculoGrupo.totalConIVA.toFixed(2));
      itemsFiscalesData = pedido.items.map((_, idx) => {
        const calcItem = calculoGrupo.items[idx];
        return {
          precioUnitarioBase: Number(calcItem.precioUnitarioBase.toFixed(2)),
          precioUnitarioConIVA: Number(calcItem.precioUnitarioConIVA.toFixed(2)),
          tasaIVA: Number(calcItem.tasaAplicada.toFixed(2)),
          tratamientoIVA: calcItem.tratamientoIVA,
          baseImponible: Number(calcItem.baseImponible.toFixed(2)),
          montoIVA: Number(calcItem.montoIVA.toFixed(2)),
          subtotal: Number(calcItem.subtotal.toFixed(2)),
        };
      });
    }

    const factura = await prisma.factura.create({
      data: {
        pedidoId: pedido.id,
        usuarioId: pedido.usuarioId,
        negocioId,
        numero: numeroFactura,
        nitEmisor: negocio?.nit ?? null,
        fecha: now,
        estado: "emitida",
        subtotal: baseImponible,
        impuestos: montoIVA,
        total,
        baseImponible,
        montoIVA,
        items: {
          create: pedido.items.map((item, idx) => {
            const fiscal = itemsFiscalesData[idx];
            return {
              productoId: item.productoId,
              servicioId: item.servicioId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              precioUnitarioBase: fiscal.precioUnitarioBase,
              precioUnitarioConIVA: fiscal.precioUnitarioConIVA,
              tasaIVA: fiscal.tasaIVA,
              tratamientoIVA: fiscal.tratamientoIVA as TratamientoIVA,
              baseImponible: fiscal.baseImponible,
              montoIVA: fiscal.montoIVA,
              subtotal: fiscal.subtotal,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
          },
        },
        pedido: true,
      },
    });

     await logAudit("FACTURA_EMITIDA", pedido.usuarioId, factura.id, {
       negocioId,
       pedidoId: pedido.id,
       numeroFactura,
       baseImponible: Number(baseImponible),
       montoIVA: Number(montoIVA),
       total: Number(total),
     });

     await this.cache.invalidatePrefix(cachePrefixes.pedidosUsuario + pedido.usuarioId + ":");
     await this.cache.invalidatePrefix("facturas:usuario:" + pedido.usuarioId + ":");
     if (negocioId) {
       await this.cache.invalidatePrefix("facturas:negocio:" + negocioId + ":");
     }

     const pagoExistente = await prisma.pago.findUnique({
       where: { pedidoId: pedido.id },
       select: { id: true, idTransferencia: true, entidadPago: true, fechaTransferencia: true },
     });
     if (pagoExistente) {
       await this.pagoService!.vincularFactura(pagoExistente.id, factura.id);
     }

    return factura;
  }

  async getFactura(facturaId: string) {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        items: {
          include: { producto: true, servicio: true },
        },
        pedido: {
          include: { negocio: true, usuario: true },
        },
        negocio: true,
      },
    });

    if (!factura) {
      throw new BusinessError("Factura no encontrada", "NO_ENCONTRADO", 404);
    }

    return factura;
  }

  async descargarFactura(facturaId: string): Promise<{ factura: Factura; html: string }> {
    const factura = await this.getFactura(facturaId);

    const pago = await prisma.pago.findUnique({
      where: { facturaId: factura.id },
      select: { idTransferencia: true, entidadPago: true, fechaTransferencia: true },
    });

    return {
      factura,
      html: generarHTMLFacturaONAT({
        ...factura,
        subtotal: Number(factura.subtotal),
        impuestos: Number(factura.impuestos),
        total: Number(factura.total),
        baseImponible: factura.baseImponible ? Number(factura.baseImponible) : null,
        montoIVA: factura.montoIVA ? Number(factura.montoIVA) : null,
        items: factura.items.map((item) => ({
          cantidad: item.cantidad,
          precioUnitario: Number(item.precioUnitario),
          precioUnitarioBase: Number(item.precioUnitarioBase),
          precioUnitarioConIVA: Number(item.precioUnitarioConIVA),
          tasaIVA: Number(item.tasaIVA),
          tratamientoIVA: item.tratamientoIVA,
          baseImponible: Number(item.baseImponible),
          montoIVA: Number(item.montoIVA),
          subtotal: Number(item.subtotal),
          producto: item.producto ? { nombre: item.producto.nombre } : null,
          servicio: item.servicio ? { nombre: item.servicio.nombre } : null,
        })),
        datosPago: pago
          ? {
              idTransferencia: pago.idTransferencia,
              entidadPago: pago.entidadPago,
              fechaTransferencia: pago.fechaTransferencia,
            }
          : null,
      }),
    };
  }
}

export { generarHTMLFacturaONAT };
export type { FacturaConDatos };
export default FacturaService;
