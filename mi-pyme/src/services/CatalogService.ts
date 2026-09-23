/**
 * CatalogService - business logic for catalog operations.
 *
 * Encapsulates queries for areas, subareas, negocios, productos, and servicios.
 * Framework-agnostic: can be used by Server Actions, API Routes, or Nest.js.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { DisponibilidadService } from "./DisponibilidadService";
import { assertPertenencia } from "./utils/permisos";
import { logAudit } from "./utils/audit";
import { Prisma, TratamientoIVA } from "@/generated/prisma/client";
import type {
  Area,
  Subarea,
  Negocio,
  Producto,
  Servicio,
  Inventario,
} from "@/generated/prisma/client";
import type { CuposServicioDTO } from "@/shared/disponibilidad.types";
import type { ProductoNegocioDTO, ServicioNegocioDTO, InventarioDTO } from "@/shared/negocio.types";

export type ProductoConRelaciones = Prisma.ProductoGetPayload<{
  include: { negocio: true; subarea: true };
}>;

export type ServicioConRelaciones = Prisma.ServicioGetPayload<{
  include: { negocio: true; subarea: true };
}>;

export interface ListarAreasParams {
  activo?: boolean;
  [key: string]: unknown;
}

export interface ListarSubareasParams {
  areaId?: string;
  activo?: boolean;
  [key: string]: unknown;
}

export interface ListarNegociosParams {
  activo?: boolean;
  areaId?: string;
  subareaId?: string;
  [key: string]: unknown;
}

export interface ListarProductosParams {
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  disponibleHoy?: boolean;
  activo?: boolean;
  [key: string]: unknown;
}

export interface ListarServiciosParams {
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  activo?: boolean;
  [key: string]: unknown;
}

export interface ProductoConDisponibilidad extends Omit<Producto, "disponibleHoy"> {
  disponibleHoy: {
    cantidadDisponible: number;
    disponible: boolean;
    cantidadReservada: number;
  } | null;
  negocio: { id: string; nombre: string };
  subarea: { id: string; nombre: string } | null;
}

export interface ServicioConCupos extends Servicio {
  cuposDisponiblesHoy: CuposServicioDTO | null;
  negocio: { id: string; nombre: string };
  subarea: { id: string; nombre: string } | null;
}

export class CatalogService extends Service {
  private dispService: DisponibilidadService;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.dispService = new DisponibilidadService(this.cache);
  }

  async listarAreas(params: ListarAreasParams = {}): Promise<Area[]> {
    const cacheKey = cacheKeys.catalogo.areas(params);
    const cached = await this.cache.get<Area[]>(cacheKey);
    if (cached) return cached;

    const areas = await prisma.area.findMany({
      where: { activo: params.activo ?? true },
      orderBy: { nombre: "asc" },
    });

    await this.cache.set(cacheKey, areas, cacheTTL.catalogo);
    return areas;
  }

  async listarSubareas(
    params: ListarSubareasParams = {}
  ): Promise<Subarea[]> {
    const cacheKey = cacheKeys.catalogo.subareas(params);
    const cached = await this.cache.get<Subarea[]>(cacheKey);
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

    await this.cache.set(cacheKey, subareas, cacheTTL.catalogo);
    return subareas;
  }

  async listarNegocios(
    params: ListarNegociosParams = {}
  ): Promise<Negocio[]> {
    const cacheKey = cacheKeys.catalogo.negocios(params);
    const cached = await this.cache.get<Negocio[]>(cacheKey);
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

    await this.cache.set(cacheKey, negocios, cacheTTL.catalogo);
    return negocios;
  }

  async listarProductos(
    params: ListarProductosParams = {}
  ): Promise<ProductoConRelaciones[]> {
    const cacheKey = cacheKeys.catalogo.productos(params);
    const cached = await this.cache.get<ProductoConRelaciones[]>(cacheKey);
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

    await this.cache.set(cacheKey, productos, cacheTTL.catalogo);
    return productos;
  }

  async listarServicios(
    params: ListarServiciosParams = {}
  ): Promise<ServicioConRelaciones[]> {
    const cacheKey = cacheKeys.catalogo.servicios(params);
    const cached = await this.cache.get<ServicioConRelaciones[]>(cacheKey);
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

    await this.cache.set(cacheKey, servicios, cacheTTL.catalogo);
    return servicios;
  }

  /**
   * Lista productos enriquecidos con disponibilidad de hoy (batch, evita N+1).
   * Usa DisponibilidadService para resolver la disponibilidad real.
   */
  async listarProductosConDisponibilidad(
    params: ListarProductosParams = {}
  ): Promise<ProductoConDisponibilidad[]> {
    const productos = await this.listarProductos(params);
    const ids = productos.map((p) => p.id);
    const mapa = await this.dispService.getDisponibilidadProductos(ids);

    return productos.map((p) => ({
      ...p,
      disponibleHoy: mapa.get(p.id) ?? null,
    }));
  }

  /**
   * Lista servicios enriquecidos con cupos disponibles hoy (batch).
   */
  async listarServiciosConCupos(
    params: ListarServiciosParams = {}
  ): Promise<ServicioConCupos[]> {
    const servicios = await this.listarServicios(params);
    const resultados: ServicioConCupos[] = [];

    for (const s of servicios) {
      const cupos = await this.dispService.getCuposServicio(s.id);
      resultados.push({ ...s, cuposDisponiblesHoy: cupos });
    }

    return resultados;
  }

  // -- CRUD de productos scoped por negocio --

  async crearProducto(
    negocioId: string,
    datos: ProductoNegocioDTO,
    userId: string,
    rolActual?: string
  ): Promise<ProductoConRelaciones> {
    await assertPertenencia(userId, negocioId, rolActual);

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    if (datos.precio < 0) {
      throw new BusinessError("El precio debe ser positivo", "VALIDACION", 400);
    }

    const negocioFiscal = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { regimenFiscal: true },
    });

    const regimenSinIVA = negocioFiscal && ["SIMPLIFICADO", "EXENTO", "NO_SUJETO"].includes(negocioFiscal.regimenFiscal);
    const tratamiento = datos.tratamientoIVA ?? TratamientoIVA.GRAVADO;

    if (regimenSinIVA && tratamiento === TratamientoIVA.GRAVADO) {
      throw new BusinessError(
        "Este negocio no puede tener productos GRAVADOS. Cambie el tratamiento a EXENTO o NO_SUJETO.",
        "REGIMEN_INVALIDO",
        400
      );
    }

    const producto = await prisma.producto.create({
      data: {
        negocioId,
        subareaId: datos.subareaId,
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? undefined,
        precio: datos.precio,
        unidadMedida: datos.unidadMedida,
        imagenUrl: datos.imagenUrl,
        activo: datos.activo ?? true,
        disponibleHoy: datos.disponibleHoy ?? true,
        tratamientoIVA: datos.tratamientoIVA ?? TratamientoIVA.GRAVADO,
        tasaIVAOverride: datos.tasaIVAOverride != null ? new Prisma.Decimal(datos.tasaIVAOverride) : undefined,
      },
      include: { negocio: true, subarea: true },
    });

    await logAudit("PRODUCTO_CREADO", userId, producto.id, { negocioId });
    this.invalidateCache("productos");
    return producto;
  }

  async actualizarProducto(
    id: string,
    datos: Partial<ProductoNegocioDTO>,
    userId: string,
    rolActual?: string
  ): Promise<ProductoConRelaciones> {
    const producto = await prisma.producto.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!producto) {
      throw new BusinessError("Producto no encontrado", "NO_ENCONTRADO", 404);
    }

    await assertPertenencia(userId, producto.negocioId, rolActual);

    const result = await prisma.producto.update({
      where: { id },
      data: {
        ...(datos.nombre && { nombre: datos.nombre }),
        ...(datos.descripcion !== undefined && {
          descripcion: datos.descripcion ?? undefined,
        }),
        ...(datos.precio !== undefined && { precio: datos.precio }),
        ...(datos.unidadMedida && { unidadMedida: datos.unidadMedida }),
        ...(datos.imagenUrl && { imagenUrl: datos.imagenUrl }),
        ...(datos.subareaId && { subareaId: datos.subareaId }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
        ...(datos.disponibleHoy !== undefined && {
          disponibleHoy: datos.disponibleHoy,
        }),
        ...(datos.tratamientoIVA !== undefined && {
          tratamientoIVA: datos.tratamientoIVA,
        }),
        ...(datos.tasaIVAOverride !== undefined && {
          tasaIVAOverride: datos.tasaIVAOverride !== null
            ? new Prisma.Decimal(datos.tasaIVAOverride)
            : null,
        }),
      },
      include: { negocio: true, subarea: true },
    });

    await logAudit("PRODUCTO_ACTUALIZADO", userId, id, {});
    this.invalidateCache("productos");
    return result;
  }

  async eliminarProducto(
    id: string,
    userId: string,
    rolActual?: string
  ): Promise<void> {
    const producto = await prisma.producto.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!producto) {
      throw new BusinessError("Producto no encontrado", "NO_ENCONTRADO", 404);
    }

    await assertPertenencia(userId, producto.negocioId, rolActual);

    await prisma.producto.delete({ where: { id } });

    await logAudit("PRODUCTO_ELIMINADO", userId, id, {});
    this.invalidateCache("productos");
  }

  // -- CRUD de servicios scoped por negocio --

  async crearServicio(
    negocioId: string,
    datos: ServicioNegocioDTO,
    userId: string,
    rolActual?: string
  ): Promise<ServicioConRelaciones> {
    await assertPertenencia(userId, negocioId, rolActual);

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    if (datos.duracionMinutos <= 0) {
      throw new BusinessError(
        "La duración debe ser positiva",
        "VALIDACION",
        400
      );
    }

    if (datos.capacidad <= 0) {
      throw new BusinessError("La capacidad debe ser positiva", "VALIDACION", 400);
    }

    const servicio = await prisma.servicio.create({
      data: {
        negocioId,
        subareaId: datos.subareaId,
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? undefined,
        duracionMinutos: datos.duracionMinutos,
        horariosDisponibles: datos.horariosDisponibles as unknown as Prisma.InputJsonValue,
        capacidad: datos.capacidad,
        imagenUrl: datos.imagenUrl,
        activo: datos.activo ?? true,
        permiteReservas: true,
        tratamientoIVA: datos.tratamientoIVA ?? TratamientoIVA.GRAVADO,
        tasaIVAOverride: datos.tasaIVAOverride != null ? new Prisma.Decimal(datos.tasaIVAOverride) : undefined,
      },
      include: { negocio: true, subarea: true },
    });

    await logAudit("SERVICIO_CREADO", userId, servicio.id, { negocioId });
    this.invalidateCache("servicios");
    return servicio;
  }

  async actualizarServicio(
    id: string,
    datos: Partial<ServicioNegocioDTO>,
    userId: string,
    rolActual?: string
  ): Promise<ServicioConRelaciones> {
    const servicio = await prisma.servicio.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!servicio) {
      throw new BusinessError("Servicio no encontrado", "NO_ENCONTRADO", 404);
    }

    await assertPertenencia(userId, servicio.negocioId, rolActual);

    const result = await prisma.servicio.update({
      where: { id },
      data: {
        ...(datos.nombre && { nombre: datos.nombre }),
        ...(datos.descripcion !== undefined && {
          descripcion: datos.descripcion ?? undefined,
        }),
        ...(datos.duracionMinutos !== undefined && {
          duracionMinutos: datos.duracionMinutos,
        }),
        ...(datos.capacidad !== undefined && { capacidad: datos.capacidad }),
        ...(datos.horariosDisponibles && {
          horariosDisponibles: datos.horariosDisponibles as unknown as Prisma.InputJsonValue,
        }),
        ...(datos.imagenUrl && { imagenUrl: datos.imagenUrl }),
        ...(datos.subareaId && { subareaId: datos.subareaId }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
        ...(datos.permiteReservas !== undefined && {
          permiteReservas: datos.permiteReservas,
        }),
        ...(datos.tratamientoIVA !== undefined && {
          tratamientoIVA: datos.tratamientoIVA,
        }),
        ...(datos.tasaIVAOverride !== undefined && {
          tasaIVAOverride: datos.tasaIVAOverride !== null
            ? new Prisma.Decimal(datos.tasaIVAOverride)
            : null,
        }),
      },
      include: { negocio: true, subarea: true },
    });

    await logAudit("SERVICIO_ACTUALIZADO", userId, id, {});
    this.invalidateCache("servicios");
    return result;
  }

  async eliminarServicio(
    id: string,
    userId: string,
    rolActual?: string
  ): Promise<void> {
    const servicio = await prisma.servicio.findUnique({
      where: { id },
      select: { negocioId: true },
    });

    if (!servicio) {
      throw new BusinessError("Servicio no encontrado", "NO_ENCONTRADO", 404);
    }

    await assertPertenencia(userId, servicio.negocioId, rolActual);

    await prisma.servicio.delete({ where: { id } });

    await logAudit("SERVICIO_ELIMINADO", userId, id, {});
    this.invalidateCache("servicios");
  }

  // -- CRUD de inventario scoped por negocio --

  async actualizarInventario(
    productoId: string,
    datos: InventarioDTO,
    userId: string,
    rolActual?: string
  ): Promise<Inventario> {
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      select: { negocioId: true, id: true },
    });

    if (!producto) {
      throw new BusinessError("Producto no encontrado", "NO_ENCONTRADO", 404);
    }

    await assertPertenencia(userId, producto.negocioId, rolActual);

    const existing = await prisma.inventario.findFirst({
      where: { productoId },
      select: { id: true },
    });

    const result = existing
      ? await prisma.inventario.update({
          where: { id: existing.id },
          data: {
            cantidadActual: datos.cantidadActual,
            puntoReorden: datos.puntoReorden,
            ubicacion: datos.ubicacion,
          },
        })
      : await prisma.inventario.create({
          data: {
            productoId,
            cantidadActual: datos.cantidadActual,
            puntoReorden: datos.puntoReorden,
            ubicacion: datos.ubicacion,
          },
        });

    await logAudit("INVENTARIO_ACTUALIZADO", userId, productoId, {});
    this.invalidateCache("productos");
    this.invalidateCache("inventario");
    return result;
  }

  async listarInventarioDeNegocio(
    negocioId: string,
    userId: string,
    rolActual?: string
  ): Promise<Prisma.InventarioGetPayload<{ include: { producto: true } }>[]> {
    await assertPertenencia(userId, negocioId, rolActual);

    return prisma.inventario.findMany({
      where: { producto: { negocioId } },
      include: { producto: true },
      orderBy: { cantidadActual: "asc" },
    });
  }

  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      if (pattern === "productos") {
        await this.cache.invalidatePrefix(cachePrefixes.catalogo + "productos");
      } else if (pattern === "servicios") {
        await this.cache.invalidatePrefix(cachePrefixes.catalogo + "servicios");
      } else if (pattern === "inventario") {
        await this.cache.invalidatePrefix(cachePrefixes.disponibilidad);
      }
    } else {
      await this.cache.clear();
    }
  }
}