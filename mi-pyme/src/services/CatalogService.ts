/**
 * CatalogService - business logic for catalog operations.
 *
 * Encapsulates queries for areas, subareas, negocios, productos, and servicios.
 * Framework-agnostic: can be used by Server Actions, API Routes, or Nest.js.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { getCache } from "@/lib/cache";
import type {
  Area,
  Subarea,
  Negocio,
  Producto,
  Servicio,
  NegocioSubarea,
} from "@/generated/prisma/client";

export interface ListarAreasParams {
  activo?: boolean;
}

export interface ListarSubareasParams {
  areaId?: string;
  activo?: boolean;
}

export interface ListarNegociosParams {
  activo?: boolean;
  areaId?: string;
  subareaId?: string;
}

export interface ListarProductosParams {
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  disponibleHoy?: boolean;
  activo?: boolean;
}

export interface ListarServiciosParams {
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  activo?: boolean;
}

export class CatalogService extends Service {
  async listarAreas(params: ListarAreasParams = {}): Promise<Area[]> {
    const cacheKey = "areas:" + JSON.stringify(params);
    const cached = getCache().get<Area[]>(cacheKey);
    if (cached) return cached;

    const areas = await prisma.area.findMany({
      where: { activo: params.activo ?? true },
      orderBy: { nombre: "asc" },
    });

    getCache().set(cacheKey, areas);
    return areas;
  }

  async listarSubareas(
    params: ListarSubareasParams = {}
  ): Promise<Subarea[]> {
    const cacheKey = "subareas:" + JSON.stringify(params);
    const cached = getCache().get<Subarea[]>(cacheKey);
    if (cached) return cached;

    const subareas = await prisma.subarea.findMany({
      where: {
        activo: params.activo ?? true,
        ...(params.areaId && {
          areaId: params.areaId,
        }),
      },
      orderBy: { nombre: "asc" },
    });

    getCache().set(cacheKey, subareas);
    return subareas;
  }

  async listarNegocios(
    params: ListarNegociosParams = {}
  ): Promise<Negocio[]> {
    const cacheKey = "negocios:" + JSON.stringify(params);
    const cached = getCache().get<Negocio[]>(cacheKey);
    if (cached) return cached;

    const negocios = await prisma.negocio.findMany({
      where: {
        activo: params.activo ?? true,
        ...(params.areaId && { areaId: params.areaId }),
      },
      include: {
        area: true,
        subareas: {
          include: {
            subarea: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    getCache().set(cacheKey, negocios);
    return negocios;
  }

  async listarProductos(
    params: ListarProductosParams = {}
  ): Promise<Producto[]> {
    const cacheKey = "productos:" + JSON.stringify(params);
    const cached = getCache().get<Producto[]>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {
      activo: params.activo ?? true,
    };

    if (params.negocioId) {
      where.negocioId = params.negocioId;
    }
    if (params.subareaId) {
      where.subareaId = params.subareaId;
    }
    if (params.areaId) {
      where.negocio = { areaId: params.areaId };
    }
    if (params.disponibleHoy !== undefined) {
      where.disponibleHoy = params.disponibleHoy;
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        negocio: true,
        subarea: true,
      },
      orderBy: { nombre: "asc" },
    });

    getCache().set(cacheKey, productos);
    return productos;
  }

  async listarServicios(
    params: ListarServiciosParams = {}
  ): Promise<Servicio[]> {
    const cacheKey = "servicios:" + JSON.stringify(params);
    const cached = getCache().get<Servicio[]>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {
      ...(params.activo !== undefined
        ? { activo: params.activo }
        : { activo: true }),
    };

    if (params.negocioId) {
      where.negocioId = params.negocioId;
    }
    if (params.subareaId) {
      where.subareaId = params.subareaId;
    }
    if (params.areaId) {
      where.negocio = { areaId: params.areaId };
    }

    const servicios = await prisma.servicio.findMany({
      where,
      include: {
        negocio: true,
        subarea: true,
      },
      orderBy: { nombre: "asc" },
    });

    getCache().set(cacheKey, servicios);
    return servicios;
  }

  invalidateCache(pattern?: string): void {
    const cache = getCache();
    if (pattern) {
      const keys = cache.keys().filter((k) => k.includes(pattern));
      keys.forEach((k) => cache.del(k));
    } else {
      cache.clear();
    }
  }
}