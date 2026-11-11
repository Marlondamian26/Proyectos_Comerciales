/**
 * PromocionService - business logic for negocio promotions (automatic discounts).
 *
 * Framework-agnostic. No Next.js imports.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache } from "@/infrastructure";
import { cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { assertPertenencia } from "./utils/permisos";
import { logAudit } from "./utils/audit";
import { CODIGO_NO_ENCONTRADO, CODIGO_VALIDACION, CODIGO_FECHA_INVALIDA } from "@/core/constants";
import { Prisma, type EstadoPromocion } from "@/generated/prisma/client";
import type {
  PromocionDTO,
  CrearPromocionParams,
  ActualizarPromocionParams,
  ItemCarritoParaDescuento,
  DescuentoItem,
} from "@/shared/descuentos.types";
import type { TipoDescuento } from "@/generated/prisma/client";

function parseIdArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function ahora(): Date {
  return new Date();
}

export class PromocionService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  private toDTO(data: Awaited<ReturnType<typeof prisma.promocion.findFirst>>): PromocionDTO {
    if (!data) throw new BusinessError("Promoción no encontrada", CODIGO_NO_ENCONTRADO, 404);
    return {
      id: data.id,
      negocioId: data.negocioId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: data.tipo as TipoDescuento,
      valor: data.valor,
      productoIds: parseIdArray(data.productoIds),
      servicioIds: parseIdArray(data.servicioIds),
      subareaIds: parseIdArray(data.subareaIds),
      montoMinimo: data.montoMinimo,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      usosMaximos: data.usosMaximos,
      usosPorUsuario: data.usosPorUsuario,
      usosActuales: data.usosActuales,
      exclusiva: data.exclusiva,
      estado: data.estado,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async crearPromocion(
    negocioId: string,
    datos: CrearPromocionParams,
    userId: string,
    rolActual?: string
  ): Promise<PromocionDTO> {
    if (rolActual !== "ADMIN") {
      await assertPertenencia(userId, negocioId, rolActual);
    }

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true },
    });
    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (!datos.nombre || datos.nombre.trim().length === 0) {
      throw new BusinessError("El nombre es requerido", CODIGO_VALIDACION, 400);
    }

    if (datos.tipo === "PORCENTAJE" || datos.tipo === "MONTO_FIJO") {
      if (datos.valor === undefined || datos.valor === null) {
        throw new BusinessError("El valor es requerido para este tipo de promoción", CODIGO_VALIDACION, 400);
      }
    }

    if (datos.fechaInicio && datos.fechaFin) {
      if (datos.fechaFin <= datos.fechaInicio) {
        throw new BusinessError("La fecha de fin debe ser posterior a la fecha de inicio", CODIGO_VALIDACION, 400);
      }
    }

    if (datos.fechaInicio && datos.fechaInicio <= ahora()) {
      throw new BusinessError("La fecha de inicio debe ser futura", CODIGO_FECHA_INVALIDA, 400);
    }

    const promocion = await prisma.promocion.create({
      data: {
        negocioId,
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? undefined,
        tipo: datos.tipo,
        valor: datos.valor != null ? new Prisma.Decimal(datos.valor) : undefined,
        productoIds: JSON.stringify(datos.productoIds ?? []),
        servicioIds: JSON.stringify(datos.servicioIds ?? []),
        subareaIds: JSON.stringify(datos.subareaIds ?? []),
        montoMinimo: datos.montoMinimo != null ? new Prisma.Decimal(datos.montoMinimo) : undefined,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        usosMaximos: datos.usosMaximos,
        usosPorUsuario: datos.usosPorUsuario,
        exclusiva: datos.exclusiva ?? false,
        estado: datos.estado ?? "ACTIVA",
        creadaPorId: userId,
      },
    });

    await logAudit("PROMOCION_CREADA", userId, promocion.id, { negocioId });
    await this.invalidateCacheCache();
    return this.toDTO(promocion);
  }

  async actualizarPromocion(
    id: string,
    datos: ActualizarPromocionParams,
    userId: string,
    rolActual?: string
  ): Promise<PromocionDTO> {
    const promocion = await prisma.promocion.findUnique({
      where: { id },
      select: { negocioId: true, estado: true },
    });

    if (!promocion) {
      throw new BusinessError("Promoción no encontrada", CODIGO_NO_ENCONTRADO, 404);
    }

    if (rolActual !== "ADMIN") {
      await assertPertenencia(userId, promocion.negocioId, rolActual);
    }

    if (datos.fechaInicio && datos.fechaFin && datos.fechaFin <= datos.fechaInicio) {
      throw new BusinessError("La fecha de fin debe ser posterior a la fecha de inicio", CODIGO_VALIDACION, 400);
    }

    const updated = await prisma.promocion.update({
      where: { id },
      data: {
        ...(datos.nombre && { nombre: datos.nombre }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion ?? undefined }),
        ...(datos.tipo && { tipo: datos.tipo }),
        ...(datos.valor !== undefined && { valor: datos.valor != null ? new Prisma.Decimal(datos.valor) : null }),
        ...(datos.productoIds && { productoIds: JSON.stringify(datos.productoIds) }),
        ...(datos.servicioIds && { servicioIds: JSON.stringify(datos.servicioIds) }),
        ...(datos.subareaIds && { subareaIds: JSON.stringify(datos.subareaIds) }),
        ...(datos.montoMinimo !== undefined && { montoMinimo: datos.montoMinimo != null ? new Prisma.Decimal(datos.montoMinimo) : null }),
        ...(datos.fechaInicio !== undefined && { fechaInicio: datos.fechaInicio }),
        ...(datos.fechaFin !== undefined && { fechaFin: datos.fechaFin }),
        ...(datos.usosMaximos !== undefined && { usosMaximos: datos.usosMaximos }),
        ...(datos.usosPorUsuario !== undefined && { usosPorUsuario: datos.usosPorUsuario }),
        ...(datos.exclusiva !== undefined && { exclusiva: datos.exclusiva }),
        ...(datos.estado && { estado: datos.estado }),
      },
    });

    await logAudit("PROMOCION_ACTUALIZADA", userId, id, {});
    await this.invalidateCacheCache();
    return this.toDTO(updated);
  }

  async eliminarPromocion(id: string, userId: string, rolActual?: string): Promise<void> {
    const promocion = await prisma.promocion.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!promocion) {
      throw new BusinessError("Promoción no encontrada", CODIGO_NO_ENCONTRADO, 404);
    }

    if (rolActual !== "ADMIN") {
      await assertPertenencia(userId, promocion.negocioId, rolActual);
    }

    await prisma.promocion.delete({ where: { id } });
    await logAudit("PROMOCION_ELIMINADA", userId, id, {});
    await this.invalidateCacheCache();
  }

  async pausarPromocion(id: string, userId: string, rolActual?: string): Promise<PromocionDTO> {
    const promocion = await prisma.promocion.findUnique({
      where: { id },
      select: { negocioId: true, estado: true },
    });

    if (!promocion) {
      throw new BusinessError("Promoción no encontrada", CODIGO_NO_ENCONTRADO, 404);
    }

    if (rolActual !== "ADMIN") {
      await assertPertenencia(userId, promocion.negocioId, rolActual);
    }

    const updated = await prisma.promocion.update({
      where: { id },
      data: { estado: "PAUSADA" },
    });

    await logAudit("PROMOCION_PAUSADA", userId, id, {});
    await this.invalidateCacheCache();
    return this.toDTO(updated);
  }

  async reactivarPromocion(id: string, userId: string, rolActual?: string): Promise<PromocionDTO> {
    const promocion = await prisma.promocion.findUnique({
      where: { id },
      select: { negocioId: true, fechaFin: true },
    });

    if (!promocion) {
      throw new BusinessError("Promoción no encontrada", CODIGO_NO_ENCONTRADO, 404);
    }

    if (rolActual !== "ADMIN") {
      await assertPertenencia(userId, promocion.negocioId, rolActual);
    }

    if (ahora() > (promocion.fechaFin ?? ahora())) {
      throw new BusinessError("La promoción está expirada", CODIGO_VALIDACION, 400);
    }

    const updated = await prisma.promocion.update({
      where: { id },
      data: { estado: "ACTIVA" },
    });

    await logAudit("PROMOCION_REACTIVADA", userId, id, {});
    await this.invalidateCacheCache();
    return this.toDTO(updated);
  }

  async listPromociones(
    negocioId?: string,
    filtros?: { estado?: string; search?: string }
  ): Promise<PromocionDTO[]> {
    const cacheKey = cacheKeys.descuentos.promociones(negocioId, filtros);
    const cached = await this.cache.get<PromocionDTO[]>(cacheKey);
    if (cached) return cached;

    const where: Prisma.PromocionWhereInput = {};
    if (negocioId) where.negocioId = negocioId;
    if (filtros?.estado) where.estado = filtros.estado as EstadoPromocion;
    if (filtros?.search) {
      where.OR = [
        { nombre: { contains: filtros.search } },
        { descripcion: { contains: filtros.search } },
      ];
    }

    const promociones = await prisma.promocion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const result = promociones.map((p) => this.toDTO(p));
    await this.cache.set(cacheKey, result, cacheTTL.catalogo);
    return result;
  }

  async getPromocion(id: string): Promise<PromocionDTO> {
    const cacheKey = cacheKeys.descuentos.promocion(id);
    const cached = await this.cache.get<PromocionDTO>(cacheKey);
    if (cached) return cached;

    const promocion = await prisma.promocion.findUnique({ where: { id } });
    if (!promocion) {
      throw new BusinessError("Promoción no encontrada", CODIGO_NO_ENCONTRADO, 404);
    }

    const dto = this.toDTO(promocion);
    await this.cache.set(cacheKey, dto, cacheTTL.catalogo);
    return dto;
  }

  /**
   * Devuelve las promociones que aplican al carrito de un negocio.
   * Filtra por vigencia, estado, usos máximos, y condiciones de items.
   */
  async listPromocionesAplicables(
    negocioId: string,
    items: ItemCarritoParaDescuento[],
    userId?: string
  ): Promise<PromocionDTO[]> {
    const ahora = new Date();
    const promociones = await prisma.promocion.findMany({
      where: {
        negocioId,
        estado: "ACTIVA",
        OR: [
          { fechaInicio: null },
          { fechaInicio: { lte: ahora } },
        ],
        AND: [
          {
            OR: [
              { fechaFin: null },
              { fechaFin: { gte: ahora } },
            ],
          },
        ],
      },
    });

    const result: PromocionDTO[] = [];

    for (const p of promociones) {
      if (p.usosMaximos !== null && p.usosActuales >= p.usosMaximos) {
        continue;
      }

      if (userId && p.usosPorUsuario) {
        const usosUsuario = await prisma.promocionUso.count({
          where: { promocionId: p.id, userId },
        });
        if (usosUsuario >= p.usosPorUsuario) continue;
      }

      const dto = this.toDTO(p);

      if (!this.cumpleCondiciones(dto, items)) continue;

      result.push(dto);
    }

    return result;
  }

  /**
   * Verifica si una promoción aplica a los items del carrito.
   */
  private cumpleCondiciones(promocion: PromocionDTO, items: ItemCarritoParaDescuento[]): boolean {
    const itemsNegocio = items.filter((i) => i.negocioId === promocion.negocioId);

    // Condición de monto mínimo
    if (promocion.montoMinimo) {
      const subtotal = itemsNegocio.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);
      if (subtotal < Number(promocion.montoMinimo)) return false;
    }

    // Si no hay items del negocio, no aplica (excepto ENVIO_GRATIS)
    if (promocion.tipo === "ENVIO_GRATIS") {
      return itemsNegocio.length > 0;
    }

    if (itemsNegocio.length === 0) return false;

    const productosIds = parseIdArray(promocion.productoIds);
    const serviciosIds = parseIdArray(promocion.servicioIds);
    const subareasIds = parseIdArray(promocion.subareaIds);

    // Si tiene condiciones específicas, verificar que al menos un item cumple
    if (productosIds.length > 0) {
      return itemsNegocio.some((i) => i.productoId && productosIds.includes(i.productoId));
    }
    if (serviciosIds.length > 0) {
      return itemsNegocio.some((i) => i.servicioId && serviciosIds.includes(i.servicioId));
    }
    if (subareasIds.length > 0) {
      return itemsNegocio.some((i) => {
        if (i.producto?.negocioId) return false;
         const subareaId = i.producto?.subareaId;
        return subareaId && subareasIds.includes(subareaId);
      });
    }

    // Sin condiciones específicas: aplica a todos los items del negocio
    return true;
  }

  /**
   * Calcula el descuento que aplica una promoción a un conjunto de items.
   * Devuelve el descuento por item y el total.
   */
  calcularDescuento(
    promocion: PromocionDTO,
    items: ItemCarritoParaDescuento[]
  ): DescuentoItem[] {
    const productosIds = parseIdArray(promocion.productoIds);
    const serviciosIds = parseIdArray(promocion.servicioIds);
    const subareasIds = parseIdArray(promocion.subareaIds);

    // Determinar qué items califican
    const itemsCalifican = items.filter((i) => {
      if (i.negocioId !== promocion.negocioId) return false;

      if (promocion.tipo === "ENVIO_GRATIS") return true;

      if (productosIds.length > 0) {
        return i.productoId && productosIds.includes(i.productoId);
      }
      if (serviciosIds.length > 0) {
        return i.servicioId && serviciosIds.includes(i.servicioId);
      }
      if (subareasIds.length > 0) {
        const subareaId = i.producto?.subareaId ?? i.servicio?.subareaId;
        return Boolean(subareaId) && subareasIds.includes(subareaId!);
      }
      return true;
    });

    if (itemsCalifican.length === 0) return [];

    const resultado: DescuentoItem[] = [];

    if (promocion.tipo === "DOS_POR_UNO") {
      // 2x1: por cada par, el más barato es gratis
      const sorted = [...itemsCalifican].sort((a, b) => a.precioUnitario - b.precioUnitario);
      const pares = Math.floor(sorted.length / 2);
      const idx = sorted.length - 1;

      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        const precio = item.precioUnitario;
        const cantidad = item.cantidad;
        let descuento = 0;

        // Por cada par (2 items), el segundo es gratis
        if (cantidad >= 2) {
          const paresEnItem = Math.floor(cantidad / 2);
          descuento = precio * paresEnItem;
        }

        resultado.push({
          id: item.id,
          productoId: item.productoId,
          servicioId: item.servicioId,
          cantidad,
          precioOriginal: precio * cantidad,
          precioConDescuento: precio * cantidad - descuento,
          descuento,
        });
      }

      void pares;
      void idx;
      return resultado;
    }

    if (promocion.tipo === "ENVIO_GRATIS") {
      return itemsCalifican.map((i) => ({
        id: i.id,
        productoId: i.productoId,
        servicioId: i.servicioId,
        cantidad: i.cantidad,
        precioOriginal: i.precioUnitario * i.cantidad,
        precioConDescuento: i.precioUnitario * i.cantidad,
        descuento: 0,
      }));
    }

    // PORCENTAJE y MONTO_FIJO
    const valor = Number(promocion.valor ?? 0);

    for (const item of itemsCalifican) {
      const precioTotal = item.precioUnitario * item.cantidad;
      let descuento = 0;

      if (promocion.tipo === "PORCENTAJE") {
        descuento = (precioTotal * valor) / 100;
      } else if (promocion.tipo === "MONTO_FIJO") {
        descuento = Math.min(valor, precioTotal);
      }

      descuento = Math.min(descuento, precioTotal);

      resultado.push({
        id: item.id,
        productoId: item.productoId,
        servicioId: item.servicioId,
        cantidad: item.cantidad,
        precioOriginal: precioTotal,
        precioConDescuento: precioTotal - descuento,
        descuento,
      });
    }

    return resultado;
  }

  private async invalidateCacheCache(): Promise<void> {
    await this.cache.invalidatePrefix(cachePrefixes.descuentos);
  }
}

export default PromocionService;
