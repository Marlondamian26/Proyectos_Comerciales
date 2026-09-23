/**
 * LogisticaService - business logic for selecting and validating logistics options
 * during checkout.
 *
 * Framework-agnostic: no Next.js imports.
 *
 * NOTA: Este servicio se enfoca en el checkout (cliente). Para operaciones de
 * gestión de opciones (CRUD), se reutiliza LogisticaNegocioService del Punto 3.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  CODIGO_OPCION_INVALIDA,
  CODIGO_NO_AUTORIZADO,
} from "@/core/constants";
import type { OpcionLogistica } from "@/generated/prisma/client";

const CACHE_TTL_LOGISTICA_SEG = 3600;

export class LogisticaService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  /**
    * Lista opciones de envío activas para un negocio, aplicables al cliente.
    * No requiere ownership (es público, cacheado).
    */
  async listOpcionesParaCheckout(
    negocioId: string
  ): Promise<OpcionLogistica[]> {
    const cacheKey = cacheKeys.logistica.checkout(negocioId);
    const cached = await this.cache.get<OpcionLogistica[]>(cacheKey);
    if (cached) return cached;

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true, permiteEnvio: true },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    if (!negocio.permiteEnvio) {
      await this.cache.set(cacheKey, [], CACHE_TTL_LOGISTICA_SEG);
      return [];
    }

    const opciones = await prisma.opcionLogistica.findMany({
      where: { negocioId },
      include: { proveedor: true },
      orderBy: { createdAt: "desc" },
    });

    await this.cache.set(cacheKey, opciones, CACHE_TTL_LOGISTICA_SEG);
    return opciones;
  }

  /**
   * Valida que una opción de logística pertenezca al negocio indicado.
   * Lanza BusinessError con código OPCION_INVALIDA si no aplica.
   */
  async validarOpcion(negocioId: string, opcionId: string): Promise<void> {
    const opcion = await prisma.opcionLogistica.findUnique({
      where: { id: opcionId },
      select: { negocioId: true, proveedor: { select: { activo: true } } },
    });

    if (!opcion) {
      throw new BusinessError(
        "Opción de logística no encontrada",
        CODIGO_OPCION_INVALIDA,
        400
      );
    }

    if (opcion.negocioId !== negocioId) {
      throw new BusinessError(
        "La opción de logística no pertenece a este negocio",
        CODIGO_OPCION_INVALIDA,
        400
      );
    }

    if (!opcion.proveedor.activo) {
      throw new BusinessError(
        "El proveedor de la opción de logística está inactivo",
        CODIGO_OPCION_INVALIDA,
        400
      );
    }
  }

  /**
   * Calcula el costo de envío para una opción logística.
   * Simplificado: usa tarifaBase. El cálculo por distancia se delega a futuro.
   */
  async calcularCostoEnvio(opcionLogisticaId: string): Promise<number> {
    const opcion = await prisma.opcionLogistica.findUnique({
      where: { id: opcionLogisticaId },
      select: { tarifaBase: true, tarifaPorDistancia: true },
    });

    if (!opcion) {
      throw new BusinessError(
        "Opción de logística no encontrada",
        CODIGO_OPCION_INVALIDA,
        400
      );
    }

    // TODO: Futuro — calcular distancia entre dirección del cliente y el negocio
    // y aplicar tarifaPorDistancia. Por ahora se usa tarifaBase.
    return Number(opcion.tarifaBase);
  }

  async invalidateCache(negocioId?: string): Promise<void> {
    if (negocioId) {
      await this.cache.del(cacheKeys.logistica.checkout(negocioId));
    }
  }
}

export default LogisticaService;
