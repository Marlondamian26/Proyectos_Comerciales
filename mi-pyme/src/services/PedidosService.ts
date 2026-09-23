/**
 * PedidosService - business logic for orders.
 *
 * Encapsula las operaciones de pedido: creacion desde carrito (delegada en
 * CheckoutService para el checkout formal con logística), listado, asignacion
 * de logistica, y actualizacion de estado.
 *
 * Framework-agnostic: puede ser usado por Server Actions, API Routes, o Nest.js.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { CartService } from "./CartService";
import { DisponibilidadService } from "./DisponibilidadService";
import { CheckoutService } from "./CheckoutService";
import type { Pedido } from "@/generated/prisma/client";

export interface ListParams {
  estado?: string[];
}

export interface CreParams {
  direccionEntrega: string;
}

export class PedidosService extends Service {
  private cartService: CartService;
  private dispService: DisponibilidadService;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.cartService = new CartService(this.cache);
    this.dispService = new DisponibilidadService(this.cache);
  }

  async listarPedidos(
    userId: string,
    params: ListParams = {}
  ): Promise<Pedido[]> {
    const cacheKey = cacheKeys.pedidos.usuario(userId, params.estado ? { estado: params.estado } : undefined);
    const cached = await this.cache.get<Pedido[]>(cacheKey);
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
        opcionLogistica: true,
      },
      orderBy: { fechaCreacion: "desc" },
    });

    await this.cache.set(cacheKey, pedidos, cacheTTL.pedidos);
    return pedidos;
  }

  /**
   * Lista los pedidos del usuario agrupados por negocio.
   * Cada grupo contiene los pedidos cuyo negocioId coincide.
   */
  async listPedidosDeUsuario(userId: string): Promise<
    Array<{
      negocioId: string;
      negocio: { id: string; nombre: string; direccion: string | null };
      pedidos: Pedido[];
    }>
  > {
    const cacheKey = cacheKeys.pedidos.grupos(userId);
    const cached = await this.cache.get<
      Array<{
        negocioId: string;
        negocio: { id: string; nombre: string; direccion: string | null };
        pedidos: Pedido[];
      }>
    >(cacheKey);
    if (cached) return cached;

    const pedidos = await prisma.pedido.findMany({
      where: { usuarioId: userId },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
            negocio: true,
          },
        },
        opcionLogistica: true,
        negocio: { select: { id: true, nombre: true, direccion: true } },
      },
      orderBy: { fechaCreacion: "desc" },
    });

    const grupos = new Map<string, Pedido[]>();
    const negocioInfo = new Map<string, { id: string; nombre: string; direccion: string | null }>();

    for (const pedido of pedidos) {
      const negocioId = pedido.negocioId ?? pedido.items[0]?.negocioId ?? "";
      if (!grupos.has(negocioId)) {
        grupos.set(negocioId, []);
      }
      grupos.get(negocioId)!.push(pedido);
      negocioInfo.set(negocioId, {
        id: pedido.negocio?.id ?? negocioId,
        nombre: pedido.negocio?.nombre ?? "",
        direccion: pedido.negocio?.direccion ?? null,
      });
    }

    const result = Array.from(grupos.entries()).map(([negocioId, pedidos]) => ({
      negocioId,
      negocio: negocioInfo.get(negocioId)!,
      pedidos,
    }));

    await this.cache.set(cacheKey, result, cacheTTL.pedidos);
    return result;
  }

  /**
   * Obtiene un pedido por ID validando que pertenezca al usuario.
   */
  async getPedido(id: string, userId: string): Promise<Pedido | null> {
    const cacheKey = cacheKeys.pedidos.detalle(id, userId);
    const cached = await this.cache.get<Pedido>(cacheKey);
    if (cached && cached.usuarioId === userId) return cached;

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
            negocio: true,
          },
        },
        opcionLogistica: true,
        negocio: { select: { id: true, nombre: true, direccion: true } },
      },
    });

    if (!pedido || pedido.usuarioId !== userId) {
      throw new BusinessError(
        "Pedido no encontrado o no tienes permiso para acceder",
        "NO_ENCONTRADO",
        404
      );
    }

    await this.cache.set(cacheKey, pedido, cacheTTL.pedidos);
    return pedido;
  }

  async crearDesdeCarrito(
    userId: string
  ): Promise<{
    pedidosCreados: { id: string; negocioId: string; total: number; estado: string }[];
    totalGeneral: number;
  }> {
    const checkoutService = new CheckoutService(this.cache);

    const preparado = await checkoutService.prepararCheckout(userId);

    const grupos = preparado.grupos.map((g) => {
      const seleccion: { tipoEntrega: "DOMICILIO" | "RECOGIDA_TIENDA"; opcionLogisticaId?: string; direccionEntrega?: string } = {
        tipoEntrega: "DOMICILIO",
      };
      if (g.opcionesLogistica.length > 0) {
        seleccion.opcionLogisticaId = g.opcionesLogistica[0]!.id;
      }
      if (g.negocio.permiteEnvio && g.opcionesLogistica.length > 0 && !seleccion.opcionLogisticaId) {
        seleccion.tipoEntrega = "RECOGIDA_TIENDA";
      }
      return {
        negocioId: g.negocioId,
        tipoEntrega: seleccion.tipoEntrega,
        opcionLogisticaId: seleccion.opcionLogisticaId,
        direccionEntrega: "",
      };
    });

    return checkoutService.confirmarCheckout(userId, {
      checkoutToken: preparado.checkoutToken,
      grupos,
    });
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
      data: { opcionLogisticaId: logisticaId },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
            negocio: true,
          },
        },
        opcionLogistica: true,
      },
    });

    await this.invalidateCache(pedido.usuarioId, pedido.id);

    return pedido;
  }

   async actualizarEstado(
    pedidoId: string,
    estado: string
  ): Promise<Pedido> {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: {
        id: true,
        estado: true,
        estadoPago: true,
        negocioId: true,
        usuarioId: true,
      },
    });

    if (!pedido) {
      throw new BusinessError("Pedido no encontrado", "NO_ENCONTRADO", 404);
    }

    // Sincronización de estado de pago:
    // - Al cancelar un pedido con pago COMPLETADO, se exige reembolso previo.
    // - Al completar un pedido con pago PENDIENTE (efectivo), el pago NO se
    //   marca COMPLETADO automáticamente.
    if (estado === "cancelado") {
      const pago = await prisma.pago.findUnique({
        where: { pedidoId },
        select: { id: true, estado: true },
      });

      if (pago && pago.estado === "COMPLETADO") {
        throw new BusinessError(
          "No se puede cancelar un pedido con pago COMPLETADO. Reembolsa el pago primero.",
          "REEMBOLSO_REQUERIDO",
          409
        );
      }
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado },
      include: {
        items: {
          include: {
            producto: true,
            servicio: true,
            negocio: true,
          },
        },
        opcionLogistica: true,
      },
    });

    await this.invalidateCache(pedido.usuarioId, pedido.id);

    return pedidoActualizado;
  }

  async invalidateCache(userId: string, pedidoId?: string): Promise<void> {
    await this.cache.invalidatePrefix(cachePrefixes.pedidosUsuario + userId + ":");
    await this.cache.invalidatePrefix(cachePrefixes.pedidosGrupos + userId + ":");
    if (pedidoId) {
      await this.cache.del(cacheKeys.pedidos.detalle(pedidoId, userId));
    }
  }
}