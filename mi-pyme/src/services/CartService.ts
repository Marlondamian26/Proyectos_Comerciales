/**
 * CartService - business logic for shopping cart operations.
 *
 * Encapsulates carrito and carritoItem operations.
 * Framework-agnostic: can be used by Server Actions, API Routes, or Nest.js.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { getCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import type { Carrito, CarritoItem } from "@/generated/prisma/client";

export interface AddItemParams {
  productoId?: string;
  servicioId?: string;
  cantidad?: number;
}

export class CartService extends Service {
  private async getActiveCart(userId: string): Promise<Carrito | null> {
    const cacheKey = "carrito:" + userId;
    const cached = getCache().get<Carrito>(cacheKey);
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
      getCache().set(cacheKey, carrito);
    }

    return carrito;
  }

  async obtenerCarrito(userId: string): Promise<Carrito | null> {
    return this.getActiveCart(userId);
  }

  async listarCarrito(userId: string): Promise<Carrito | null> {
    return this.getActiveCart(userId);
  }

  async verCarrito(userId: string): Promise<Carrito | null> {
    return this.getActiveCart(userId);
  }

  async anadirItem(
    userId: string,
    datos: AddItemParams
  ): Promise<Carrito> {
    const cantidad = datos.cantidad ?? 1;

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
        select: { activo: true },
      });
      if (!servicio || !servicio.activo) {
        throw new BusinessError("Servicio no encontrado o no disponible");
      }
    } else {
      throw new BusinessError("Se requiere productoId o servicioId");
    }

    const carrito = await prisma.carrito.upsert({
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

    const existingItem = await prisma.carritoItem.findFirst({
      where: {
        carritoId: carrito.id,
        ...(datos.productoId && { productoId: datos.productoId }),
        ...(datos.servicioId && { servicioId: datos.servicioId }),
      },
    });

    if (existingItem) {
      await prisma.carritoItem.update({
        where: { id: existingItem.id },
        data: { cantidad: existingItem.cantidad + cantidad },
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
        },
      });
    }

    getCache().del("carrito:" + userId);

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

    getCache().set("carrito:" + userId, updatedCart);
    return updatedCart;
  }

  async eliminarCarritoItem(
    itemId: string,
    userId?: string
  ): Promise<void> {
    await prisma.carritoItem.deleteMany({
      where: {
        id: itemId,
        ...(userId && {
          carrito: { usuarioId: userId, estado: "activo" },
        }),
      },
    });

    if (userId) {
      getCache().del("carrito:" + userId);
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

    getCache().del("carrito:" + userId);
  }

  invalidateCache(userId: string): void {
    getCache().del("carrito:" + userId);
  }
}