/**
 * PedidosService - business logic for orders.
 *
 * Encapsula las operaciones de pedido: creacion desde carrito,
 * listado, asignacion de logistica, y actualizacion de estado.
 * Framework-agnostic: puede ser usado por Server Actions, API Routes, o Nest.js.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { getCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import type { Producto, Servicio, Pedido } from "@/generated/prisma/client";

export interface CreParams {
  direccionEntrega: string;
}

export interface ListParams {
  estado?: string[];
}

export class PedidosService extends Service {
  async listarPedidos(
    userId: string,
    params: ListParams = {}
  ): Promise<Pedido[]> {
    const cacheKey = "pedidos:" + userId;
    const cached = getCache().get<Pedido[]>(cacheKey);
    if (cached) return cached;

    const pedidos = await prisma.pedido.findMany({
      where: {
        usuarioId: userId,
        ...(params.estado && { estado: { in: params.estado } }),
      },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
            negocio: true,
          },
        },
        logistica: true,
      },
      orderBy: { fechaCreacion: "desc" },
    });

    getCache().set(cacheKey, pedidos);
    return pedidos;
  }

  async crearDesdeCarrito(
    userId: string,
    datos: CreParams
  ): Promise<Pedido> {
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
    });

    if (!carrito || carrito.items.length === 0) {
      throw new BusinessError("El carrito no existe o esta vacio");
    }

    const tieneProducto = carrito.items.some((item) => item.tipo === "producto");
    const tieneServicios = carrito.items.some((item) => item.tipo === "servicio");
    const tipo =
      tieneProducto && tieneServicios
        ? "mixto"
        : tieneProducto
        ? "producto"
        : "servicio";

    const itemNegocioIds = carrito.items.map((item) => {
    const negocioId = item.producto?.negocioId ?? item.servicio?.negocioId;
    if (!negocioId) {
      throw new BusinessError("No se pudo determinar el negocioId para un item del carrito");
    }
    return negocioId;
    });

    const negotiationIds = Array.from(new Set(itemNegocioIds));

    const total = carrito.items.reduce(
      (sum, item) => sum + item.precioUnitario * item.cantidad,
      0
    );

    const pedidos = await prisma.pedido.create({
      data: {
        usuarioId: userId,
        total,
        estado: "pendiente",
        tipo,
        negocioIds: JSON.stringify(negotiationIds),
        direccionEntrega: datos.direccionEntrega,
        items: {
          create: carrito.items.map((item) => ({
            productoId: item.productoId,
            servicioId: item.servicioId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.precioUnitario * item.cantidad,
            negocioId:
              item.producto?.negocioId ?? item.servicio?.negocioId ?? "",
          })),
        },
      },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
            negocio: true,
          },
        },
      },
    });

    await prisma.carritoItem.deleteMany({
      where: { carritoId: carrito.id },
    });

    getCache().del("carrito:" + userId);
    getCache().del("pedidos:" + userId);

    return pedidos;
  }

  async asignarLogistica(
    pedidoId: string,
    logisticaId: string
  ): Promise<Pedido> {
    const opLogistica = await prisma.opcionLogistica.findUnique({
      where: { id: logisticaId },
    });

    if (!opLogistica) {
      throw new BusinessError("Opcion logistica no encontrada");
    }

    const pedido = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { logisticaId },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
            negocio: true,
          },
        },
        logistica: true,
      },
    });

    getCache().del("pedidos:" + pedido.usuarioId);

    return pedido;
  }

  async actualizarEstado(
    pedidoId: string,
    estado: string
  ): Promise<Pedido> {
    const pedido = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
          },
        },
        logistica: true,
      },
    });

    getCache().del("pedidos:" + pedido.usuarioId);

    return pedido;
  }

  invalidateCache(userId: string): void {
    getCache().del("pedidos:" + userId);
  }
}