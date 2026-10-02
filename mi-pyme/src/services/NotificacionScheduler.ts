/**
 * NotificacionScheduler — jobs programados de notificaciones.
 *
 * Ejecuta tareas periendas:
 *  - CUPON_PROXIMO_A_EXPIRAR: cupones que expiran en ≤3 días.
 *  - PROMOCION_AGOTADA: promociones con usosMaximos alcanzado.
 *  - STOCK_BAJO: productos con stock bajo (puntoReorden).
 *
 * La ejecución puede dispararse vía endpoint admin (`POST /api/admin/notificaciones/scheduler`)
 * o programarse con un cron real en Fase 4.
 *
 * TODO (Fase 4): migrar a cron real (node-cron o RabbitMQ delayed messages).
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { getCache, cacheKeys } from "@/infrastructure";
import type { ICache } from "@/infrastructure";
import { logAudit } from "./utils/audit";
import { NotificacionService } from "./NotificacionService";
import type { EventoNotificacion } from "@/shared/notificaciones.types";

const DIAS_ANTICIPACION_CUPON = 3;

export class NotificacionScheduler extends Service {
  private cache: ICache;
  private notificacionService: NotificacionService;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.notificacionService = new NotificacionService(this.cache);
  }

  /**
   * Ejecuta todos los jobs programados. No bloquea ni relanza errores.
   */
  async ejecutarJobs(): Promise<{
    cuponesNotificados: number;
    promocionesNotificadas: number;
    stockNotificado: number;
  }> {
    let cuponesNotificados = 0;
    let promocionesNotificadas = 0;
    let stockNotificado = 0;

    try {
      cuponesNotificados = await this.notificarCuponesProximosAExpirar();
    } catch (err) {
      console.error("[NotificacionScheduler] Error en cupones:", err);
    }

    try {
      promocionesNotificadas = await this.notificarPromocionesAgotadas();
    } catch (err) {
      console.error("[NotificacionScheduler] Error en promociones:", err);
    }

    try {
      stockNotificado = await this.notificarStockBajo();
    } catch (err) {
      console.error("[NotificacionScheduler] Error en stock:", err);
    }

    await logAudit("NOTIFICACION_SCHEDULER_EJECUTADO", null, null, {
      cuponesNotificados,
      promocionesNotificadas,
      stockNotificado,
    });

    return { cuponesNotificados, promocionesNotificadas, stockNotificado };
  }

  /**
   * Cupones que expiran en ≤ DIAS_ANTICIPACION_CUPON días.
   */
  private async notificarCuponesProximosAExpirar(): Promise<number> {
    const ahora = new Date();
    const fechaLimite = new Date(ahora);
    fechaLimite.setDate(fechaLimite.getDate() + DIAS_ANTICIPACION_CUPON);

    const cupones = await prisma.cupon.findMany({
      where: {
        estado: "ACTIVO",
        fechaFin: {
          gte: ahora,
          lte: fechaLimite,
        },
      },
      select: {
        id: true,
        codigo: true,
        fechaFin: true,
        negocioId: true,
        negocio: { select: { userId: true, nombre: true } },
      },
    });

    let count = 0;
    for (const cupon of cupones) {
      if (cupon.negocio?.userId) {
        // Idempotente: marcar en caché que ya se notificó este cupón
        const cacheKey = `notificaciones:scheduler:cupon:${cupon.id}`;
        const yaNotificado = await this.cache.get<boolean>(cacheKey);
        if (yaNotificado) continue;

        await this.notificacionService.emitir({
          tipo: "CUPON_PROXIMO_A_EXPIRAR",
          titulo: "Cupón próximo a expirar",
          mensaje: `El cupón ${cupon.codigo} expira en ${DIAS_ANTICIPACION_CUPON} días.`,
          enlace: "/negocio/cupones",
          metadata: { cuponId: cupon.id, codigo: cupon.codigo, negocioId: cupon.negocioId },
          actorId: null,
          destinatarioUserId: cupon.negocio.userId,
          claveIdempotencia: `cupon-expira:${cupon.id}`,
        } as EventoNotificacion);

        await this.cache.set(cacheKey, true, 86400 * DIAS_ANTICIPACION_CUPON + 3600);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[NotificacionScheduler] ${count} cupones notificados por expiración próxima`);
    }
    return count;
  }

  /**
   * Promociones con usosMaximos alcanzado pero estado no AGOTADA.
   */
  private async notificarPromocionesAgotadas(): Promise<number> {
    const promociones = await prisma.promocion.findMany({
      where: {
        estado: "ACTIVA",
        usosMaximos: { gt: 0 },
        usosActuales: { gte: prisma.promocion.fields.usosMaximos },
      },
      select: {
        id: true,
        nombre: true,
        negocioId: true,
        negocio: { select: { userId: true, nombre: true } },
      },
    });

    let count = 0;
    for (const promo of promociones) {
      if (promo.negocio?.userId) {
        await this.notificacionService.emitir({
          tipo: "PROMOCION_AGOTADA",
          titulo: "Promoción agotada",
          mensaje: `La promoción "${promo.nombre}" ha alcanzado su límite de usos.`,
          enlace: "/negocio/promociones",
          metadata: { promocionId: promo.id, negocioId: promo.negocioId },
          actorId: null,
          destinatarioUserId: promo.negocio.userId,
          claveIdempotencia: `promo-agotada:${promo.id}`,
        } as EventoNotificacion);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[NotificacionScheduler] ${count} promociones marcadas como agotadas`);
    }
    return count;
  }

  /**
   * Productos con stock bajo (cantidadActual < puntoReorden).
   */
  private async notificarStockBajo(): Promise<number> {
    const inventarios = await prisma.inventario.findMany({
      where: {
        cantidadActual: { gt: 0 },
        AND: [
          {
            cantidadActual: {
              lt: prisma.inventario.fields.puntoReorden,
            },
          },
          {
            puntoReorden: { gt: 0 },
          },
        ],
      },
      select: {
        id: true,
        cantidadActual: true,
        puntoReorden: true,
        producto: {
          select: {
            id: true,
            nombre: true,
            negocioId: true,
          },
        },
      },
    });

    let count = 0;
    for (const inv of inventarios) {
      if (inv.producto?.negocioId) {
        const negocio = await prisma.negocio.findUnique({
          where: { id: inv.producto.negocioId },
          select: { userId: true },
        });
        if (negocio?.userId) {
          await this.notificacionService.emitir({
            tipo: "STOCK_BAJO",
            titulo: "Stock bajo",
            mensaje: `El producto "${inv.producto.nombre}" está cerca de agotarse (stock: ${inv.cantidadActual}).`,
            enlace: "/negocio/inventario",
            metadata: {
              productoId: inv.producto.id,
              negocioId: inv.producto.negocioId,
              cantidadActual: inv.cantidadActual,
            },
            actorId: null,
            destinatarioUserId: negocio.userId,
            claveIdempotencia: `stock-bajo:${inv.producto.id}:${inv.id}`,
          } as EventoNotificacion);
          count++;
        }
      }
    }

    if (count > 0) {
      console.log(`[NotificacionScheduler] ${count} alertas de stock bajo notificadas`);
    }
    return count;
  }
}

export default NotificacionScheduler;
