/**
 * LogisticaNegocioService - business logic for negocio shipping/logistics options.
 *
 * Encapsulates: listado/creación/edición/borrado de OpcionLogistica perteneciente
 * a un negocio, y listado de proveedores disponibles por ubicación.
 *
 * Framework-agnostic: no Next.js imports.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { assertPertenencia } from "./utils/permisos";
import { logAudit } from "./utils/audit";
import type { OpcionLogistica, ProveedorLogistico } from "@/generated/prisma/client";
import type { OpcionLogisticaDTO } from "@/shared/negocio.types";

export class LogisticaNegocioService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  /**
   * Lista las opciones de envío de un negocio.
   */
  async listOpcionesDeNegocio(
    negocioId: string,
    userId: string,
    rolActual?: string
  ): Promise<OpcionLogistica[]> {
    await assertPertenencia(userId, negocioId, rolActual);

    return prisma.opcionLogistica.findMany({
      where: { negocioId },
      include: { proveedor: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Crea una opción de envío para el negocio.
   * Valida que el proveedor exista y pertenezca al negocio (o sea nacional).
   */
  async crearOpcion(
    negocioId: string,
    datos: OpcionLogisticaDTO,
    userId: string,
    rolActual?: string
  ): Promise<OpcionLogistica> {
    await assertPertenencia(userId, negocioId, rolActual);

    const proveedor = await prisma.proveedorLogistico.findUnique({
      where: { id: datos.proveedorId },
      select: { id: true, activo: true },
    });

    if (!proveedor || !proveedor.activo) {
      throw new BusinessError(
        "Proveedor no encontrado o inactivo",
        "NO_ENCONTRADO",
        404
      );
    }

    const opcion = await prisma.opcionLogistica.create({
      data: {
        negocioId,
        proveedorId: datos.proveedorId,
        nombre: datos.nombre,
        tipo: datos.tipo,
        tarifaBase: datos.tarifaBase,
        tarifaPorDistancia: datos.tarifaPorDistancia,
        tiempoEstimado: datos.tiempoEstimado,
      },
    });

    await logAudit("OPCION_LOGISTICA_CREADA", userId, opcion.id, {
      negocioId,
      proveedorId: datos.proveedorId,
    });

    this.invalidateCache(negocioId);
    return opcion;
  }

  /**
   * Actualiza una opción de envío. Valida ownership del negocio.
   */
  async actualizarOpcion(
    id: string,
    datos: Partial<OpcionLogisticaDTO>,
    userId: string,
    rolActual?: string
  ): Promise<OpcionLogistica> {
    const opcion = await prisma.opcionLogistica.findUnique({
      where: { id },
      select: { negocioId: true, proveedorId: true },
    });

    if (!opcion) {
      throw new BusinessError(
        "Opción de logística no encontrada",
        "NO_ENCONTRADO",
        404
      );
    }

    await assertPertenencia(userId, opcion.negocioId, rolActual);

    if (datos.proveedorId) {
      const proveedor = await prisma.proveedorLogistico.findUnique({
        where: { id: datos.proveedorId },
        select: { id: true, activo: true },
      });
      if (!proveedor || !proveedor.activo) {
        throw new BusinessError(
          "Proveedor no encontrado o inactivo",
          "NO_ENCONTRADO",
          404
        );
      }
    }

    const result = await prisma.opcionLogistica.update({
      where: { id },
      data: {
        ...(datos.nombre && { nombre: datos.nombre }),
        ...(datos.tipo && { tipo: datos.tipo }),
        ...(datos.tarifaBase !== undefined && { tarifaBase: datos.tarifaBase }),
        ...(datos.tarifaPorDistancia !== undefined && {
          tarifaPorDistancia: datos.tarifaPorDistancia,
        }),
        ...(datos.tiempoEstimado && { tiempoEstimado: datos.tiempoEstimado }),
        ...(datos.proveedorId && { proveedorId: datos.proveedorId }),
      },
    });

    await logAudit("OPCION_LOGISTICA_ACTUALIZADA", userId, id, {});
    this.invalidateCache(opcion.negocioId);
    return result;
  }

  /**
   * Elimina una opción de envío. Valida ownership del negocio.
   */
  async eliminarOpcion(
    id: string,
    userId: string,
    rolActual?: string
  ): Promise<void> {
    const opcion = await prisma.opcionLogistica.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!opcion) {
      throw new BusinessError(
        "Opción de logística no encontrada",
        "NO_ENCONTRADO",
        404
      );
    }

    await assertPertenencia(userId, opcion.negocioId, rolActual);

    await prisma.opcionLogistica.delete({ where: { id } });

    await logAudit("OPCION_LOGISTICA_ELIMINADA", userId, id, {});
    this.invalidateCache(opcion.negocioId);
  }

  /**
   * Lista proveedores disponibles para un negocio:
   * proveedores cuyo `usuarioId` coincide con el del negocio-owner OR
   * proveedores con `alcanceNacional: true`.
   * NOTA: simplificado usando provincia/municipio del negocio.
   */
  async listProveedoresDisponibles(
    negocioId: string,
    userId?: string,
    rolActual?: string
  ): Promise<ProveedorLogistico[]> {
    if (userId && rolActual !== "ADMIN") {
      await assertPertenencia(userId, negocioId, rolActual);
    }

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { provincia: true, municipio: true },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    return prisma.proveedorLogistico.findMany({
      where: {
        activo: true,
        OR: [
          { alcanceNacional: true },
          ...(negocio.provincia
            ? [{ zonaCobertura: { contains: negocio.provincia } }]
            : []),
          ...(negocio.municipio
            ? [{ zonaCobertura: { contains: negocio.municipio } }]
            : []),
        ],
      },
      orderBy: { nombre: "asc" },
    });
  }

  async invalidateCache(negocioId?: string): Promise<void> {
    if (negocioId) {
      await this.cache.del(cacheKeys.logistica.negocio(negocioId));
    }
    await this.cache.del(cacheKeys.logistica.pending());
  }
}

export default LogisticaNegocioService;
