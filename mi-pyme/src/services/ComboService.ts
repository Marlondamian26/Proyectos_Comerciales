/**
 * ComboService - business logic for combo management and decomposition.
 *
 * Combos are virtual products that group items (can cross multiple negocios).
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
import { CODIGO_NO_ENCONTRADO, CODIGO_VALIDACION } from "@/core/constants";
import { Prisma } from "@/generated/prisma/client";
import type {
  ComboDTO,
  ComboItemDTO,
  CrearComboParams,
  ActualizarComboParams,
} from "@/shared/descuentos.types";
import type { Combo } from "@/generated/prisma/client";

function ahora(): Date {
  return new Date();
}

interface ComboItemRecord {
  id: string;
  comboId: string;
  productoId: string | null;
  servicioId: string | null;
  cantidad: number;
}

export class ComboService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  private toItemDTO(data: {
    id: string;
    comboId: string;
    productoId: string | null;
    servicioId: string | null;
    cantidad: number;
  }): ComboItemDTO {
    return {
      id: data.id,
      comboId: data.comboId,
      productoId: data.productoId,
      servicioId: data.servicioId,
      cantidad: data.cantidad,
    };
  }

  private toDTO(data: Combo & { items?: ComboItemRecord[] }): ComboDTO {
    return {
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      imagen: data.imagen,
      precio: data.precio,
      negocioId: data.negocioId,
      activo: data.activo,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      usosMaximos: data.usosMaximos,
      usosActuales: data.usosActuales,
      items: (data.items ?? []).map((i) => this.toItemDTO(i)),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async crearCombo(
    datos: CrearComboParams,
    userId: string,
    rolActual?: string
  ): Promise<ComboDTO> {
    if (!datos.nombre || datos.nombre.trim().length === 0) {
      throw new BusinessError("El nombre es requerido", CODIGO_VALIDACION, 400);
    }

    if (!datos.items || datos.items.length === 0) {
      throw new BusinessError("El combo debe tener al menos un item", CODIGO_VALIDACION, 400);
    }

    datos.items.forEach((item, idx) => {
      if (!item.productoId && !item.servicioId) {
        throw new BusinessError(
          `El item ${idx + 1} debe tener productoId o servicioId`,
          CODIGO_VALIDACION,
          400
        );
      }
      if (item.cantidad < 1) {
        throw new BusinessError("La cantidad debe ser al menos 1", CODIGO_VALIDACION, 400);
      }
    });

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
        throw new BusinessError("Los combos de plataforma requieren rol ADMIN", "NO_AUTORIZADO", 403);
      }
    }

    const combo = await prisma.combo.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? undefined,
        imagen: datos.imagen,
        precio: new Prisma.Decimal(datos.precio),
        negocioId: datos.negocioId,
        activo: datos.activo ?? true,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        usosMaximos: datos.usosMaximos,
        creadoPorId: userId,
        items: {
          create: datos.items.map((i) => ({
            productoId: i.productoId,
            servicioId: i.servicioId,
            cantidad: i.cantidad,
          })),
        },
      },
      include: { items: true },
    });

    await logAudit("COMBO_CREADO", userId, combo.id, { negocioId: datos.negocioId ?? null });
    await this.invalidateCache();
    return this.toDTO(combo);
  }

  async actualizarCombo(
    id: string,
    datos: ActualizarComboParams,
    userId: string,
    rolActual?: string
  ): Promise<ComboDTO> {
    const combo = await prisma.combo.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!combo) {
      throw new BusinessError("Combo no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (combo.negocioId) {
      if (rolActual !== "ADMIN") {
        await assertPertenencia(userId, combo.negocioId, rolActual);
      }
    } else {
      if (rolActual !== "ADMIN") {
        throw new BusinessError("No autorizado", "NO_AUTORIZADO", 403);
      }
    }

    if (datos.fechaInicio && datos.fechaFin && datos.fechaFin <= datos.fechaInicio) {
      throw new BusinessError("La fecha de fin debe ser posterior a la fecha de inicio", CODIGO_VALIDACION, 400);
    }

    const updateData: Record<string, unknown> = {
      ...(datos.nombre && { nombre: datos.nombre }),
      ...(datos.descripcion !== undefined && { descripcion: datos.descripcion ?? undefined }),
      ...(datos.imagen !== undefined && { imagen: datos.imagen ?? undefined }),
      ...(datos.precio !== undefined && { precio: new Prisma.Decimal(datos.precio) }),
      ...(datos.negocioId !== undefined && { negocioId: datos.negocioId ?? undefined }),
      ...(datos.activo !== undefined && { activo: datos.activo }),
      ...(datos.fechaInicio !== undefined && { fechaInicio: datos.fechaInicio }),
      ...(datos.fechaFin !== undefined && { fechaFin: datos.fechaFin }),
      ...(datos.usosMaximos !== undefined && { usosMaximos: datos.usosMaximos }),
    };

    if (datos.items) {
      const itemsABorrar = combo.items
        .filter((ci) => !datos.items!.some((i) => i.id && i.id === ci.id))
        .map((ci) => ci.id);

      await prisma.comboItem.deleteMany({ where: { id: { in: itemsABorrar } } });

      for (const item of datos.items) {
        if (item.id) {
          await prisma.comboItem.update({
            where: { id: item.id },
            data: {
              productoId: item.productoId ?? undefined,
              servicioId: item.servicioId ?? undefined,
              cantidad: item.cantidad,
            },
          });
        } else {
          await prisma.comboItem.create({
            data: {
              comboId: id,
              productoId: item.productoId,
              servicioId: item.servicioId,
              cantidad: item.cantidad,
            },
          });
        }
      }
    }

    const updated = await prisma.combo.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    await logAudit("COMBO_ACTUALIZADO", userId, id, {});
    await this.invalidateCache();
    return this.toDTO(updated);
  }

  async eliminarCombo(id: string, userId: string, rolActual?: string): Promise<void> {
    const combo = await prisma.combo.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!combo) {
      throw new BusinessError("Combo no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (combo.negocioId) {
      if (rolActual !== "ADMIN") {
        await assertPertenencia(userId, combo.negocioId, rolActual);
      }
    } else {
      if (rolActual !== "ADMIN") {
        throw new BusinessError("No autorizado", "NO_AUTORIZADO", 403);
      }
    }

    await prisma.combo.delete({ where: { id } });
    await logAudit("COMBO_ELIMINADO", userId, id, {});
    await this.invalidateCache();
  }

  async listCombos(filtros?: {
    negocioId?: string;
    activo?: boolean;
    search?: string;
  }): Promise<ComboDTO[]> {
    const cacheKey = cacheKeys.descuentos.combos(filtros);
    const cached = await this.cache.get<ComboDTO[]>(cacheKey);
    if (cached) return cached;
    const where: {
      negocioId?: string;
      activo?: boolean;
      OR?: Array<Record<string, unknown>>;
      AND?: Array<Record<string, unknown>>;
    } = {};

    if (filtros?.negocioId !== undefined) where.negocioId = filtros.negocioId;
    if (filtros?.activo !== undefined) where.activo = filtros.activo;
    if (filtros?.search) {
      where.OR = [
        { nombre: { contains: filtros.search } },
        { descripcion: { contains: filtros.search } },
      ];
    }

    const ahora_ = new Date();
    where.OR = where.OR ?? [];
    where.OR.push({ fechaInicio: null });
    where.AND = [
      { fechaFin: null },
      {
        OR: [
          { fechaFin: null },
          { fechaFin: { gte: ahora_ } },
        ],
      },
    ];

    const combos = await prisma.combo.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const result = combos.map((c) => this.toDTO(c));
    await this.cache.set(cacheKey, result, cacheTTL.descuentos);
    return result;
  }

  async getCombo(id: string): Promise<ComboDTO> {
    const cacheKey = cacheKeys.descuentos.combo(id);
    const cached = await this.cache.get<ComboDTO>(cacheKey);
    if (cached) return cached;

    const combo = await prisma.combo.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!combo) {
      throw new BusinessError("Combo no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    const dto = this.toDTO(combo);

    const ahora_ = new Date();
    if (dto.fechaInicio && ahora_ < dto.fechaInicio) {
      throw new BusinessError("El combo aún no está disponible", "COMBO_NO_DISPONIBLE", 400);
    }
    if (dto.fechaFin && ahora_ > dto.fechaFin) {
      throw new BusinessError("El combo ha expirado", "COMBO_NO_DISPONIBLE", 400);
    }
    if (!dto.activo) {
      throw new BusinessError("El combo no está disponible", "COMBO_NO_DISPONIBLE", 400);
    }

    await this.cache.set(cacheKey, dto, cacheTTL.descuentos);
    return dto;
  }

  /**
   * Valida que todos los items de un combo estén disponibles.
   * Devuelve true si está disponible, false o lanza error si no.
   */
  async validarCombo(comboId: string): Promise<boolean> {
    const combo = await this.getCombo(comboId);

    if (combo.usosMaximos !== null && combo.usosMaximos !== undefined && combo.usosActuales >= combo.usosMaximos) {
      return false;
    }

    for (const item of combo.items) {
      if (item.productoId) {
        const producto = await prisma.producto.findUnique({
          where: { id: item.productoId },
          select: { activo: true, disponibleHoy: true },
        });
        if (!producto || !producto.activo || !producto.disponibleHoy) {
          return false;
        }
      }
      if (item.servicioId) {
        const servicio = await prisma.servicio.findUnique({
          where: { id: item.servicioId },
          select: { activo: true },
        });
        if (!servicio || !servicio.activo) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calcula el descuento total del combo:
   * descuento = sum(items original prices) - combo.precio
   */
  async calcularDescuentoCombo(comboId: string): Promise<{ precioOriginalTotal: number; descuentoTotal: number }> {
    const combo = await this.getCombo(comboId);
    const precioCombo = Number(combo.precio);
    let precioOriginalTotal = 0;

    for (const item of combo.items) {
      if (item.productoId) {
        const producto = await prisma.producto.findUnique({
          where: { id: item.productoId },
          select: { precio: true },
        });
        if (producto) precioOriginalTotal += Number(producto.precio) * item.cantidad;
      } else if (item.servicioId) {
        const servicio = await prisma.servicio.findUnique({
          where: { id: item.servicioId },
          select: { precio: true },
        });
        if (servicio) precioOriginalTotal += Number(servicio.precio) * item.cantidad;
      }
    }

    return {
      precioOriginalTotal,
      descuentoTotal: Math.max(0, precioOriginalTotal - precioCombo),
    };
  }

  /**
   * Descompone un combo en items para el PedidoItem.
   * El precio del combo se reparte proporcionalmente al precio original de cada item.
   * Devuelve items con precios proporcionales y cálculo fiscal preliminar.
   */
  async descomponerCombo(comboId: string): Promise<
    Array<{
      productoId?: string | null;
      servicioId?: string | null;
      cantidad: number;
      negocioId: string;
      precioOriginal: number;
      precioConDescuento: number;
      tratamientoIVA: string;
      tasaIVAOverride: string | null;
    }>
  > {
    const combo = await this.getCombo(comboId);

    const itemsConDatos: Array<{
      productoId?: string | null;
      servicioId?: string | null;
      cantidad: number;
      negocioId: string;
      precioOriginal: number;
      precioConDescuento: number;
      tratamientoIVA: string;
      tasaIVAOverride: string | null;
    }> = [];

    const precioCombo = Number(combo.precio);
    let precioOriginalTotal = 0;
    const itemsTemp: Array<{
      productoId?: string | null;
      servicioId?: string | null;
      cantidad: number;
      negocioId: string;
      precioOriginalUnitario: number;
      tratamientoIVA: string;
      tasaIVAOverride: string | null;
    }> = [];

    for (const item of combo.items) {
      if (item.productoId) {
        const producto = await prisma.producto.findUnique({
          where: { id: item.productoId },
          select: { precio: true, negocioId: true, tratamientoIVA: true, tasaIVAOverride: true },
        });
        if (producto) {
          precioOriginalTotal += Number(producto.precio) * item.cantidad;
          itemsTemp.push({
            productoId: item.productoId,
            cantidad: item.cantidad,
            negocioId: producto.negocioId,
            precioOriginalUnitario: Number(producto.precio),
            tratamientoIVA: producto.tratamientoIVA,
            tasaIVAOverride: producto.tasaIVAOverride ? String(producto.tasaIVAOverride) : null,
          });
        }
      } else if (item.servicioId) {
        const servicio = await prisma.servicio.findUnique({
          where: { id: item.servicioId },
          select: { precio: true, negocioId: true, tratamientoIVA: true, tasaIVAOverride: true },
        });
        if (servicio) {
          precioOriginalTotal += Number(servicio.precio) * item.cantidad;
          itemsTemp.push({
            servicioId: item.servicioId,
            cantidad: item.cantidad,
            negocioId: servicio.negocioId,
            precioOriginalUnitario: Number(servicio.precio),
            tratamientoIVA: servicio.tratamientoIVA,
            tasaIVAOverride: servicio.tasaIVAOverride ? String(servicio.tasaIVAOverride) : null,
          });
        }
      }
    }

    const factor = precioOriginalTotal > 0 ? precioCombo / precioOriginalTotal : 0;

    for (const item of itemsTemp) {
      const precioOriginal = item.precioOriginalUnitario * item.cantidad;
      const precioConDescuento = precioOriginal * factor;

      itemsConDatos.push({
        productoId: item.productoId,
        servicioId: item.servicioId,
        cantidad: item.cantidad,
        negocioId: item.negocioId,
        precioOriginal,
        precioConDescuento,
        tratamientoIVA: item.tratamientoIVA,
        tasaIVAOverride: item.tasaIVAOverride,
      });
    }

    return itemsConDatos;
  }

  async incrementarUso(comboId: string): Promise<void> {
    await prisma.combo.update({
      where: { id: comboId },
      data: { usosActuales: { increment: 1 } },
    });
    await this.invalidateCache();
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.invalidatePrefix(cachePrefixes.descuentos);
  }
}

export default ComboService;
