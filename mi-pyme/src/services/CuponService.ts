/**
 * CuponService - business logic for coupon management and validation.
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
import {
  CODIGO_NO_ENCONTRADO,
  CODIGO_VALIDACION,
} from "@/core/constants";
import { Prisma, type EstadoCupon as PrismaEstadoCupon } from "@/generated/prisma/client";
import type { Cupon, TipoDescuento, EstadoCupon } from "@/generated/prisma/client";import type {
  CuponDTO,
  CrearCuponParams,
  ActualizarCuponParams,
  ItemCarritoParaDescuento,
  AplicarCuponResult,
  ValidarCuponResult,
} from "@/shared/descuentos.types";

function ahora(): Date {
  return new Date();
}

export class CuponService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  private toDTO(data: Cupon): CuponDTO {
    return {
      id: data.id,
      codigo: data.codigo,
      descripcion: data.descripcion,
      tipo: data.tipo as TipoDescuento,
      valor: data.valor,
      negocioId: data.negocioId,
      montoMinimo: data.montoMinimo,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      usosMaximos: data.usosMaximos,
      usosPorUsuario: data.usosPorUsuario,
      usosActuales: data.usosActuales,
      unaVezPorUsuario: data.unaVezPorUsuario,
      primeraCompra: data.primeraCompra,
      estado: data.estado as EstadoCupon,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async crearCupon(
    datos: CrearCuponParams,
    userId: string,
    rolActual?: string
  ): Promise<CuponDTO> {
    if (!datos.codigo || datos.codigo.length < 3) {
      throw new BusinessError("El código debe tener al menos 3 caracteres", CODIGO_VALIDACION, 400);
    }

    if (datos.tipo === "PORCENTAJE" || datos.tipo === "MONTO_FIJO") {
      if (datos.valor === undefined || datos.valor === null) {
        throw new BusinessError("El valor es requerido para este tipo de cupón", CODIGO_VALIDACION, 400);
      }
    }

    if (datos.fechaInicio && datos.fechaFin && datos.fechaFin <= datos.fechaInicio) {
      throw new BusinessError("La fecha de fin debe ser posterior a la fecha de inicio", CODIGO_VALIDACION, 400);
    }

    if (datos.fechaInicio && datos.fechaInicio <= ahora()) {
      throw new BusinessError("La fecha de inicio debe ser futura", "FECHA_INVALIDA", 400);
    }

    if (datos.negocioId) {
      if (rolActual !== "ADMIN") {
        await assertPertenencia(userId, datos.negocioId, rolActual);
      }
    } else {
      if (rolActual !== "ADMIN") {
        throw new BusinessError("Los cupones de plataforma requieren rol ADMIN", "NO_AUTORIZADO", 403);
      }
    }

    const existing = await prisma.cupon.findUnique({
      where: { codigo: datos.codigo },
      select: { id: true },
    });
    if (existing) {
      throw new BusinessError("El código de cupón ya existe", "DUPLICADO", 409);
    }

    const cupon = await prisma.cupon.create({
      data: {
        codigo: datos.codigo.toUpperCase(),
        descripcion: datos.descripcion ?? undefined,
        tipo: datos.tipo,
        valor: datos.valor != null ? new Prisma.Decimal(datos.valor) : undefined,
        negocioId: datos.negocioId ?? undefined,
        montoMinimo: datos.montoMinimo != null ? new Prisma.Decimal(datos.montoMinimo) : undefined,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        usosMaximos: datos.usosMaximos,
        usosPorUsuario: datos.usosPorUsuario,
        unaVezPorUsuario: datos.unaVezPorUsuario ?? false,
        primeraCompra: datos.primeraCompra ?? false,
        estado: datos.estado ?? "ACTIVO",
        creadoPorId: userId,
      },
    });

    await logAudit("CUPON_CREADO", userId, cupon.id, { negocioId: datos.negocioId ?? null });
    await this.invalidateCache();
    return this.toDTO(cupon);
  }

  async actualizarCupon(
    id: string,
    datos: ActualizarCuponParams,
    userId: string,
    rolActual?: string
  ): Promise<CuponDTO> {
    const cupon = await prisma.cupon.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!cupon) {
      throw new BusinessError("Cupón no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (cupon.negocioId) {
      if (rolActual !== "ADMIN") {
        await assertPertenencia(userId, cupon.negocioId, rolActual);
      }
    } else {
      if (rolActual !== "ADMIN") {
        throw new BusinessError("No autorizado", "NO_AUTORIZADO", 403);
      }
    }

    if (datos.fechaInicio && datos.fechaFin && datos.fechaFin <= datos.fechaInicio) {
      throw new BusinessError("La fecha de fin debe ser posterior a la fecha de inicio", CODIGO_VALIDACION, 400);
    }

    if (datos.codigo !== undefined) {
      const existing = await prisma.cupon.findFirst({
        where: { codigo: datos.codigo.toUpperCase(), NOT: { id } },
        select: { id: true },
      });
      if (existing) {
        throw new BusinessError("El código de cupón ya existe", "DUPLICADO", 409);
      }
    }

    const updated = await prisma.cupon.update({
      where: { id },
      data: {
        ...(datos.codigo && { codigo: datos.codigo.toUpperCase() }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion ?? undefined }),
        ...(datos.tipo && { tipo: datos.tipo }),
        ...(datos.valor !== undefined && { valor: datos.valor != null ? new Prisma.Decimal(datos.valor) : null }),
        ...(datos.negocioId !== undefined && { negocioId: datos.negocioId ?? undefined }),
        ...(datos.montoMinimo !== undefined && { montoMinimo: datos.montoMinimo != null ? new Prisma.Decimal(datos.montoMinimo) : null }),
        ...(datos.fechaInicio !== undefined && { fechaInicio: datos.fechaInicio }),
        ...(datos.fechaFin !== undefined && { fechaFin: datos.fechaFin }),
        ...(datos.usosMaximos !== undefined && { usosMaximos: datos.usosMaximos }),
        ...(datos.usosPorUsuario !== undefined && { usosPorUsuario: datos.usosPorUsuario }),
        ...(datos.unaVezPorUsuario !== undefined && { unaVezPorUsuario: datos.unaVezPorUsuario }),
        ...(datos.primeraCompra !== undefined && { primeraCompra: datos.primeraCompra }),
        ...(datos.estado && { estado: datos.estado }),
      },
    });

    await logAudit("CUPON_ACTUALIZADO", userId, id, {});
    await this.invalidateCache();
    return this.toDTO(updated);
  }

  async eliminarCupon(id: string, userId: string, rolActual?: string): Promise<void> {
    const cupon = await prisma.cupon.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!cupon) {
      throw new BusinessError("Cupón no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (cupon.negocioId) {
      if (rolActual !== "ADMIN") {
        await assertPertenencia(userId, cupon.negocioId, rolActual);
      }
    } else {
      if (rolActual !== "ADMIN") {
        throw new BusinessError("No autorizado", "NO_AUTORIZADO", 403);
      }
    }

    await prisma.cupon.delete({ where: { id } });
    await logAudit("CUPON_ELIMINADO", userId, id, {});
    await this.invalidateCache();
  }

  async validarCupon(
    codigo: string,
    userId: string,
    items: ItemCarritoParaDescuento[]
  ): Promise<ValidarCuponResult> {
    const cupon = await prisma.cupon.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });

    if (!cupon) {
      return { valido: false, errores: ["Código de cupón inválido"] };
    }

    const dto = this.toDTO(cupon);
    const errores: string[] = [];

    if (dto.estado !== "ACTIVO") {
      errores.push("Este cupón no está disponible");
    }

    const ahora_ = new Date();
    if (dto.fechaInicio && ahora_ < dto.fechaInicio) {
      errores.push("El cupón aún no está vigente");
    }
    if (dto.fechaFin && ahora_ > dto.fechaFin) {
      errores.push("El cupón ha expirado");
    }

    if (dto.usosMaximos !== null && dto.usosMaximos !== undefined && dto.usosActuales >= dto.usosMaximos) {
      errores.push("El cupón ha alcanzado su límite de usos");
    }

    if (dto.unaVezPorUsuario) {
      const usosUsuario = await prisma.cuponUso.count({
        where: { cuponId: dto.id, userId },
      });
      if (usosUsuario > 0) {
        errores.push("Este cupón solo puede usarse una vez por usuario");
      }
    }

    if (dto.usosPorUsuario) {
      const usosUsuario = await prisma.cuponUso.count({
        where: { cuponId: dto.id, userId },
      });
      if (usosUsuario >= dto.usosPorUsuario) {
        errores.push("Has alcanzado el límite de usos para este cupón");
      }
    }

    if (dto.primeraCompra) {
      const pedidosUsuario = await prisma.pedido.count({
        where: { usuarioId: userId },
      });
      if (pedidosUsuario > 0) {
        errores.push("Este cupón es solo para primera compra");
      }
    }

    if (dto.montoMinimo) {
      let subtotal = 0;
      if (dto.negocioId) {
        subtotal = items
          .filter((i) => i.negocioId === dto.negocioId)
          .reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);
      } else {
        subtotal = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);
      }
      if (subtotal < Number(dto.montoMinimo)) {
        errores.push(`El monto mínimo es ${Number(dto.montoMinimo).toFixed(2)}`);
      }
    }

    return {
      valido: errores.length === 0,
      cupon: dto,
      errores,
    };
  }

  /**
   * Calcula el descuento del cupón sobre los items del carrito.
   * El descuento se reparte proporcionalmente por negocio.
   */
  aplicarDescuento(
    cupon: CuponDTO,
    items: ItemCarritoParaDescuento[]
  ): AplicarCuponResult {
    const valor = Number(cupon.valor ?? 0);

    let subtotalAplicable = 0;
    let itemsAplicables: ItemCarritoParaDescuento[] = [];

    if (cupon.negocioId) {
      itemsAplicables = items.filter((i) => i.negocioId === cupon.negocioId);
      subtotalAplicable = itemsAplicables.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);
    } else {
      itemsAplicables = items;
      subtotalAplicable = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);
    }

    if (subtotalAplicable <= 0) {
      return { descuentoTotal: 0, detalle: [] };
    }

    let descuentoTotal = 0;

    if (cupon.tipo === "PORCENTAJE") {
      descuentoTotal = (subtotalAplicable * valor) / 100;
    } else if (cupon.tipo === "MONTO_FIJO") {
      descuentoTotal = Math.min(valor, subtotalAplicable);
    }

    descuentoTotal = Math.min(descuentoTotal, subtotalAplicable);

    const detalle: AplicarCuponResult["detalle"] = [];

    if (descuentoTotal > 0) {
      const negociosMap = new Map<string, number>();
      for (const item of itemsAplicables) {
        const itemTotal = item.precioUnitario * item.cantidad;
        negociosMap.set(item.negocioId, (negociosMap.get(item.negocioId) ?? 0) + itemTotal);
      }

      let descuentoRestante = descuentoTotal;
      const negocios = Array.from(negociosMap.entries());

      for (let i = 0; i < negocios.length; i++) {
        const [negocioId, subtotalNegocio] = negocios[i];
        if (i === negocios.length - 1) {
          detalle.push({ negocioId, descuento: descuentoRestante });
        } else {
          const descuentoProporcional = (descuentoTotal * subtotalNegocio) / subtotalAplicable;
          detalle.push({ negocioId, descuento: descuentoProporcional });
          descuentoRestante -= descuentoProporcional;
        }
      }
    }

    return { descuentoTotal, detalle };
  }

  /**
   * Registra el uso de un cupón (llamado desde confirmarCheckout).
   */
  async registrarUso(
    cuponId: string,
    userId: string,
    pedidoId: string,
    descuento: number
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.cupon.update({
        where: { id: cuponId },
        data: { usosActuales: { increment: 1 } },
      });

      await tx.cuponUso.create({
        data: {
          cuponId,
          userId,
          pedidoId,
          descuento: new Prisma.Decimal(descuento),
        },
      });
    });

    await logAudit("CUPON_APLICADO", userId, cuponId, { pedidoId, descuento });
    await this.invalidateCache();
  }

  async listCupones(
    negocioId?: string,
    filtros?: { estado?: string; search?: string }
  ): Promise<CuponDTO[]> {
    const cacheKey = cacheKeys.descuentos.cupones(negocioId, filtros);
    const cached = await this.cache.get<CuponDTO[]>(cacheKey);
    if (cached) return cached;

    const where: Prisma.CuponWhereInput = {};
    if (negocioId) where.negocioId = negocioId;
    else where.negocioId = null;
    if (filtros?.estado) where.estado = filtros.estado as PrismaEstadoCupon;
    if (filtros?.search) {
      where.OR = [
        { codigo: { contains: filtros.search } },
        { descripcion: { contains: filtros.search } },
      ];
    }

    const cupones = await prisma.cupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const result = cupones.map((c) => this.toDTO(c));
    await this.cache.set(cacheKey, result, cacheTTL.descuentos);
    return result;
  }

  async getPorCodigo(codigo: string): Promise<CuponDTO> {
    const cacheKey = cacheKeys.descuentos.cupon(codigo);
    const cached = await this.cache.get<CuponDTO>(cacheKey);
    if (cached) return cached;

    const cupon = await prisma.cupon.findUnique({ where: { codigo: codigo.toUpperCase() } });
    if (!cupon) {
      throw new BusinessError("Cupón no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    const dto = this.toDTO(cupon);
    await this.cache.set(cacheKey, dto, cacheTTL.descuentos);
    return dto;
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.invalidatePrefix(cachePrefixes.descuentos);
  }
}

export default CuponService;
