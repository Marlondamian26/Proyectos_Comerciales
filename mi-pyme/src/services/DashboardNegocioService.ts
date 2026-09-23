/**
 * DashboardNegocioService - KPIs and summary data for the negocio dashboard.
 *
 * Reutiliza los reportes existentes (reporteVentasPorDia, reporteProductosMasVendidos,
 * reporteInventario) expuestos en Server Actions. No crea reportes nuevos.
 *
 * Framework-agnostic: no Next.js imports.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { assertPertenencia } from "./utils/permisos";
import { DisponibilidadService } from "./DisponibilidadService";
import type { Negocio } from "@/generated/prisma/client";
import type { DashboardResumenDTO } from "@/shared/negocio.types";
import type { ResumenPagosPorEntidadDTO } from "@/shared/pagos.types";

export class DashboardNegocioService extends Service {
  private dispService: DisponibilidadService;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.dispService = new DisponibilidadService(this.cache);
  }

  /**
   * KPIs: pedidos pendientes, reservas próximas, ventas del período,
   * productos con stock bajo, disponibilidad de hoy.
   */
  async getResumen(
    negocioId: string,
    userId: string,
    rangoFechas?: { desde?: Date; hasta?: Date },
    rolActual?: string
  ): Promise<DashboardResumenDTO> {
    await assertPertenencia(userId, negocioId, rolActual);

    const cacheKey = cacheKeys.dashboard.resumen(negocioId, rangoFechas ?? {});
    const cached = await this.cache.get<DashboardResumenDTO>(cacheKey);
    if (cached) return cached;

    const desde = rangoFechas?.desde ?? new Date();
    desde.setMonth(desde.getMonth() - 1);
    const hasta = rangoFechas?.hasta ?? new Date();

    const [
      negocio,
      pedidosPendientes,
      reservasProximas,
      inventarioBajo,
      productosActivos,
    ] = await Promise.all([
      prisma.negocio.findUnique({
        where: { id: negocioId },
        select: { id: true, nombre: true },
      }),
      prisma.pedidoItem.count({
        where: {
          negocioId,
          pedido: {
            estado: { in: ["pendiente", "confirmado", "preparando"] },
            fechaCreacion: { gte: desde, lte: hasta },
          },
        },
      }),
      prisma.reserva.count({
        where: {
          negocioId,
          estado: { in: ["pendiente", "confirmada"] },
          fechaHoraInicio: { gte: new Date() },
        },
      }),
      prisma.inventario.count({
        where: {
          producto: { negocioId },
          cantidadActual: { lte: prisma.inventario.fields.puntoReorden },
        },
      }),
      prisma.producto.findMany({
        where: { negocioId, activo: true },
        select: { id: true },
      }),
    ]);

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    // Ventas del período usando PedidoItem directamente
    const ventasRaw = await prisma.pedidoItem.aggregate({
      where: {
        negocioId,
        pedido: {
          estado: { not: "cancelada" },
          fechaCreacion: { gte: desde, lte: hasta },
        },
      },
      _sum: { subtotal: true },
    });

    // Disponibilidad de hoy para productos activos
    const hoy = new Date();
    let disponibleHoyCount = 0;
    if (productosActivos.length > 0) {
      const mapa = await this.dispService.getDisponibilidadProductos(
        productosActivos.map((p) => p.id),
        hoy
      );
      disponibleHoyCount = Array.from(mapa.values()).filter(
        (d) => d.disponible
      ).length;
    }

    const resultado: DashboardResumenDTO = {
      pedidosPendientes,
      reservasProximas,
      ventasPeriodo: Number(ventasRaw._sum.subtotal ?? 0),
      stockBajo: inventarioBajo,
      disponibleHoyCount,
      negocio: { id: negocio.id, nombre: negocio.nombre },
    };

    await this.cache.set(cacheKey, resultado, cacheTTL.dashboardResumen);
    return resultado;
  }

  /**
   * KPIs de pagos para un negocio, agrupados por entidadPago.
   * Útil para conciliación de transferencias (Fase 1, Punto 5).
   */
  async getResumenPagosPorEntidad(
    negocioId: string,
    userId: string,
    rangoFechas?: { desde?: Date; hasta?: Date },
    rolActual?: string
  ): Promise<ResumenPagosPorEntidadDTO> {
    await assertPertenencia(userId, negocioId, rolActual);

    const desde = rangoFechas?.desde ?? new Date(0);
    const hasta = rangoFechas?.hasta ?? new Date();

    const where: Record<string, unknown> = {
      negocioId,
      createdAt: { gte: desde, lte: hasta },
    };

    const pagos = await prisma.pago.findMany({
      where,
      select: { estado: true, metodo: true, monto: true, entidadPago: true },
    });

    let totalCobrado = 0;
    let totalPendiente = 0;
    let totalReembolsado = 0;
    let totalFallido = 0;
    const porEntidad: Record<string, { completado: number; pendiente: number; total: number; count: number }> = {};
    const porEstado: Record<string, number> = {};

    for (const p of pagos) {
      const monto = Number(p.monto);
      const entidad = p.entidadPago ?? "Sin entidad";
      porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;

      if (!porEntidad[entidad]) {
        porEntidad[entidad] = { completado: 0, pendiente: 0, total: 0, count: 0 };
      }
      porEntidad[entidad].total += monto;
      porEntidad[entidad].count += 1;

      switch (p.estado) {
        case "COMPLETADO":
          totalCobrado += monto;
          porEntidad[entidad].completado += monto;
          break;
        case "PENDIENTE":
        case "EN_PROCESO":
          totalPendiente += monto;
          porEntidad[entidad].pendiente += monto;
          break;
        case "REEMBOLSADO":
          totalReembolsado += monto;
          break;
        case "FALLIDO":
          totalFallido += monto;
          break;
        case "CANCELADO":
          break;
      }
    }

    return {
      totalCobrado: Number(totalCobrado.toFixed(2)),
      totalPendiente: Number(totalPendiente.toFixed(2)),
      totalReembolsado: Number(totalReembolsado.toFixed(2)),
      totalFallido: Number(totalFallido.toFixed(2)),
      porEntidad,
      porEstado,
      cantidadTotal: pagos.length,
    };
  }

  /**
    * Pedidos recientes asociados al negocio (últimos N).
    */
  async getPedidosRecientes(
    negocioId: string,
    userId: string,
    limit = 10,
    rolActual?: string
  ) {
    await assertPertenencia(userId, negocioId, rolActual);

    return prisma.pedido.findMany({
      where: {
        items: { some: { negocioId } },
      },
      include: {
        items: {
          where: { negocioId },
          include: { producto: true, servicio: true },
        },
        usuario: { select: { id: true, email: true, nombre: true } },
        opcionLogistica: true,      },
      orderBy: { fechaCreacion: "desc" },
      take: limit,
    });
  }

  /**
   * Reservas próximas asociadas al negocio (próximos N).
   */
  async getReservasProximas(
    negocioId: string,
    userId: string,
    limit = 10,
    rolActual?: string
  ) {
    await assertPertenencia(userId, negocioId, rolActual);

    return prisma.reserva.findMany({
      where: {
        negocioId,
        estado: { in: ["pendiente", "confirmada"] },
        fechaHoraInicio: { gte: new Date() },
      },
      include: {
        servicio: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, email: true, nombre: true } },
      },
      orderBy: { fechaHoraInicio: "asc" },
      take: limit,
    });
  }

  /**
   * Lista todos los pedidos asociados al negocio.
   */
  async listarPedidos(
    negocioId: string,
    userId: string,
    rolActual?: string
  ) {
    await assertPertenencia(userId, negocioId, rolActual);

    const pedidosRaw = await prisma.pedido.findMany({
      where: {
        negocioId,
      },
      include: {
        items: {
          include: { producto: true, servicio: true },
        },
        usuario: { select: { id: true, email: true, nombre: true } },
        opcionLogistica: true,
      },
      orderBy: { fechaCreacion: "desc" },
    });

    return pedidosRaw.map((p) => ({
      ...p,
      total: Number(p.total),
      costoEnvio: p.costoEnvio !== null && p.costoEnvio !== undefined ? Number(p.costoEnvio) : null,
    }));
  }

  /**
   * Lista todas las reservas asociadas al negocio.
   */
  async listarReservas(
    negocioId: string,
    userId: string,
    rolActual?: string
  ) {
    await assertPertenencia(userId, negocioId, rolActual);

    return prisma.reserva.findMany({
      where: { negocioId },
      include: {
        servicio: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, email: true, nombre: true } },
      },
      orderBy: { fechaHoraInicio: "desc" },
    });
  }

  /**
   * Actualiza el estado de un pedido (para el negocio).
   */
  async actualizarEstadoPedido(
    negocioId: string,
    pedidoId: string,
    nuevoEstado: string,
    userId: string,
    rolActual?: string
  ) {
    await assertPertenencia(userId, negocioId, rolActual);

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { id: true, items: { select: { negocioId: true } } },
    });

    if (!pedido) {
      throw new BusinessError("Pedido no encontrado", "NO_ENCONTRADO", 404);
    }

    const perteneceAlNegocio = pedido.items.some(
      (item) => item.negocioId === negocioId
    );

     if (!perteneceAlNegocio) {
      throw new BusinessError(
        "Este pedido no pertenece a tu negocio",
        "NO_AUTORIZADO",
        403
      );
    }

    // Sincronización de estado de pago:
    // Al cancelar un pedido con pago COMPLETADO, se exige reembolso previo.
    if (nuevoEstado === "cancelado") {
      const pago = await prisma.pago.findUnique({
        where: { pedidoId },
        select: { estado: true },
      });

      if (pago && pago.estado === "COMPLETADO") {
        throw new BusinessError(
          "No se puede cancelar un pedido con pago COMPLETADO. Reembolsa el pago primero.",
          "REEMBOLSO_REQUERIDO",
          409
        );
      }
    }

    const result = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado: nuevoEstado },
    });

    await this.cache.invalidatePrefix("dashboard:resumen:" + negocioId);
    return result;
  }

  /**
    * Confirma o cancela una reserva (para el negocio).
   */
  async actualizarReserva(
    negocioId: string,
    reservaId: string,
    nuevoEstado: string,
    userId: string,
    rolActual?: string
  ) {
    await assertPertenencia(userId, negocioId, rolActual);

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      select: { negocioId: true },
    });

    if (!reserva) {
      throw new BusinessError("Reserva no encontrada", "NO_ENCONTRADO", 404);
    }

    if (reserva.negocioId !== negocioId) {
      throw new BusinessError(
        "Esta reserva no pertenece a tu negocio",
        "NO_AUTORIZADO",
        403
      );
    }

    const result = await prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: nuevoEstado },
    });

    await this.cache.invalidatePrefix("dashboard:resumen:" + negocioId);
    return result;
  }

  async invalidateCache(negocioId?: string): Promise<void> {
    if (negocioId) {
      await this.cache.invalidatePrefix("dashboard:resumen:" + negocioId);
    }
  }
}

export default DashboardNegocioService;
