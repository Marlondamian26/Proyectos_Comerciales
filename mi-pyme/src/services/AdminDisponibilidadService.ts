/**
 * AdminDisponibilidadService - gestor de disponibilidad diaria para NEGOCIO/ADMIN.
 *
 * Permite setear, bulkificar y eliminar la oferta diaria de un producto.
 * Los controles de rol/ownership se manejan en la capa de Server Actions /
 * API Routes (este servicio asume que el caller está autorizado).
 *
 * Framework-agnostic: no Next.js imports.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  normalizarFecha,
  fechaHoy,
} from "@/shared/utils/fecha";
import { CODIGO_FECHA_INVALIDA } from "@/core/constants";
import { DisponibilidadService } from "./DisponibilidadService";

export class AdminDisponibilidadService extends Service {
  private dispService: DisponibilidadService;

  constructor(cache?: ICache) {
    super();
    this.dispService = new DisponibilidadService(cache);
  }

  /** Verifica que el usuario dueño del negocio del producto coincida. */
  private async assertOwner(
    productoId: string,
    usuarioId: string
  ): Promise<void> {
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      select: { negocio: { select: { userId: true } } },
    });

    if (!producto) {
      throw new BusinessError(
        "Producto no encontrado",
        "NOT_FOUND",
        404
      );
    }

    const negocioUserId = producto.negocio.userId;
    if (!negocioUserId || negocioUserId !== usuarioId) {
      throw new BusinessError(
        "No permitido: el producto no pertenece a tu negocio",
        "FORBIDDEN",
        403
      );
    }
  }

  async setDisponibilidad(
    productoId: string,
    fecha: Date | string | number,
    cantidad: number,
    notas?: string
  ): Promise<void> {
    const fechaNorm = normalizarFecha(fecha);

    if (fechaNorm.getTime() < fechaHoy().getTime()) {
      throw new BusinessError(
        "No se puede establecer disponibilidad para fechas pasadas",
        CODIGO_FECHA_INVALIDA,
        400
      );
    }

    if (!Number.isFinite(cantidad) || cantidad < 0) {
      throw new BusinessError(
        "La cantidad debe ser un número entero positivo",
        "VALIDATION_ERROR",
        422
      );
    }

    await prisma.disponibilidadProducto.upsert({
      where: {
        productoId_fecha: {
          productoId,
          fecha: fechaNorm,
        },
      },
      create: {
        productoId,
        fecha: fechaNorm,
        cantidad,
        notas,
      },
      update: {
        cantidad,
        notas,
      },
    });

    await this.dispService.invalidateProductoCache(productoId, fechaNorm);
  }

  /**
    * Aplica la misma cantidad a varios días. Idempotente: upsert por día.
   */
  async bulkSetDisponibilidad(
    productoId: string,
    fechas: Array<Date | string | number>,
    cantidad: number
  ): Promise<number> {
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      throw new BusinessError(
        "La cantidad debe ser un número entero positivo",
        "VALIDATION_ERROR",
        422
      );
    }

    const fechasNorm = fechas.map((f) => normalizarFecha(f));

    let creados = 0;
    let actualizados = 0;

    await prisma.$transaction(async (tx) => {
      for (const fechaNorm of fechasNorm) {
        const result = await tx.disponibilidadProducto.upsert({
          where: {
            productoId_fecha: {
              productoId,
              fecha: fechaNorm,
            },
          },
          create: {
            productoId,
            fecha: fechaNorm,
            cantidad,
          },
          update: {
            cantidad,
          },
        });
        if (result) {
          actualizados += 1;
        } else {
          creados += 1;
        }
      }
    });

    await this.dispService.invalidateProductoCache(productoId);

     return creados + actualizados;
  }

  async eliminarDisponibilidad(
    productoId: string,
    fecha: Date | string | number
  ): Promise<void> {
    const fechaNorm = normalizarFecha(fecha);

    await prisma.disponibilidadProducto.deleteMany({
      where: {
        productoId,
        fecha: fechaNorm,
      },
    });

    await this.dispService.invalidateProductoCache(productoId, fechaNorm);
  }

  async listarDisponibilidad(
    productoId: string,
    desde?: Date | string | number,
    hasta?: Date | string | number
  ) {
    const where: Record<string, unknown> = { productoId };
    const desdeNorm = desde ? normalizarFecha(desde) : undefined;
    const hastaNorm = hasta ? normalizarFecha(hasta) : undefined;

    if (desdeNorm) {
      where.fecha = { gte: desdeNorm };
    }
    if (hastaNorm) {
      where.fecha = {
        ...(where.fecha ?? {}),
        lte: hastaNorm,
      };
    }

    return prisma.disponibilidadProducto.findMany({
      where,
      orderBy: { fecha: "asc" },
    });
  }

  /**
   * Versión para ser usada desde Server Actions: valida ownership del
   * negocio antes de delegar en `setDisponibilidad`.
   */
  async setDisponibilidadAutorizado(
    usuarioId: string,
    productoId: string,
    fecha: Date | string | number,
    cantidad: number,
    notas?: string
  ): Promise<void> {
    await this.assertOwner(productoId, usuarioId);
    await this.setDisponibilidad(productoId, fecha, cantidad, notas);
  }

  async bulkSetDisponibilidadAutorizado(
    usuarioId: string,
    productoId: string,
    fechas: Array<Date | string | number>,
    cantidad: number
  ): Promise<number> {
    await this.assertOwner(productoId, usuarioId);
    return this.bulkSetDisponibilidad(productoId, fechas, cantidad);
  }

  async eliminarDisponibilidadAutorizado(
    usuarioId: string,
    productoId: string,
    fecha: Date | string | number
  ): Promise<void> {
    await this.assertOwner(productoId, usuarioId);
    await this.eliminarDisponibilidad(productoId, fecha);
  }
}

export default AdminDisponibilidadService;
