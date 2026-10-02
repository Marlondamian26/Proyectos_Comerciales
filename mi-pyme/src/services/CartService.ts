/**
 * CartService - business logic for shopping cart operations.
 *
 * Encapsulates carrito and carritoItem operations.
 * Framework-agnostic: can be used by Server Actions, API Routes, or Nest.js.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache } from "@/infrastructure";
import { cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { normalizarFecha } from "@/shared/utils/fecha";
import {
  CODIGO_METADATA_REQUERIDA,
  CODIGO_FECHA_INVALIDA,
  CODIGO_RUTA_NO_CUBIERTA,
  CODIGO_PESO_EXCEDIDO,
} from "@/core/constants";
import { Prisma } from "@/generated/prisma/client";
import type { Carrito, CarritoItem } from "@/generated/prisma/client";
import type { TipoServicio } from "@/generated/prisma/client";
import { DisponibilidadService } from "./DisponibilidadService";
import type { ValidacionCarritoItem } from "@/shared/disponibilidad.types";

export type CarritoConItems = Carrito & {
  items: Array<
    CarritoItem & {
      producto?: { nombre: string; negocioId: string } | null;
      servicio?: { nombre: string; negocioId: string; tipo: string } | null;
    }
  >;
};

export interface AddItemParams {
  productoId?: string;
  servicioId?: string;
  cantidad?: number;
  fechaEntrega?: Date | string | number;
  metadata?: Record<string, unknown>;
}

export class CartService extends Service {
  private dispService: DisponibilidadService;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.dispService = new DisponibilidadService(cache);
  }

  private async getActiveCart(userId: string): Promise<CarritoConItems | null> {
    const cacheKey = cacheKeys.carrito.usuario(userId);
    const cached = await this.cache.get<CarritoConItems>(cacheKey);
    if (cached) return cached;

    const carrito = await prisma.carrito.findFirst({
      where: { usuarioId: userId, estado: "activo" },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
          },
        },
      },
      orderBy: { actualizadoEn: "desc" },
    });

    if (carrito) {
      await this.cache.set(cacheKey, carrito, cacheTTL.carrito);
    }

    return carrito;
  }

  async obtenerCarrito(userId: string): Promise<CarritoConItems | null> {
    return this.getActiveCart(userId);
  }

  async listarCarrito(userId: string): Promise<CarritoConItems | null> {
    return this.getActiveCart(userId);
  }

  async verCarrito(userId: string): Promise<CarritoConItems | null> {
    return this.getActiveCart(userId);
  }

  async anadirItem(
    userId: string,
    datos: AddItemParams
  ): Promise<Carrito> {
    const cantidad = datos.cantidad ?? 1;
    const fechaEntrega = normalizarFecha(datos.fechaEntrega ?? new Date());

    let precioUnitario = 0;

    if (datos.productoId) {
      const producto = await prisma.producto.findUnique({
        where: { id: datos.productoId },
        select: { precio: true, activo: true },
      });
      if (!producto || !producto.activo) {
        throw new BusinessError("Producto no encontrado o no disponible");
      }
      precioUnitario = producto.precio;
    } else if (datos.servicioId) {
      const servicio = await prisma.servicio.findUnique({
        where: { id: datos.servicioId },
        select: {
          activo: true,
          tipo: true,
          tipoTransporte: true,
          pesoMaximo: true,
          origenBase: true,
          destinoBase: true,
          alcanceNacional: true,
          precio: true,
        },
      });
      if (!servicio || !servicio.activo) {
        throw new BusinessError("Servicio no encontrado o no disponible");
      }

      if (servicio.tipo === "TRANSPORTE") {
        await this.validarTransporteMetadata(servicio, datos.metadata);
        precioUnitario = Number(servicio.precio ?? 0);
      }
    } else {
      throw new BusinessError("Se requiere productoId o servicioId");
    }

    await prisma.carrito.upsert({
      where: {
        usuarioId_estado: {
          usuarioId: userId,
          estado: "activo",
        },
      },
      update: { actualizadoEn: new Date() },
      create: { usuarioId: userId, estado: "activo" },
    });

    const tipo = datos.productoId ? "producto" : "servicio";

    const carrito = await prisma.carrito.findFirst({
      where: { usuarioId: userId, estado: "activo" },
      select: { id: true },
    });

    if (!carrito) {
      throw new BusinessError("Error al obtener el carrito");
    }

    const existingItem = await prisma.carritoItem.findFirst({
      where: {
        carritoId: carrito.id,
        ...(datos.productoId && { productoId: datos.productoId }),
        ...(datos.servicioId && { servicioId: datos.servicioId }),
      },
    });

    const cantidadTotal = (existingItem?.cantidad ?? 0) + cantidad;

    if (datos.productoId) {
      await this.dispService.puedeComprarProducto(
        datos.productoId,
        cantidadTotal,
        fechaEntrega
      );
    } else if (datos.servicioId) {
      const servicio = await prisma.servicio.findUnique({
        where: { id: datos.servicioId },
        select: { tipo: true },
      });
      if (servicio?.tipo !== "TRANSPORTE") {
        await this.dispService.puedeReservarServicio(
          datos.servicioId,
          fechaEntrega,
          cantidadTotal
        );
      }
    }

    if (existingItem) {
      await prisma.carritoItem.update({
        where: { id: existingItem.id },
        data: { cantidad: cantidadTotal, fechaEntrega, metadata: datos.metadata as Prisma.InputJsonValue | undefined },
      });
    } else {
      await prisma.carritoItem.create({
        data: {
          carritoId: carrito.id,
          productoId: datos.productoId,
          servicioId: datos.servicioId,
          cantidad,
          precioUnitario,
          tipo,
          fechaEntrega,
          metadata: datos.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    }

    await this.invalidateCache(userId);

    const updatedCart = await prisma.carrito.findUnique({
      where: { id: carrito.id },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
          },
        },
      },
    });

    if (!updatedCart) {
      throw new BusinessError("Error al obtener el carrito actualizado");
    }

    await this.cache.set(cacheKeys.carrito.usuario(userId), updatedCart, cacheTTL.carrito);
    return updatedCart;
  }

  private async validarTransporteMetadata(
    servicio: {
      tipo: TipoServicio;
      tipoTransporte: string | null;
      pesoMaximo: { toNumber(): number } | null;
      origenBase: string | null;
      destinoBase: string | null;
      alcanceNacional: boolean;
    },
    metadata: Record<string, unknown> | undefined
  ): Promise<void> {
    if (!metadata) {
      throw new BusinessError(
        "Se requieren datos de origen, destino y fecha para servicios de transporte",
        CODIGO_METADATA_REQUERIDA,
        400
      );
    }

    const origen = metadata.origen as string | undefined;
    const destino = metadata.destino as string | undefined;
    const fecha = metadata.fecha as string | undefined;
    const peso = metadata.peso as number | string | undefined;

    if (!origen || !destino) {
      throw new BusinessError(
        "Origen y destino son requeridos para servicios de transporte",
        CODIGO_METADATA_REQUERIDA,
        400
      );
    }

    if (!fecha) {
      throw new BusinessError(
        "La fecha es requerida para servicios de transporte",
        CODIGO_METADATA_REQUERIDA,
        400
      );
    }

    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime()) || fechaDate <= new Date()) {
      throw new BusinessError(
        "La fecha debe ser futura para servicios de transporte",
        CODIGO_FECHA_INVALIDA,
        400
      );
    }

    if (servicio.alcanceNacional) {
      void origen;
      void destino;
    } else {
      const origenServicio = servicio.origenBase;
      const destinoServicio = servicio.destinoBase;
      if (origenServicio && origen !== origenServicio) {
        throw new BusinessError(
          `El origen debe ser ${origenServicio} para este servicio de transporte`,
          CODIGO_RUTA_NO_CUBIERTA,
          400
        );
      }
      if (destinoServicio && destino !== destinoServicio) {
        throw new BusinessError(
          `El destino debe ser ${destinoServicio} para este servicio de transporte`,
          CODIGO_RUTA_NO_CUBIERTA,
          400
        );
      }
    }

    if (peso !== undefined && servicio.pesoMaximo) {
      const pesoNum = typeof peso === "string" ? Number(peso) : peso;
      const pesoMax = Number(servicio.pesoMaximo.toNumber?.() ?? servicio.pesoMaximo);
      if (pesoNum > pesoMax) {
        throw new BusinessError(
          `El peso (${pesoNum}) excede el máximo permitido (${pesoMax}) para este servicio de transporte`,
          CODIGO_PESO_EXCEDIDO,
          400
        );
      }
    }
  }

  async eliminarCarritoItem(
    itemId: string,
    userId?: string
  ): Promise<void> {
    const carrito = userId
      ? await prisma.carrito.findFirst({
          where: { usuarioId: userId, estado: "activo" },
          select: { id: true },
        })
      : null;

    await prisma.carritoItem.deleteMany({
      where: {
        id: itemId,
        ...(carrito && {
          carritoId: carrito.id,
        }),
      },
    });

    if (userId) {
      await this.invalidateCache(userId);
    }
  }

  async vaciarCarrito(userId: string): Promise<void> {
    await prisma.carritoItem.deleteMany({
      where: {
        carrito: {
          usuarioId: userId,
          estado: "activo",
        },
      },
    });

    await this.invalidateCache(userId);
  }

  async validarCarritoCompleto(
    userId: string,
    fecha?: Date | string | number
  ): Promise<ValidacionCarritoItem[]> {
    const carrito = await this.getActiveCart(userId);
    if (!carrito) {
      return [];
    }

    const resultados: ValidacionCarritoItem[] = [];

    for (const item of carrito.items) {
      const fechaItem = item.fechaEntrega
        ? normalizarFecha(item.fechaEntrega)
        : normalizarFecha(fecha ?? new Date());

      let problema: string | null = null;

      try {
        if (item.productoId) {
          const disp = await this.dispService.getDisponibilidadProducto(
            item.productoId,
            fechaItem
          );
          const valido =
            disp.disponible &&
            disp.cantidadReservada <= disp.cantidadOfertada &&
            disp.cantidadReservada <= disp.stockFisico;
          if (!valido) {
            problema = `No hay disponibilidad suficiente (oferta ${disp.cantidadOfertada}, reservada ${disp.cantidadReservada}, stock ${disp.stockFisico})`;
          }
        } else if (item.servicioId) {
          const cupos = await this.dispService.getCuposServicio(
            item.servicioId,
            fechaItem
          );
          const valido =
            cupos.disponible && cupos.cuposDisponibles >= item.cantidad;
          if (!valido) {
            problema = `No hay cupos suficientes (cupos: ${cupos.cuposDisponibles})`;
          }
        }
      } catch (err: unknown) {
        problema =
          err instanceof Error ? err.message : "Disponibilidad insuficiente";
      }

      resultados.push({
        itemId: item.id,
        productoId: item.productoId,
        servicioId: item.servicioId,
        cantidad: item.cantidad,
        fechaEntrega: fechaItem,
        problema,
      });
    }

    return resultados;
  }

  async invalidateCache(userId: string): Promise<void> {
    await this.cache.del(cacheKeys.carrito.usuario(userId));
  }
}

export default CartService;
