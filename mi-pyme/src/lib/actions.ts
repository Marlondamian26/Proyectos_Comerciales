"use server";

import { Prisma, TratamientoIVA, type MetodoPago } from "@/generated/prisma/client";

import prisma from "@/lib/db/prisma";
import { cachedQuery } from "@/lib/db/prisma";
import { getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { revalidatePath } from "next/cache";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BCRYPT_ROUNDS } from "@/lib/auth/constants";
import { validarPassword } from "@/lib/auth/password-policy";
import bcrypt from "bcryptjs";
import { BusinessError } from "@/shared/types";
import { DisponibilidadService } from "@/services/DisponibilidadService";
import { AdminDisponibilidadService } from "@/services/AdminDisponibilidadService";
import { NegocioService } from "@/services/NegocioService";
import { SolicitudAltaService } from "@/services/SolicitudAltaService";
import { LogisticaNegocioService } from "@/services/LogisticaNegocioService";
import { DashboardNegocioService } from "@/services/DashboardNegocioService";
import { CatalogService } from "@/services/CatalogService";
import { CheckoutService } from "@/services/CheckoutService";
import { LogisticaService } from "@/services/LogisticaService";
import { PagoService } from "@/services/PagoService";
import IVAService, { type GrupoItemInput } from "@/services/IVAService";
import FacturaService from "@/services/FacturaService";
import { assertPertenencia } from "@/services/utils/permisos";
import { normalizarFecha } from "@/shared/utils/fecha";
import { CODIGO_SIN_DISPONIBILIDAD } from "@/core/constants";
import type { ConfirmarCheckoutPayload, RecalcularSeleccion } from "@/shared/checkout.types";

const RESERVA_TTL_MS = 15 * 60 * 1000;
const disponibilidadService = new DisponibilidadService();
const adminDispService = new AdminDisponibilidadService();
const checkoutService = new CheckoutService();
const logisticaService = new LogisticaService();
const pagoService = new PagoService();
const ivaService = new IVAService();
const facturaService = new FacturaService();
facturaService.setPagoService(pagoService);

async function logAudit(
  eventType: string,
  actorId: string | null,
  targetId: string | null,
  meta?: Prisma.InputJsonValue
) {
  await prisma.auditLog.create({
    data: {
      eventType,
      actorId,
      targetId,
      meta,
    },
  });
}

export async function listarAreas() {
  const cacheKey = cacheKeys.catalogo.areas();
  return cachedQuery(cacheKey, async () => {
    return prisma.area.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });
  });
}

export async function listarSubareas(areaId?: string) {
  const cacheKey = cacheKeys.catalogo.subareas(areaId ? { areaId } : undefined);
  return cachedQuery(cacheKey, async () => {
    return prisma.subarea.findMany({
      where: {
        activo: true,
        ...(areaId && {
          negocios: {
            some: {
              negocio: {
                areaId: areaId,
              },
            },
          },
        }),
      },
      orderBy: { nombre: "asc" },
    });
  });
}

export async function listarNegocios(options?: {
  sort?: { campo?: string; orden?: "asc" | "desc" };
}) {
  const cacheKey = cacheKeys.catalogo.negocios(options?.sort ? { sort: options.sort } : undefined);

  const orderBy: Record<string, "asc" | "desc"> = {};
  if (options?.sort?.campo === "nombre") {
    orderBy.nombre = options.sort.orden ?? "asc";
  } else {
    orderBy.createdAt = "desc";
  }

  return cachedQuery(cacheKey, async () => {
    return prisma.negocio.findMany({
      where: { activo: true },
      include: {
        area: true,
        subareas: {
          include: {
            subarea: true,
          },
        },
      },
      orderBy,
    });
  });
}

export async function listarProductosOrdenados(sort?: { campo?: string; orden?: "asc" | "desc" }) {
  const cacheKey = sort ? cacheKeys.catalogo.productos({ sort }) : cacheKeys.catalogo.productos();

  return cachedQuery(cacheKey, async () => {
  const orderBy: Record<string, "asc" | "desc"> = {};
    if (sort?.campo === "nombre") {
      orderBy.nombre = sort.orden ?? "asc";
    } else {
      orderBy.nombre = "asc";
    }
    return prisma.producto.findMany({
      where: { activo: true },
      include: {
        negocio: true,
        subarea: true,
      },
      orderBy,
    });
  });
}

export async function obtenerNegocioDelUsuario(usuarioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return cachedQuery(cacheKeys.usuario.negocio(usuarioId), async () => {
    const negocio = await prisma.negocio.findFirst({
      where: { userId: usuarioId, activo: true },
      include: { area: true, subareas: true, horarios: { orderBy: { diaSemana: "asc" } } },
    });
    return negocio;
  });
}

export async function listarProductos(filtros?: {
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  disponibleHoy?: boolean;
}) {
  const cacheKey = cacheKeys.catalogo.productos(filtros);

  return cachedQuery(cacheKey, async () => {
    return prisma.producto.findMany({
      where: {
        activo: true,
        ...(filtros?.negocioId && { negocioId: filtros.negocioId }),
        ...(filtros?.subareaId && { subareaId: filtros.subareaId }),
        ...(filtros?.areaId && { negocio: { areaId: filtros.areaId } }),
        ...(filtros?.disponibleHoy !== undefined && {
          disponibleHoy: filtros.disponibleHoy,
        }),
      },
      include: {
        negocio: true,
        subarea: true,
      },
      orderBy: { nombre: "asc" },
    });
  });
}

export async function listarServicios(options?: {
  sort?: { campo?: string; orden?: "asc" | "desc" };
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  activo?: boolean;
}) {
  const cacheKey = cacheKeys.catalogo.servicios(options);

  const orderBy: Record<string, "asc" | "desc"> = {};
  if (options?.sort?.campo === "nombre") {
    orderBy.nombre = options.sort.orden ?? "asc";
  } else {
    orderBy.nombre = "asc";
  }

  return cachedQuery(cacheKey, async () => {
    return prisma.servicio.findMany({
      where: {
        ...(options?.activo !== undefined
          ? { activo: options.activo }
          : { activo: true }),
        ...(options?.negocioId && { negocioId: options.negocioId }),
        ...(options?.subareaId && { subareaId: options.subareaId }),
        ...(options?.areaId && { negocio: { areaId: options.areaId } }),
      },
      include: {
        negocio: true,
        subarea: true,
      },
      orderBy,
    });
  });
}

export async function obtenerCarrito(usuarioId: string) {
  const cacheKey = cacheKeys.carrito.usuario(usuarioId);
  return cachedQuery(cacheKey, async () => {
    return prisma.carrito.findFirst({
      where: { usuarioId, estado: "activo" },
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
  });
}

export async function anadirItemCarrito(
  usuarioId: string,
  datos: {
    productoId?: string;
    servicioId?: string;
    cantidad?: number;
    fechaEntrega?: Date | string | number;
  }
) {
  const cantidad = datos.cantidad ?? 1;
  const fechaEntrega = normalizarFecha(datos.fechaEntrega ?? new Date());

  const carrito = await prisma.carrito.upsert({
    where: {
      usuarioId_estado: {
        usuarioId,
        estado: "activo",
      },
    },
    update: { actualizadoEn: new Date() },
    create: { usuarioId, estado: "activo" },
  });

  const tipo = datos.productoId ? "producto" : "servicio";

  let precioUnitario = 0;

  if (datos.productoId) {
    const producto = await prisma.producto.findUnique({
      where: { id: datos.productoId },
      select: { precio: true, activo: true },
    });
    if (!producto || !producto.activo) {
      throw new Error("Producto no encontrado o no disponible");
    }
    precioUnitario = producto.precio;
  } else if (datos.servicioId) {
    const servicio = await prisma.servicio.findUnique({
      where: { id: datos.servicioId },
      select: { activo: true },
    });
    if (!servicio || !servicio.activo) {
      throw new Error("Servicio no encontrado o no disponible");
    }
  }

  const existingItem = await prisma.carritoItem.findFirst({
    where: {
      carritoId: carrito.id,
      ...(datos.productoId && { productoId: datos.productoId }),
      ...(datos.servicioId && { servicioId: datos.servicioId }),
    },
  });

  const cantidadTotal = (existingItem?.cantidad ?? 0) + cantidad;

  // Validar disponibilidad antes de reservar unidades adicionales.
  if (datos.productoId) {
    await disponibilidadService.puedeComprarProducto(
      datos.productoId,
      cantidadTotal,
      fechaEntrega
    );
  } else if (datos.servicioId) {
    await disponibilidadService.puedeReservarServicio(
      datos.servicioId,
      fechaEntrega,
      cantidadTotal
    );
  }

  if (existingItem) {
    await prisma.carritoItem.update({
      where: { id: existingItem.id },
      data: { cantidad: cantidadTotal, fechaEntrega },
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
      },
    });
  }

  await getCache().del(cacheKeys.carrito.usuario(usuarioId))

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
    throw new Error("Error al obtener el carrito actualizado");
  }

  return updatedCart;
}

export async function listarCarrito(usuarioId: string) {
  return obtenerCarrito(usuarioId);
}

export async function verCarrito(usuarioId: string) {
  await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  return obtenerCarrito(usuarioId);
}

export async function agregarAlCarrito(
  usuarioId: string,
  item: {
    productoId?: string;
    servicioId?: string;
    cantidad?: number;
    fechaEntrega?: Date | string | number;
  }
) {
  await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  return anadirItemCarrito(usuarioId, item);
}

export async function eliminarCarritoItem(itemId: string, usuarioId?: string) {
  await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  await prisma.carritoItem.deleteMany({
    where: {
      id: itemId,
      ...(usuarioId && {
        carrito: { usuarioId, estado: "activo" },
      }),
    },
  });

  if (usuarioId) {
    await getCache().del(cacheKeys.carrito.usuario(usuarioId))
  }
}

export const eliminarItemCarrito = eliminarCarritoItem;

export async function vaciarCarrito(usuarioId: string) {
  await prisma.carritoItem.deleteMany({
    where: {
      carrito: {
        usuarioId,
        estado: "activo",
      },
    },
  });

  await getCache().del(cacheKeys.carrito.usuario(usuarioId))
}

export async function listarReservas(usuarioId: string) {
  const cacheKey = cacheKeys.reservas.usuario(usuarioId);

  return cachedQuery(cacheKey, async () => {
    return prisma.reserva.findMany({
      where: {
        usuarioId,
        estado: {
          in: ["pendiente", "confirmada"],
        },
      },
      include: {
        servicio: true,
        negocio: true,
      },
      orderBy: { fechaHoraInicio: "desc" },
    });
  });
}

export async function cancelarReserva(reservaId: string, usuarioId?: string) {
  await requireRole([Rol.CLIENTE, Rol.ADMIN]);

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    select: { servicioId: true, fechaHoraInicio: true },
  });

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { estado: "cancelada" },
  });

  if (usuarioId) {
    await getCache().invalidatePrefix(cachePrefixes.pedidosUsuario + usuarioId + ":");
  }
  if (reserva?.servicioId) {
    await disponibilidadService.invalidateServicioCache(
      reserva.servicioId,
      reserva.fechaHoraInicio
    );
  }
}

export async function crearReserva(
  usuarioId: string,
  datos: {
    servicioId: string;
    fechaHoraInicio: string;
  }
) {
  await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  const fechaInicio = new Date(datos.fechaHoraInicio);

  const servicio = await prisma.servicio.findUnique({
    where: { id: datos.servicioId },
    select: {
      activo: true,
      duracionMinutos: true,
      capacidad: true,
      negocioId: true,
    },
  });

  if (!servicio) {
    throw new Error("Servicio no encontrado");
  }

  if (!servicio.activo) {
    throw new Error("Servicio no disponible");
  }

  // Validar cupos de hoy contra el calendario de reservas real.
  await disponibilidadService.puedeReservarServicio(
    datos.servicioId,
    fechaInicio,
    1
  );

  const fechaFin = new Date(
    fechaInicio.getTime() + servicio.duracionMinutos * 60 * 1000
  );

  const venceEn = new Date(Date.now() + RESERVA_TTL_MS);

  const reserva = await prisma.reserva.create({
    data: {
      usuarioId,
      servicioId: datos.servicioId,
      negocioId: servicio.negocioId,
      fechaHoraInicio: fechaInicio,
      fechaHoraFin: fechaFin,
      venceEn,
      estado: "pendiente",
    },
  });

    await getCache().del(cacheKeys.reservas.usuario(usuarioId))
    await disponibilidadService.invalidateServicioCache(
    datos.servicioId,
    fechaInicio
  );

  return reserva;
}

export async function listarPedidos(usuarioId: string, options?: { page?: number; limit?: number; search?: string; estado?: string }) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = options ? cacheKeys.pedidos.usuario(usuarioId, { ...(options.page && { page: options.page }), ...(options.limit && { limit: options.limit }), ...(options.search && { search: options.search }), ...(options.estado && { estado: options.estado }) }) : cacheKeys.pedidos.usuario(usuarioId);

  return cachedQuery(cacheKey, async () => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { usuarioId };
    if (options?.search) {
      where.OR = [
        { id: { contains: options.search } },
        { estado: { contains: options.search } },
      ];
    }
    if (options?.estado) {
      where.estado = options.estado;
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          items: {
            include: {
              producto: true,
              servicio: true,
              negocio: true,
            },
           },
           opcionLogistica: true,
           negocio: {
             select: { id: true, nombre: true, direccion: true },
           },
         },
        orderBy: { fechaCreacion: "desc" },
        skip,
        take: limit,
      }),
      prisma.pedido.count({ where }),
    ]);

    return {
      data: pedidos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}

export async function listarPedidosPorNegocio(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = cacheKeys.pedidos.negocio(negocioId);

  return cachedQuery(cacheKey, async () => {
    return prisma.pedido.findMany({
      where: {
        negocioId,
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
        usuario: {
          select: { id: true, email: true, nombre: true },
        },
      },
      orderBy: { fechaCreacion: "desc" },
    });
  });
}

export async function crearPedidoDesdeCarrito(usuarioId: string) {
  await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  return crearPedido(usuarioId, { direccionEntrega: "" });
}

export async function crearPedido(
  usuarioId: string,
  datos: { direccionEntrega: string }
) {
  const carrito = await prisma.carrito.findFirst({
    where: { usuarioId, estado: "activo" },
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
    throw new Error("El carrito no existe o está vacío");
  }

  // Revalidar disponibilidad de todos los items antes de persistir.
  const fechaReferencia = normalizarFecha(new Date());
  const problemas: string[] = [];
  for (const item of carrito.items) {
    const fechaItem = item.fechaEntrega
      ? normalizarFecha(item.fechaEntrega)
      : fechaReferencia;
    try {
      if (item.productoId) {
        const disp = await disponibilidadService.getDisponibilidadProducto(
          item.productoId,
          fechaItem
        );
        const valido =
          disp.disponible &&
          disp.cantidadReservada <= disp.cantidadOfertada &&
          disp.cantidadReservada <= disp.stockFisico;
        if (!valido) {
          problemas.push(
            `producto ${item.producto?.nombre ?? item.productoId}: sin disponibilidad suficiente (oferta ${disp.cantidadOfertada}, reservada ${disp.cantidadReservada}, stock ${disp.stockFisico})`
          );
        }
      } else if (item.servicioId) {
        const cupos = await disponibilidadService.getCuposServicio(
          item.servicioId,
          fechaItem
        );
        const valido =
          cupos.disponible &&
          cupos.cuposDisponibles + item.cantidad <= cupos.capacidad;
        if (!valido) {
          problemas.push(
            `servicio ${item.servicio?.nombre ?? item.servicioId}: sin cupos suficientes (cupos ${cupos.cuposDisponibles})`
          );
        }
      }
    } catch (err: unknown) {
      const detalle =
        item.productoId
          ? `producto ${item.producto?.nombre ?? item.productoId}`
          : `servicio ${item.servicio?.nombre ?? item.servicioId}`;
      problemas.push(
        `${detalle}: ${err instanceof Error ? err.message : "sin disponibilidad"}`
      );
    }
  }

  if (problemas.length > 0) {
    throw new BusinessError(
      `No se puede crear el pedido: ${problemas.join("; ")}`,
      CODIGO_SIN_DISPONIBILIDAD,
      409
    );
  }

  const tieneProductos = carrito.items.some((item) => item.tipo === "producto");
  const tieneServicios = carrito.items.some((item) => item.tipo === "servicio");
  const tipo =
    tieneProductos && tieneServicios
      ? "mixto"
      : tieneProductos
      ? "producto"
      : "servicio";

  const itemNegocioIds = carrito.items.map((item) => {
    const negocioId = item.producto?.negocioId ?? item.servicio?.negocioId;
    if (!negocioId) {
      throw new Error("No se pudo determinar el negocio para un item del carrito");
    }
    return negocioId;
  });

  const negocioIds = Array.from(new Set(itemNegocioIds));
  const negocioPrincipalId = itemNegocioIds[0] ?? "";

  const total = carrito.items.reduce(
    (sum, item) => sum + item.precioUnitario * item.cantidad,
    0
  );

  // TODO: migrar a transacción Serializable en PostgreSQL. En SQLite,
  //  $transaction reduce la ventana de carrera entre validar y persistir.
  const pedido = await prisma.$transaction(async (tx) => {
    const pedidoCreado = await tx.pedido.create({
      data: {
        usuarioId,
        negocioId: negocioPrincipalId,
        total,
        estado: "pendiente",
        tipo,
        tipoEntrega: datos.direccionEntrega
          ? ("DOMICILIO" as const)
          : ("RECOGIDA_TIENDA" as const),
        negocioIds: JSON.stringify(negocioIds),
        direccionEntrega: datos.direccionEntrega || null,
        costoEnvio: 0,
        items: {
          create: carrito.items.map((item) => ({
            productoId: item.productoId,
            servicioId: item.servicioId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.precioUnitario * item.cantidad,
            negocioId:
              item.producto?.negocioId ?? item.servicio?.negocioId ?? "",
            fechaEntrega: item.fechaEntrega ?? undefined,
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

    await tx.carritoItem.deleteMany({
      where: { carritoId: carrito.id },
    });

    return pedidoCreado;
  });

  await getCache().del(cacheKeys.carrito.usuario(usuarioId));
  await getCache().invalidatePrefix(cachePrefixes.pedidosUsuario + usuarioId + ":");

  // Invalidar disponibilidad de los productos afectados.
  for (const item of carrito.items) {
    if (item.productoId) {
      await disponibilidadService.invalidateProductoCache(item.productoId);
    }
  }

  return pedido;
}

export async function listarOpcionesLogisticas(negocioId?: string) {
  await requireRole([Rol.LOGISTICA, Rol.ADMIN]);
  const cacheKey = cacheKeys.logistica.opciones(negocioId);

  return cachedQuery(cacheKey, async () => {
    return prisma.opcionLogistica.findMany({
      where: {
        ...(negocioId && { negocioId }),
      },
      include: {
        proveedor: true,
        negocio: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function listarOpcionesLogistica(negocioId?: string) {
  return listarOpcionesLogisticas(negocioId);
}

export async function listarProveedoresLogisticos() {
  await requireRole([Rol.LOGISTICA, Rol.ADMIN]);
  return cachedQuery(cacheKeys.logistica.proveedores(), async () => {
    return prisma.proveedorLogistico.findMany({
      where: { activo: true },
      include: {
        opciones: true,
      },
      orderBy: { nombre: "asc" },
    });
  });
}

export async function listarPedidosAsignados(usuarioId: string) {
  await requireRole([Rol.LOGISTICA, Rol.ADMIN]);
  const cacheKey = cacheKeys.logistica.pedidos(usuarioId);

  return cachedQuery(cacheKey, async () => {
    const proveedor = await prisma.proveedorLogistico.findFirst({
      where: { usuarioId },
      include: { opciones: true },
    });

    if (!proveedor) {
      return [];
    }

    const opcionesLogisticasIds = proveedor.opciones.map((o) => o.id);

    return prisma.pedido.findMany({
      where: {
        opcionLogisticaId: { in: opcionesLogisticasIds },
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
        usuario: {
          select: { id: true, email: true, nombre: true },
        },
      },
      orderBy: { fechaCreacion: "desc" },
    });
  });
}

export async function actualizarEstadoPedido(
  pedidoId: string,
  estado: string
) {
  await requireRole([Rol.LOGISTICA, Rol.ADMIN]);

  const pedido = await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado },
  });

  if (pedido) {
    await getCache().invalidatePrefix(cachePrefixes.pedidosUsuario + pedido.usuarioId + ":");
    await getCache().invalidatePrefix(cachePrefixes.logisticaPedidos);
  }

  return pedido;
}

export async function asignarLogistica(
  pedidoId: string,
  opcionLogisticaId: string
) {
  await requireRole([Rol.LOGISTICA, Rol.ADMIN]);
  const opcionLogistica = await prisma.opcionLogistica.findUnique({
    where: { id: opcionLogisticaId },
  });

  if (!opcionLogistica) {
    throw new Error("Opcion logistica no encontrada");
  }

  const pedido = await prisma.pedido.update({
    where: { id: pedidoId },
    data: { opcionLogisticaId },
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

   await getCache().invalidatePrefix(cachePrefixes.pedidosUsuario + pedido.usuarioId + ":");
   await getCache().invalidatePrefix(cachePrefixes.logisticaPedidos);

   return pedido;
  }

  export async function asignarLogisticaForm(
   prevState: { error?: string; ok?: boolean } | undefined,
   data: FormData
) {
    const pedidoId = data.get("pedidoId") as string;
    const opcionLogisticaId = data.get("opcionLogisticaId") as string;

    if (!pedidoId || !opcionLogisticaId) {
      return { error: "Faltan parámetros: pedidoId y opcionLogisticaId son requeridos" };
    }

    try {
      const pedido = await asignarLogistica(pedidoId, opcionLogisticaId);
     revalidatePath("/logistica");
     revalidatePath("/pedidos");
     return { ok: true, pedido };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// -- Checkout --

export async function prepararCheckoutAction(options?: { direccionEntrega?: string }) {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  try {
    const result = await checkoutService.prepararCheckout(session.id, options);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function confirmarCheckoutAction(payload: ConfirmarCheckoutPayload) {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  try {
    const result = await checkoutService.confirmarCheckout(session.id, payload);
    revalidatePath("/pedidos");
    revalidatePath("/carrito");

    // Filtrar código de entrega para non-CLIENTE roles (solo CLIENTE lo ve)
    if (session.rol !== Rol.CLIENTE) {
      result.pedidosCreados = result.pedidosCreados.map((p: any) => ({
        ...p,
        codigoEntrega: null,
      }));
    }

    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function recalcularTotalesAction(seleccion: RecalcularSeleccion) {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  try {
    return await checkoutService.recalcularTotales(session.id, seleccion);
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getOpcionesLogisticaAction(negocioId: string) {
  try {
    return await logisticaService.listOpcionesParaCheckout(negocioId);
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listarPedidosDeUsuarioAction(options?: { page?: number; limit?: number; estado?: string }) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = options
    ? cacheKeys.pedidos.usuario(session.id, { ...(options.page && { page: options.page }), ...(options.limit && { limit: options.limit }), ...(options.estado && { estado: options.estado }) })
    : cacheKeys.pedidos.usuario(session.id);

  return cachedQuery(cacheKey, async () => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { usuarioId: session.id };
    if (options?.estado) {
      where.estado = options.estado;
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          items: {
            include: { producto: true, servicio: true, negocio: true },
          },
          opcionLogistica: true,
          negocio: true,
        },
        orderBy: { fechaCreacion: "desc" },
        skip,
        take: limit,
      }),
      prisma.pedido.count({ where }),
    ]);

    return {
      data: pedidos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}

export async function getPedidoAction(pedidoId: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = cacheKeys.pedidos.detalle(pedidoId, session.id);

  return cachedQuery(cacheKey, async () => {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        items: {
          include: { producto: true, servicio: true, negocio: true },
        },
        opcionLogistica: true,
        negocio: true,
        factura: true,
        usuario: {
          select: { id: true, email: true, nombre: true },
        },
      },
    });

    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // Validar propiedad: el cliente solo ve sus pedidos, el negocio ve los suyos
    if (session.rol === Rol.CLIENTE && pedido.usuarioId !== session.id) {
      throw new Error("No tienes permiso para ver este pedido");
    }
    if (session.rol === Rol.NEGOCIO && pedido.negocioId !== session.id) {
      throw new Error("No tienes permiso para ver este pedido");
    }

    return pedido;
  });
}

export async function cambiarEstadoPedidoAction(pedidoId: string, nuevoEstado: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.LOGISTICA, Rol.ADMIN]);

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { negocioId: true, estado: true },
  });

  if (!pedido) {
    throw new Error("Pedido no encontrado");
  }

  if (session.rol === Rol.NEGOCIO && pedido.negocioId !== session.id) {
    throw new Error("No tienes permiso para modificar este pedido");
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: nuevoEstado },
  });

   await getCache().del(cacheKeys.pedidos.detalle(pedidoId))
   await getCache().invalidatePrefix(cachePrefixes.pedidosNegocio + pedido.negocioId + ":");
   revalidatePath("/dashboard/negocio/pedidos");
}

export async function listarFacturas(usuarioId?: string, negocioId?: string, options?: { page?: number; limit?: number }) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  return facturaService.listarFacturas(usuarioId, negocioId, options);
}

export async function emitirFactura(pedidoId: string, _params?: Record<string, unknown>) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return facturaService.emitirFactura(pedidoId);
}

export async function getDatosFiscalesAction(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: {
      regimenFiscal: true,
      tasaIVA: true,
      modoPrecio: true,
      nit: true,
      direccionFiscal: true,
      telefonoFiscal: true,
      emailFiscal: true,
      prefijoFactura: true,
    },
  });
  if (!negocio) {
    throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
  }
  return {
    regimenFiscal: negocio.regimenFiscal,
    tasaIVA: Number(negocio.tasaIVA),
    modoPrecio: negocio.modoPrecio,
    nit: negocio.nit,
    direccionFiscal: negocio.direccionFiscal,
    telefonoFiscal: negocio.telefonoFiscal,
    emailFiscal: negocio.emailFiscal,
    prefijoFactura: negocio.prefijoFactura,
  };
}

export async function actualizarDatosFiscalesAction(
  negocioId: string,
  datos: {
    regimenFiscal?: string;
    tasaIVA?: number | string;
    modoPrecio?: string;
    nit?: string | null;
    direccionFiscal?: string | null;
    telefonoFiscal?: string | null;
     emailFiscal?: string | null;
     prefijoFactura?: string;
     confirmarCambioRegimen?: boolean;
   }
 ) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
    const result = await negocioService.actualizarDatosFiscales(
    negocioId,
    datos,
    session.id,
    session.rol as Rol
  );
  revalidatePath("/negocio/mi-negocio");
  revalidatePath("/negocio");
  return result;
}

export async function getFacturaAction(facturaId: string) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  return facturaService.getFactura(facturaId);
}

export async function descargarFacturaAction(facturaId: string) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  return facturaService.descargarFactura(facturaId);
}

export async function simularIVAAction(params: {
  negocioId: string;
  items: Array<{
    precio: number | string;
    cantidad: number;
    tratamientoIVA: string;
    tasaOverride?: number | string | null;
  }>;
}) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);

  const negocio = await prisma.negocio.findUnique({
    where: { id: params.negocioId },
    select: { regimenFiscal: true, tasaIVA: true, modoPrecio: true },
  });

  if (!negocio) {
    throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
  }

  const negocioFiscal = {
    regimenFiscal: negocio.regimenFiscal,
    tasaIVA: negocio.tasaIVA,
    modoPrecio: negocio.modoPrecio,
  };

  const itemsFiscales = params.items.map((i) => ({
    precio: i.precio,
    cantidad: i.cantidad,
    tratamientoIVA: i.tratamientoIVA as TratamientoIVA,
    tasaOverride: i.tasaOverride ?? null,
  }));

  const calculoGrupo = ivaService.calcularGrupo(itemsFiscales, negocioFiscal);

  return {
    baseImponible: Number(calculoGrupo.baseImponible.toFixed(2)),
    montoIVA: Number(calculoGrupo.montoIVA.toFixed(2)),
    totalConIVA: Number(calculoGrupo.totalConIVA.toFixed(2)),
    regimenFiscal: negocio.regimenFiscal,
    modoPrecio: negocio.modoPrecio,
    tasaIVA: Number(negocio.tasaIVA),
    items: calculoGrupo.items.map((item) => ({
      baseImponible: Number(item.baseImponible.toFixed(2)),
      montoIVA: Number(item.montoIVA.toFixed(2)),
      subtotal: Number(item.subtotal.toFixed(2)),
      tratamientoIVA: item.tratamientoIVA,
      tasaAplicada: Number(item.tasaAplicada.toFixed(2)),
    })),
  };
}

export async function reporteVentasPorDia(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
   const cacheKey = cacheKeys.reporte.ventas(negocioId);

   return cachedQuery(cacheKey, async () => {
    const items = await prisma.pedidoItem.findMany({
      where: { negocioId },
      select: {
        subtotal: true,
        cantidad: true,
        pedido: {
          select: { fechaCreacion: true },
        },
      },
    });

    const ventasPorDiaMap: Record<
      string,
      { fecha: string; totalVentas: number; cantidad: number }
    > = {};

    items.forEach((item) => {
      const fecha = new Date(item.pedido.fechaCreacion)
        .toISOString()
        .split("T")[0];
      if (!ventasPorDiaMap[fecha]) {
        ventasPorDiaMap[fecha] = { fecha, totalVentas: 0, cantidad: 0 };
      }
       ventasPorDiaMap[fecha].totalVentas += Number(item.subtotal);
      ventasPorDiaMap[fecha].cantidad += item.cantidad;
    });

    return Object.values(ventasPorDiaMap).sort((a, b) =>
      b.fecha.localeCompare(a.fecha)
    );
  });
}

export async function reporteVentasGlobal() {
  await requireRole([Rol.ADMIN]);
  const cacheKey = cacheKeys.reporte.ventasGlobal();

  return cachedQuery(cacheKey, async () => {
    const items = await prisma.pedidoItem.findMany({
      select: {
        subtotal: true,
        cantidad: true,
        pedido: {
          select: { fechaCreacion: true },
        },
      },
    });

    const ventasPorDiaMap: Record<
      string,
      { fecha: string; totalVentas: number; cantidad: number }
    > = {};

    items.forEach((item) => {
      const fecha = new Date(item.pedido.fechaCreacion)
        .toISOString()
        .split("T")[0];
      if (!ventasPorDiaMap[fecha]) {
        ventasPorDiaMap[fecha] = { fecha, totalVentas: 0, cantidad: 0 };
      }
       ventasPorDiaMap[fecha].totalVentas += Number(item.subtotal);
      ventasPorDiaMap[fecha].cantidad += item.cantidad;
    });

    return Object.values(ventasPorDiaMap).sort((a, b) =>
      b.fecha.localeCompare(a.fecha)
    );
  });
}

export async function reporteProductosMasVendidos(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = cacheKeys.reporte.productos(negocioId);

  return cachedQuery(cacheKey, async () => {
    const items = await prisma.pedidoItem.findMany({
      where: {
        negocioId,
        productoId: { not: null },
      },
      select: {
        cantidad: true,
        subtotal: true,
        producto: {
          select: { id: true, nombre: true },
        },
      },
    });

    const productosMap: Record<
      string,
      { nombre: string; cantidad: number; totalVentas: number }
    > = {};

    items.forEach((item) => {
      const key = item.producto!.id;
      if (!productosMap[key]) {
        productosMap[key] = {
          nombre: item.producto!.nombre,
          cantidad: 0,
          totalVentas: 0,
        };
      }
      productosMap[key].cantidad += item.cantidad;
       productosMap[key].totalVentas += Number(item.subtotal);
    });

    return Object.entries(productosMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalVentas - a.totalVentas);
  });
}

export async function reporteInventario(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = cacheKeys.reporte.inventario(negocioId);

  return cachedQuery(cacheKey, async () => {
    const inventarios = await prisma.inventario.findMany({
      where: {
        producto: { negocioId },
      },
      include: {
        producto: true,
      },
      orderBy: { cantidadActual: "asc" },
    });

    return inventarios.map((inv) => ({
      id: inv.id,
      producto: inv.producto.nombre,
      cantidadActual: inv.cantidadActual,
      puntoReorden: inv.puntoReorden,
      ubicacion: inv.ubicacion,
    }));
  });
}

export async function productosMasVendidos(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = cacheKeys.reporte.productosVendidos(negocioId);

  return cachedQuery(cacheKey, async () => {
    const items = await prisma.pedidoItem.findMany({
      where: {
        negocioId,
        productoId: { not: null },
      },
      select: {
        cantidad: true,
        subtotal: true,
        producto: {
          select: { id: true, nombre: true },
        },
      },
    });

    const productosMap: Record<
      string,
      { nombre: string; cantidad: number; totalVentas: number }
    > = {};

    items.forEach((item) => {
      const key = item.producto!.id;
      if (!productosMap[key]) {
        productosMap[key] = {
          nombre: item.producto!.nombre,
          cantidad: 0,
          totalVentas: 0,
        };
      }
      productosMap[key].cantidad += item.cantidad;
       productosMap[key].totalVentas += Number(item.subtotal);
    });

    return Object.entries(productosMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });
}

export async function estadoInventario(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = cacheKeys.reporte.inventivoEstado(negocioId);

  return cachedQuery(cacheKey, async () => {
    const inventarios = await prisma.inventario.findMany({
      where: {
        producto: { negocioId },
      },
      include: {
        producto: true,
      },
      orderBy: { cantidadActual: "asc" },
    });

    return inventarios.map((inv) => ({
      id: inv.id,
      producto: inv.producto.nombre,
      cantidadActual: inv.cantidadActual,
      puntoReorden: inv.puntoReorden,
      ubicacion: inv.ubicacion,
      enPuntoReorden: inv.cantidadActual <= inv.puntoReorden,
    }));
  });
}

export async function listarUsuarios() {
  await requireRole([Rol.ADMIN]);
  return cachedQuery(cacheKeys.usuario.all(), async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function estadoUsuario(usuarioId: string) {
  await requireRole([Rol.ADMIN]);
  return cachedQuery(cacheKeys.usuario.detalle(usuarioId), async () => {
    const user = await prisma.user.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new Error("Usuario no encontrado");
    return user;
  });
}

export async function cambiarEstadoUsuario(
  usuarioId: string,
  datos: { rol?: Rol; nombre?: string }
) {
  await requireRole([Rol.ADMIN]);

  const data: { rol?: Rol; nombre?: string; sessionVersion?: { increment: number } } = {};

  if (datos.rol !== undefined) data.rol = datos.rol;
  if (datos.nombre !== undefined) data.nombre = datos.nombre;

  if (datos.rol !== undefined) {
    data.sessionVersion = { increment: 1 };
  }

  await prisma.user.update({
    where: { id: usuarioId },
    data,
  });

  await getCache().del(cacheKeys.usuario.all());
  await getCache().del(cacheKeys.usuario.detalle(usuarioId));
  await getCache().del(cacheKeys.negocio.porUsuario(usuarioId));

  return prisma.user.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function cambiarEstadoArea(areaId: string, activo: boolean) {
  await requireRole([Rol.ADMIN]);

  await prisma.area.update({
    where: { id: areaId },
    data: { activo },
  });

  await getCache().del(cacheKeys.catalogo.areas());
  await getCache().del(`area:${areaId}`);

  return prisma.area.findUnique({
    where: { id: areaId },
  });
}

export async function cambiarEstadoSubarea(subareaId: string, activo: boolean) {
  await requireRole([Rol.ADMIN]);

  await prisma.subarea.update({
    where: { id: subareaId },
    data: { activo },
  });

  await getCache().invalidatePrefix("catalogo:subareas");
  await getCache().del(`subarea:${subareaId}`);

  return prisma.subarea.findUnique({
    where: { id: subareaId },
  });
}

export async function cambiarEstadoNegocio(negocioId: string, activo: boolean) {
  await requireRole([Rol.ADMIN]);

  await prisma.negocio.update({
    where: { id: negocioId },
    data: { activo },
  });

  await getCache().del(cacheKeys.catalogo.negocios());
  await getCache().del(cacheKeys.negocio.detalle(negocioId));

  return prisma.negocio.findUnique({
    where: { id: negocioId },
  });
}

export async function togglePermiteReservas(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!negocio) throw new Error("Negocio no encontrado");

  await prisma.negocio.update({
    where: { id: negocioId },
    data: { permiteReservas: !negocio.permiteReservas },
  });
  await getCache().del(cacheKeys.catalogo.negocios());
  await getCache().del(cacheKeys.negocio.detalle(negocioId));
  return prisma.negocio.findUnique({ where: { id: negocioId } });
}

export async function togglePermiteEnvio(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!negocio) throw new Error("Negocio no encontrado");

  await prisma.negocio.update({
    where: { id: negocioId },
    data: { permiteEnvio: !negocio.permiteEnvio },
  });
  await getCache().del(cacheKeys.catalogo.negocios());
  await getCache().del(cacheKeys.negocio.detalle(negocioId));
  return prisma.negocio.findUnique({ where: { id: negocioId } });
}

export async function crearArea(nombre: string, slug: string) {
  await requireRole([Rol.ADMIN]);

  const existing = await prisma.area.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error("Ya existe un área con ese slug");
  }

  return prisma.area.create({
    data: { nombre, slug, activo: true },
  });
}

export async function crearSubarea(nombre: string, slug: string) {
  await requireRole([Rol.ADMIN]);

  const existing = await prisma.subarea.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new Error("Ya existe una subárea con ese slug");
  }

  return prisma.subarea.create({
    data: { nombre, slug, activo: true },
  });
}

export async function actualizarArea(
  areaId: string,
  datos: { nombre?: string; slug?: string; activo?: boolean }
) {
  await requireRole([Rol.ADMIN]);

  await getCache().del(cacheKeys.catalogo.areas());
  await getCache().del(`area:${areaId}`);

  return prisma.area.update({
    where: { id: areaId },
    data: datos,
  });
}

export async function actualizarSubarea(
  subareaId: string,
  datos: { nombre?: string; slug?: string; activo?: boolean }
) {
  await requireRole([Rol.ADMIN]);

  await getCache().invalidatePrefix("catalogo:subareas");
  await getCache().del(`subarea:${subareaId}`);

  return prisma.subarea.update({
    where: { id: subareaId },
    data: datos,
  });
}

export async function crearNegocio(
  datos: {
    nombre: string;
    slug?: string;
    descripcion?: string;
    areaId?: string;
    subareaIds?: string[];
  }
) {
  await requireRole([Rol.ADMIN]);

  const existing = await prisma.negocio.findUnique({
    where: { slug: datos.slug ?? "" },
  });

  if (existing) {
    throw new Error("Ya existe un negocio con ese slug");
  }

  return prisma.negocio.create({
    data: {
      nombre: datos.nombre,
      slug: datos.slug ?? "",
      descripcion: datos.descripcion,
      areaId: datos.areaId,
      activo: true,
      subareas:
        datos.subareaIds && datos.subareaIds.length > 0
          ? {
              create: datos.subareaIds.map((sid) => ({ subareaId: sid })),
            }
          : undefined,
    },
  });
}

export async function actualizarNegocio(
  negocioId: string,
  datos: { nombre?: string; descripcion?: string; activo?: boolean; areaId?: string }
) {
  await requireRole([Rol.ADMIN]);

  await getCache().del(cacheKeys.catalogo.negocios());
  await getCache().del(cacheKeys.negocio.detalle(negocioId));

  return prisma.negocio.update({
    where: { id: negocioId },
    data: datos,
  });
}


export async function registrarUsuario(
  datos: {
    nombre: string;
    username: string;
    email: string;
    password: string;
    rol?: string;
    provincia?: string;
    municipio?: string;
  }
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.email)) {
      return { success: false, error: "Email invalido" };
    }

    if (!datos.username || datos.username.trim().length < 3) {
      return { success: false, error: "El nombre de usuario debe tener al menos 3 caracteres" };
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(datos.username)) {
      return { success: false, error: "El nombre de usuario solo puede contener letras, numeros y guiones bajos" };
    }

    const passwordValidation = validarPassword(datos.password);
    if (!passwordValidation.valida) {
      return { success: false, error: passwordValidation.errores.join("; ") };
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: datos.email },
    });
    if (existingEmail) {
      return { success: false, error: "Ya existe un usuario con ese email" };
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: datos.username },
    });
    if (existingUsername) {
      return { success: false, error: "Ya existe un usuario con ese nombre de usuario" };
    }

    const hashedPassword = await bcrypt.hash(datos.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: datos.email,
        username: datos.username,
        password: hashedPassword,
        nombre: datos.nombre,
        rol: "CLIENTE",
        provincia: datos.provincia,
        municipio: datos.municipio,
      },
    });

    return { success: true, userId: user.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error registering user:", message, err);
    return { success: false, error: `Error al registrar usuario: ${message}` };
  }
}

export async function obtenerPerfil(usuarioId: string) {
  const user = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      email: true,
      nombre: true,
      username: true,
      rol: true,
      provincia: true,
      municipio: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

export async function actualizarPerfil(
  usuarioId: string,
  datos: { nombre?: string; username?: string; email?: string; provincia?: string; municipio?: string }
) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA, Rol.ADMIN]);

  if (datos.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.email)) {
      throw new Error("Email invalido");
    }
    const existing = await prisma.user.findUnique({
      where: { email: datos.email },
    });
    if (existing && existing.id !== usuarioId) {
      throw new Error("Ya existe un usuario con ese email");
    }
  }

  if (datos.username) {
    const existing = await prisma.user.findUnique({
      where: { username: datos.username },
    });
    if (existing && existing.id !== usuarioId) {
      throw new Error("Ya existe un usuario con ese nombre de usuario");
    }
  }

  const user = await prisma.user.update({
    where: { id: usuarioId },
    data: datos,
    select: {
      id: true,
      email: true,
      nombre: true,
      username: true,
      rol: true,
      provincia: true,
      municipio: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await getCache().del(cacheKeys.usuario.detalle(usuarioId));
  await getCache().del(cacheKeys.usuario.all());

  return user;
}

export async function cambiarPassword(
  usuarioId: string,
  datos: { passwordActual: string; passwordNuevo: string }
) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA, Rol.ADMIN]);

  const passwordValidation = validarPassword(datos.passwordNuevo);
  if (!passwordValidation.valida) {
    throw new Error(passwordValidation.errores.join("; "));
  }

  const user = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { password: true, mustChangePassword: true },
  });

  if (!user || !user.password) {
    throw new Error("Usuario no encontrado o sin contraseña");
  }

  const isValid = await bcrypt.compare(datos.passwordActual, user.password);
  if (!isValid) {
    throw new Error("La contraseña actual es incorrecta");
  }

  const hashedPassword = await bcrypt.hash(datos.passwordNuevo, BCRYPT_ROUNDS);

  const wasForced = user.mustChangePassword;

  await prisma.user.update({
    where: { id: usuarioId },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
      sessionVersion: { increment: 1 },
    },
  });

  if (wasForced) {
    await logAudit("PASSWORD_CAMBIADO_OBLIGATORIO", usuarioId, usuarioId, {
      reason: "Password changed due to mustChangePassword flag",
    });
  }

  await logAudit("PASSWORD_CAMBIADO", usuarioId, usuarioId, {});

  return { success: true };
}

async function getActiveAdminCount(): Promise<number> {
  return prisma.user.count({
    where: {
      rol: "ADMIN",
      isActive: true,
    },
  });
}

export async function ensureGenericAdminExists(actorId?: string) {
  const adminCount = await getActiveAdminCount();
  if (adminCount > 0) return;

  const genericAdmin = await prisma.user.findFirst({
    where: { email: "admin@mi-pyme.local" },
  });

  const GENERIC_ADMIN_PASSWORD = process.env.GENERIC_ADMIN_PASSWORD || "12345678";
  const hashedPassword = await bcrypt.hash(GENERIC_ADMIN_PASSWORD, 12);

  if (genericAdmin) {
    await prisma.user.update({
      where: { id: genericAdmin.id },
      data: {
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
        rol: "ADMIN",
        password: hashedPassword,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
    });
    await logAudit("GENERIC_ADMIN_RECREATED", actorId ?? null, genericAdmin.id, {
      reason: "No active admins found",
    });
  } else {
    const newAdmin = await prisma.user.create({
      data: {
        email: "admin@mi-pyme.local",
        username: "admin",
        password: hashedPassword,
        nombre: "Administrador Genérico",
        rol: "ADMIN",
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
      },
    });
    await logAudit("GENERIC_ADMIN_CREATED", actorId ?? null, newAdmin.id, {
      reason: "No active admins found",
    });
  }

  await getCache().del(cacheKeys.usuario.all());
}

async function deactivateGenericAdmin(actorId: string) {
  const genericAdmin = await prisma.user.findFirst({
    where: { isGenericAdmin: true, isActive: true },
  });

  if (genericAdmin) {
    await prisma.user.update({
      where: { id: genericAdmin.id },
      data: { isActive: false, isGenericAdmin: false },
    });
    await logAudit("GENERIC_ADMIN_DEACTIVATED_BY_ADMIN", actorId, genericAdmin.id, {
      reason: "New admin created",
    });
    await getCache().del(cacheKeys.usuario.all())
  }
}export async function eliminarCuenta(
  usuarioId: string,
  datos: { password: string }
) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA, Rol.ADMIN]);

  const user = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { id: true, password: true, rol: true, isGenericAdmin: true },
  });

  if (!user || !user.password) {
    throw new Error("Usuario no encontrado o sin contraseña");
  }

  const isValid = await bcrypt.compare(datos.password, user.password);
  if (!isValid) {
    await logAudit("FAILED_DELETE_ATTEMPT", usuarioId, usuarioId, {
      reason: "Invalid password",
    });
    throw new Error("La contraseña es incorrecta");
  }

  const isAdmin = user.rol === "ADMIN";
  const isLastAdmin = isAdmin && (await getActiveAdminCount()) === 1;

  if (isLastAdmin) {
    throw new Error(
      "No se puede eliminar la última cuenta de administrador directamente. Use la función de eliminación de último administrador."
    );
  }

  await prisma.user.update({
    where: { id: usuarioId },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: usuarioId,
      deletedReason: "Eliminación voluntaria de cuenta",
      sessionVersion: { increment: 1 },
    },
  });

  await logAudit("ACCOUNT_DELETED", usuarioId, usuarioId, {
    rol: user.rol,
    wasGenericAdmin: user.isGenericAdmin,
  });

  await getCache().del(cacheKeys.usuario.all());
  await getCache().del(cacheKeys.usuario.detalle(usuarioId));

  await ensureGenericAdminExists(usuarioId);

  return { success: true };
}

export async function eliminarUltimoAdmin(
  usuarioId: string,
  datos: { adminPassword: string; genericAdminPassword: string }
) {
  await requireRole([Rol.ADMIN]);

  const user = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { id: true, password: true, rol: true, isGenericAdmin: true },
  });

  if (!user || !user.password) {
    throw new Error("Usuario no encontrado o sin contraseña");
  }

  if (user.rol !== "ADMIN") {
    throw new Error("Solo los administradores pueden usar esta función");
  }

  const adminCount = await getActiveAdminCount();
  if (adminCount !== 1) {
    throw new Error("Esta función solo está disponible cuando eres el único administrador activo");
  }

  const isAdminPasswordValid = await bcrypt.compare(datos.adminPassword, user.password);
  if (!isAdminPasswordValid) {
    await logAudit("FAILED_DELETE_ATTEMPT", usuarioId, usuarioId, {
      reason: "Invalid admin password for last admin deletion",
    });
    throw new Error("La contraseña de administrador es incorrecta");
  }

  const GENERIC_ADMIN_PASSWORD = process.env.GENERIC_ADMIN_PASSWORD || "12345678";
  const isGenericPasswordValid = await bcrypt.compare(datos.genericAdminPassword, user.password);
  if (!isGenericPasswordValid) {
    await logAudit("FAILED_DELETE_ATTEMPT", usuarioId, usuarioId, {
      reason: "Invalid generic admin password for last admin deletion",
    });
    throw new Error("La contraseña genérica es incorrecta");
  }

  await prisma.user.update({
    where: { id: usuarioId },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: usuarioId,
      deletedReason: "Eliminación del último administrador con doble confirmación",
      sessionVersion: { increment: 1 },
    },
  });

  await logAudit("LAST_ADMIN_DELETED_BY_SELF", usuarioId, usuarioId, {
    reason: "Last admin deleted with dual password confirmation",
  });

  await getCache().del(cacheKeys.usuario.all());
  await getCache().del(cacheKeys.usuario.detalle(usuarioId));

  await ensureGenericAdminExists(usuarioId);

  return { success: true };
}

export async function asignarRolAdmin(usuarioId: string, actorId: string) {
  await requireRole([Rol.ADMIN]);

  const targetUser = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { id: true, rol: true },
  });

  if (!targetUser) {
    throw new Error("Usuario no encontrado");
  }

  if (targetUser.rol === "ADMIN") {
    throw new Error("El usuario ya es administrador");
  }

  await deactivateGenericAdmin(actorId);

  await prisma.user.update({
    where: { id: usuarioId },
    data: {
      rol: "ADMIN",
      sessionVersion: { increment: 1 },
    },
  });

  await getCache().del(cacheKeys.usuario.all());
  await getCache().del(cacheKeys.usuario.detalle(usuarioId));
  await getCache().del(cacheKeys.negocio.porUsuario(usuarioId));

  return prisma.user.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      isGenericAdmin: true,
      mustChangePassword: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Disponibilidad diaria (Fase 1 — Punto 2)
// ---------------------------------------------------------------------------

export async function getDisponibilidadProductoAction(
  productoId: string,
  fecha?: Date | string | number
) {
  return disponibilidadService.getDisponibilidadProducto(productoId, fecha);
}

export async function getDisponibilidadSemanaAction(productoId: string) {
  return disponibilidadService.listarDisponibilidadSemana(productoId);
}

export async function getCuposServicioAction(
  servicioId: string,
  fecha?: Date | string | number
) {
  return disponibilidadService.getCuposServicio(servicioId, fecha);
}

export async function setDisponibilidadAction(
  productoId: string,
  fecha: Date | string | number,
  cantidad: number,
  notas?: string
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  await adminDispService.setDisponibilidadAutorizado(
    session.id,
    productoId,
    fecha,
    cantidad,
    notas
  );
  revalidatePath("/catalogo");
  revalidatePath("/dashboard/negocio/disponibilidad");
}

export async function bulkSetDisponibilidadAction(
  productoId: string,
  fechas: Array<Date | string | number>,
  cantidad: number
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const total = await adminDispService.bulkSetDisponibilidadAutorizado(
    session.id,
    productoId,
    fechas,
    cantidad
  );
  revalidatePath("/catalogo");
  revalidatePath("/dashboard/negocio/disponibilidad");
  return total;
}

export async function validarCarritoAction() {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  const cartService = new (await import("@/services/CartService")).CartService();
  return cartService.validarCarritoCompleto(session.id);
}

/**
 * Lista productos enriquecidos con disponibilidad de hoy (batch).
 */
export async function listarProductosConDisponibilidad(filtros?: {
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  disponibleHoy?: boolean;
}) {
  await getCache().invalidatePrefix(cachePrefixes.catalogo + "productos");
  const cacheKey = cacheKeys.catalogo.productos(filtros);
  return cachedQuery(cacheKey, async () => {
    const productos = await prisma.producto.findMany({
      where: {
        activo: true,
        ...(filtros?.negocioId && { negocioId: filtros.negocioId }),
        ...(filtros?.subareaId && { subareaId: filtros.subareaId }),
        ...(filtros?.areaId && { negocio: { areaId: filtros.areaId } }),
        ...(filtros?.disponibleHoy !== undefined && {
          disponibleHoy: filtros.disponibleHoy,
        }),
      },
      include: {
        negocio: true,
        subarea: true,
        disponibilidades: {
          where: { fecha: normalizarFecha(new Date()) },
        },
      },
      orderBy: { nombre: "asc" },
    });

    const ids = productos.map((p) => p.id);
    const mapa = await disponibilidadService.getDisponibilidadProductos(ids);

    return productos.map((p) => {
      const disp = mapa.get(p.id) ?? null;
      return {
        ...p,
        disponibleHoy: disp
          ? {
              cantidadDisponible: disp.cantidadDisponible,
              disponible: disp.disponible,
              cantidadReservada: disp.cantidadReservada,
            }
          : null,
      };
    });
  });
}

/**
 * Lista servicios enriquecidos con cupos disponibles hoy.
 */
export async function listarServiciosConCupos(filtros?: {
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  activo?: boolean;
}) {
  const cacheKey = cacheKeys.catalogo.servicios(filtros);
  return cachedQuery(cacheKey, async () => {
    const servicios = await prisma.servicio.findMany({
      where: {
        ...(filtros?.activo !== undefined
          ? { activo: filtros.activo }
          : { activo: true }),
        ...(filtros?.negocioId && { negocioId: filtros.negocioId }),
        ...(filtros?.subareaId && { subareaId: filtros.subareaId }),
        ...(filtros?.areaId && { negocio: { areaId: filtros.areaId } }),
      },
      include: {
        negocio: true,
        subarea: true,
      },
      orderBy: { nombre: "asc" },
    });

    const resultados = await Promise.all(
      servicios.map(async (s) => {
        const cupos = await disponibilidadService.getCuposServicio(s.id);
        return { ...s, cuposDisponiblesHoy: cupos };
      })
    );

    return resultados;
  });
}

/**
 * Obtiene un producto individual enriquecido con disponibilidad de hoy.
 */
export async function obtenerProductoConDisponibilidadAction(id: string) {
  const producto = await prisma.producto.findUnique({
    where: { id, activo: true },
    include: {
      negocio: true,
      subarea: true,
      disponibilidades: {
        where: { fecha: normalizarFecha(new Date()) },
      },
    },
  });

  if (!producto) return null;

  const mapa = await disponibilidadService.getDisponibilidadProductos([id]);
  const disp = mapa.get(id) ?? null;

  return {
    ...producto,
    disponibleHoy: disp
      ? {
          cantidadDisponible: disp.cantidadDisponible,
          disponible: disp.disponible,
          cantidadReservada: disp.cantidadReservada,
        }
      : null,
  };
}

/**
 * Obtiene un servicio individual enriquecido con cupos de hoy.
 */
export async function obtenerServicioConCuposAction(id: string) {
  const servicio = await prisma.servicio.findUnique({
    where: { id, activo: true },
    include: {
      negocio: true,
      subarea: true,
    },
  });

  if (!servicio) return null;

  const cupos = await disponibilidadService.getCuposServicio(id);

  return {
    ...servicio,
    cuposDisponiblesHoy: cupos,
  };
}

/**
 * Lista productos del negocio del usuario enriquecidos con disponibilidad de hoy.
 */
export async function listarProductosParaNegocioAction() {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const userId = session.id;
  const negocio = await prisma.negocio.findFirst({
    where: { userId },
  });
  if (!negocio) return [];
  return listarProductosConDisponibilidad({ negocioId: negocio.id });
}

/**
 * Lista servicios del negocio del usuario enriquecidos con cupos.
 */
export async function listarServiciosParaNegocioAction() {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const userId = session.id;
  const negocio = await prisma.negocio.findFirst({
    where: { userId },
  });
  if (!negocio) return [];
  return listarServiciosConCupos({ negocioId: negocio.id });
}

/**
 * Lista entradas de disponibilidad para un producto.
 */
export async function listarDisponibilidadAction(
  productoId: string,
  desde?: Date | string | number,
  hasta?: Date | string | number
) {
  return adminDispService.listarDisponibilidad(productoId, desde, hasta);
}

/**
 * Elimina la disponibilidad para un producto y fecha.
 */
export async function eliminarDisponibilidadAction(
  productoId: string,
  fecha: Date | string | number
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  await adminDispService.eliminarDisponibilidadAutorizado(
    session.id,
    productoId,
    fecha
  );
  revalidatePath("/catalogo");
  revalidatePath("/dashboard/negocio/disponibilidad");
}

/**
 * Obtiene los productos del negocio del usuario con disponibilidad para
 * los próximos 7 días. Usado en el dashboard de disponibilidad.
 */
export async function obtenerProductosDisponibilidadAction() {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const userId = session.id;
  const negocio = await prisma.negocio.findFirst({
    where: { userId },
  });
  if (!negocio) return [];

  const productos = await prisma.producto.findMany({
    where: {
      negocioId: negocio.id,
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      precio: true,
      unidadMedida: true,
      imagenUrl: true,
    },
    orderBy: { nombre: "asc" },
  });

  return Promise.all(
    productos.map(async (p) => {
      const semana = await disponibilidadService.listarDisponibilidadSemana(
        p.id
      );
      const hoy = await disponibilidadService.getDisponibilidadProducto(p.id);
      return {
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        unidadMedida: p.unidadMedida,
        imagenUrl: p.imagenUrl ?? null,
        cantidadDisponibleHoy: hoy.cantidadDisponible,
        disponibleHoy: hoy.disponible,
        semana: semana.map((d) => ({
          fecha: d.fecha,
          cantidadDisponible: d.cantidadDisponible,
          disponible: d.disponible,
          cantidadReservada: d.cantidadReservada,
        })),
      };
       })
   );
}


// ---------------------------------------------------------------------------
// Panel de autogestión del negocio (Fase 1 — Punto 3)
// ---------------------------------------------------------------------------

const negocioService = new NegocioService();
const solicitudAltaService = new SolicitudAltaService();
const logisticaNegocioService = new LogisticaNegocioService();
const dashboardNegocioService = new DashboardNegocioService();
const catalogService = new CatalogService();

// -- Negocio --

export async function getNegocioAction(id: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return negocioService.getNegocio(id, session.id, session.rol);
}

export async function listNegociosDeUsuarioAction() {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return negocioService.listNegociosDeUsuario(session.id);
}

export async function actualizarNegocioAction(
  negocioId: string,
  datos: {
    nombre?: string;
    descripcion?: string | null;
    areaId?: string | null;
    subareaIds?: string[];
    provincia?: string | null;
    municipio?: string | null;
    telefono?: string | null;
    emailContacto?: string | null;
    direccion?: string | null;
    permiteReservas?: boolean;
    permiteEnvio?: boolean;
  }
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await negocioService.actualizarNegocio(
    negocioId,
    datos,
    session.id,
    session.rol
  );
  revalidatePath("/negocio");
  revalidatePath(`/negocio/mi-negocio`);
  return result;
}

export async function actualizarSubareasNegocioAction(
  negocioId: string,
  subareaIds: string[]
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  await assertPertenencia(session.id, negocioId, session.rol);

  await prisma.$transaction(async (tx) => {
    await tx.negocioSubarea.deleteMany({ where: { negocioId } });
    if (subareaIds.length > 0) {
      await tx.negocioSubarea.createMany({
        data: subareaIds.map((sid) => ({ negocioId, subareaId: sid })),
      });
    }
  });

  await getCache().del(cacheKeys.negocio.detalle(negocioId));
  await getCache().del(cacheKeys.catalogo.negocios());
  revalidatePath(`/negocio/mi-negocio`);
}

// -- Horarios --

export async function listarHorariosAction(negocioId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  await assertPertenencia(session.id, negocioId, session.rol);
  return prisma.horarioNegocio.findMany({
    where: { negocioId },
    orderBy: { diaSemana: "asc" },
  });
}

export async function actualizarHorariosAction(
  negocioId: string,
  horarios: Array<{
    diaSemana: number;
    horaApertura: string;
    horaCierre: string;
    cerrado: boolean;
  }>
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await negocioService.actualizarHorarios(
    negocioId,
    horarios,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/horarios`);
  revalidatePath(`/negocio`);
  return result;
}

// -- Productos --

export async function crearProductoAction(
  negocioId: string,
  datos: {
    nombre: string;
    descripcion?: string | null;
    precio: number;
    unidadMedida: string;
    imagenUrl: string;
    subareaId: string;
    activo?: boolean;
    disponibleHoy?: boolean;
    tratamientoIVA?: "GRAVADO" | "EXENTO" | "NO_SUJETO";
    tasaIVAOverride?: number | string | null;
  }
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await catalogService.crearProducto(
    negocioId,
    datos,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/productos`);
  revalidatePath(`/negocio`);
  revalidatePath("/catalogo");
  return result;
}

export async function actualizarProductoAction(
  id: string,
  datos: Partial<{
    nombre: string;
    descripcion?: string | null;
    precio: number;
    unidadMedida: string;
    imagenUrl: string;
    subareaId: string;
    activo?: boolean;
    disponibleHoy?: boolean;
    tratamientoIVA?: "GRAVADO" | "EXENTO" | "NO_SUJETO";
    tasaIVAOverride?: number | string | null;
  }>
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await catalogService.actualizarProducto(
    id,
    datos,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/productos`);
  revalidatePath(`/negocio`);
  return result;
}

export async function eliminarProductoAction(id: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  await catalogService.eliminarProducto(id, session.id, session.rol);
  await getCache().invalidatePrefix(cachePrefixes.catalogo + "productos");
  revalidatePath(`/negocio/productos`);
  revalidatePath(`/negocio`);
  revalidatePath("/catalogo");
}

// -- Servicios --

export async function crearServicioAction(
  negocioId: string,
  datos: {
    nombre: string;
    descripcion?: string | null;
    duracionMinutos: number;
    capacidad: number;
    imagenUrl: string;
    horariosDisponibles: Record<string, string[]>;
    subareaId: string;
    activo?: boolean;
    permiteReservas?: boolean;
    tratamientoIVA?: "GRAVADO" | "EXENTO" | "NO_SUJETO";
    tasaIVAOverride?: number | string | null;
  }
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await catalogService.crearServicio(
    negocioId,
    datos,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/servicios`);
  revalidatePath(`/negocio`);
  revalidatePath("/servicios");
  return result;
}

export async function actualizarServicioAction(
  id: string,
  datos: Partial<{
    nombre: string;
    descripcion?: string | null;
    duracionMinutos: number;
    capacidad: number;
    imagenUrl: string;
    horariosDisponibles: Record<string, string[]>;
    subareaId: string;
    activo?: boolean;
    permiteReservas?: boolean;
    tratamientoIVA?: "GRAVADO" | "EXENTO" | "NO_SUJETO";
    tasaIVAOverride?: number | string | null;
  }>
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await catalogService.actualizarServicio(
    id,
    datos,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/servicios`);
  revalidatePath(`/negocio`);
  return result;
}

export async function eliminarServicioAction(id: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  await catalogService.eliminarServicio(id, session.id, session.rol);
  await getCache().invalidatePrefix(cachePrefixes.catalogo + "servicios");
  revalidatePath(`/negocio/servicios`);
  revalidatePath(`/negocio`);
  revalidatePath("/servicios");
}

// -- Inventario --

export async function actualizarInventarioAction(
  productoId: string,
  datos: { cantidadActual: number; puntoReorden: number; ubicacion: string }
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await catalogService.actualizarInventario(
    productoId,
    datos,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/inventario`);
  revalidatePath(`/negocio/productos`);
  revalidatePath(`/negocio`);
  return result;
}

export async function listarInventarioDeNegocioAction(negocioId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return catalogService.listarInventarioDeNegocio(
    negocioId,
    session.id,
    session.rol
  );
}

// -- Logística --

export async function listOpcionesDeNegocioAction(negocioId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return logisticaNegocioService.listOpcionesDeNegocio(
    negocioId,
    session.id,
    session.rol
  );
}

export async function crearOpcionLogisticaAction(
  negocioId: string,
  datos: {
    proveedorId: string;
    nombre: string;
    tipo: string;
    tarifaBase: number;
    tarifaPorDistancia: number;
    tiempoEstimado: string;
  }
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await logisticaNegocioService.crearOpcion(
    negocioId,
    datos,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/logistica`);
  return result;
}

export async function actualizarOpcionLogisticaAction(
  id: string,
  datos: Partial<{
    proveedorId: string;
    nombre: string;
    tipo: string;
    tarifaBase: number;
    tarifaPorDistancia: number;
    tiempoEstimado: string;
  }>
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await logisticaNegocioService.actualizarOpcion(
    id,
    datos,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/logistica`);
  return result;
}

export async function eliminarOpcionLogisticaAction(id: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  await logisticaNegocioService.eliminarOpcion(id, session.id, session.rol);
  await getCache().invalidatePrefix(cachePrefixes.logisticaNegocio);
  revalidatePath(`/negocio/logistica`);
}

export async function listProveedoresDisponiblesAction(negocioId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return logisticaNegocioService.listProveedoresDisponibles(
    negocioId,
    session.id,
    session.rol
  );
}

// -- Solicitudes de alta --

export async function crearSolicitudAltaAction(datos: {
  nombreNegocio: string;
  descripcion?: string | null;
  areaId?: string | null;
  subareaIds?: string[];
  provincia?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  emailContacto?: string | null;
  direccion?: string | null;
}) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  const result = await solicitudAltaService.crearSolicitud(session.id, datos);
  revalidatePath("/admin/solicitudes");
  return result;
}

export async function cancelarSolicitudAltaAction(id: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  const result = await solicitudAltaService.cancelarSolicitud(id, session.id);
  revalidatePath("/admin/solicitudes");
  return result;
}

export async function getSolicitudAltaAction(id: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  return solicitudAltaService.getSolicitud(id, session.id, session.rol);
}

export async function listarSolicitudesUsuarioAction(usuarioId: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  return solicitudAltaService.listarSolicitudesUsuario(usuarioId, session.id, session.rol);
}

export async function listarSolicitudesPendientesAction() {
  const session = await requireRole([Rol.ADMIN]);
  return solicitudAltaService.listarSolicitudes("PENDIENTE_APROBACION");
}

export async function listarSolicitudesAction(estado?: string) {
  const session = await requireRole([Rol.ADMIN]);
  return solicitudAltaService.listarSolicitudes(estado);
}

export async function aprobarNegocioAction(solicitudId: string) {
  const session = await requireRole([Rol.ADMIN]);
  const result = await solicitudAltaService.aprobarSolicitud(
    solicitudId,
    session.id
  );
  revalidatePath("/admin/solicitudes");
  revalidatePath("/negocio");
  return result;
}

export async function rechazarNegocioAction(solicitudId: string, motivo: string) {
  const session = await requireRole([Rol.ADMIN]);
  const result = await solicitudAltaService.rechazarSolicitud(
    solicitudId,
    session.id,
    motivo
  );
  revalidatePath("/admin/solicitudes");
  return result;
}

// -- Dashboard --

export async function getDashboardNegocioAction(
  negocioId: string,
  rango?: { desde?: string; hasta?: string }
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const desde = rango?.desde ? new Date(rango.desde) : undefined;
  const hasta = rango?.hasta ? new Date(rango.hasta) : undefined;
  return dashboardNegocioService.getResumen(
    negocioId,
    session.id,
    { desde, hasta },
    session.rol
  );
}

export async function getResumenAction(negocioId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return dashboardNegocioService.getResumen(
    negocioId,
    session.id,
    undefined,
    session.rol
  );
}

export async function getPedidosRecientesAction(negocioId: string, limit = 10) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return dashboardNegocioService.getPedidosRecientes(
    negocioId,
    session.id,
    limit,
    session.rol
  );
}

export async function getReservasProximasAction(negocioId: string, limit = 10) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return dashboardNegocioService.getReservasProximas(
    negocioId,
    session.id,
    limit,
    session.rol
  );
}

export async function actualizarEstadoPedidoAction(
  negocioId: string,
  pedidoId: string,
  estado: string
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await dashboardNegocioService.actualizarEstadoPedido(
    negocioId,
    pedidoId,
    estado,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/pedidos`);
  revalidatePath(`/negocio`);
  return result;
}

export async function listarPedidosNegocioAction(negocioId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return dashboardNegocioService.listarPedidos(
    negocioId,
    session.id,
    session.rol
  );
}

export async function listarReservasNegocioAction(negocioId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return dashboardNegocioService.listarReservas(
    negocioId,
    session.id,
    session.rol
  );
}

export async function actualizarReservaAction(
  negocioId: string,
  reservaId: string,
  estado: string
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const result = await dashboardNegocioService.actualizarReserva(
    negocioId,
    reservaId,
    estado,
    session.id,
    session.rol
  );
  revalidatePath(`/negocio/reservas`);
  revalidatePath(`/negocio`);
  return result;
}

export async function estaAbiertoHoyAction(negocioId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return negocioService.estaAbiertoHoy(negocioId);
}

export async function listarAreasAction() {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN, Rol.CLIENTE]);
  return prisma.area.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
}

export async function listarSubareasAction(areaId?: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN, Rol.CLIENTE]);
  return prisma.subarea.findMany({
    where: {
      activo: true,
      ...(areaId && { areaId }),
    },
    orderBy: { nombre: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Pago Actions (Fase 1 — Punto 5)
// ---------------------------------------------------------------------------

export async function getPagoDePedidoAction(pedidoId: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const pago = await pagoService.getPagoDePedido(
      pedidoId,
      session.id,
      session.rol
    );
    return pago;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getPagoAction(pagoId: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const pago = await pagoService.getPago(pagoId, session.id, session.rol);
    return pago;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listPagosDeUsuarioAction(options?: {
  estado?: string[];
  metodo?: string[];
  entidadPago?: string[];
  idTransferencia?: string;
  page?: number;
  limit?: number;
}) {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  try {
    const result = await pagoService.listPagosDeUsuario(session.id, {
      estado: options?.estado as any,
      metodo: options?.metodo as any,
      entidadPago: options?.entidadPago,
      idTransferencia: options?.idTransferencia,
      page: options?.page,
      limit: options?.limit,
    }, session.rol);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listPagosDeNegocioAction(negocioId: string, options?: {
  estado?: string[];
  metodo?: string[];
  entidadPago?: string[];
  idTransferencia?: string;
  page?: number;
  limit?: number;
}) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const result = await pagoService.listPagosDeNegocio(
      negocioId,
      session.id,
      {
        estado: options?.estado as any,
        metodo: options?.metodo as any,
        entidadPago: options?.entidadPago,
        idTransferencia: options?.idTransferencia,
        page: options?.page,
        limit: options?.limit,
      },
      session.rol
    );
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getResumenPagosAction() {
  const session = await requireRole([Rol.ADMIN]);
  try {
    return await pagoService.getResumenPagos();
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getResumenPagosPorEntidadAction(
  negocioId: string,
  rangoFechas?: { desde?: Date; hasta?: Date }
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  try {
     const result = await dashboardNegocioService.getResumenPagosPorEntidad(
      negocioId,
      session.id,
      rangoFechas,
      session.rol
    );
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function confirmarPagoAction(pagoId: string, datos?: { notasNegocio?: string | null }) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const result = await pagoService.confirmarPago(
      pagoId,
      session.id,
      datos,
      session.rol
    );
    revalidatePath("/pagos");
    revalidatePath("/dashboard/negocio/pagos");
    revalidatePath("/admin/pagos");
    revalidatePath(`/pagos/${pagoId}`);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function rechazarPagoAction(pagoId: string, motivo: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const result = await pagoService.rechazarPago(
      pagoId,
      session.id,
      motivo,
      session.rol
    );
    revalidatePath("/pagos");
    revalidatePath("/dashboard/negocio/pagos");
    revalidatePath("/admin/pagos");
    revalidatePath(`/pagos/${pagoId}`);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function reembolsarPagoAction(
  pagoId: string,
  motivo: string,
  datosReembolso?: { idTransferenciaReembolso?: string | null; fechaReembolso?: Date | null }
) {
  const session = await requireRole([Rol.ADMIN]);
  try {
    const result = await pagoService.reembolsarPago(pagoId, session.id, motivo, datosReembolso);
    revalidatePath("/pagos");
    revalidatePath("/dashboard/negocio/pagos");
    revalidatePath("/admin/pagos");
    revalidatePath(`/pagos/${pagoId}`);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function cancelarPagoAction(pagoId: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  try {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      select: { pedido: { select: { usuarioId: true } } },
    });
    const rol = session.rol === Rol.ADMIN ? Rol.ADMIN : Rol.CLIENTE;
    const result = await pagoService.cancelarPago(
      pagoId,
      session.id,
      rol
    );
    revalidatePath("/pagos");
    revalidatePath("/dashboard/negocio/pagos");
    revalidatePath("/admin/pagos");
    revalidatePath(`/pagos/${pagoId}`);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function crearPagoAction(
  pedidoId: string,
  metodo: string,
  datos?: {
    monto?: number;
    moneda?: string;
    referencia?: string | null;
    comprobanteUrl?: string | null;
    idTransferencia?: string | null;
    entidadPago?: string | null;
    fechaTransferencia?: Date | null;
    notasCliente?: string | null;
  }
) {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  try {
    const result = await pagoService.crearPagoParaPedido(
      pedidoId,
      metodo as MetodoPago,
      datos,
      session.id,
      session.rol
    );
    revalidatePath("/pagos");
    revalidatePath(`/pedidos`);
    revalidatePath(`/pagos/${result.id}`);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function subirComprobanteAction(
  pagoId: string,
  datos: {
    referencia?: string | null;
    comprobanteUrl?: string | null;
    idTransferencia?: string | null;
    entidadPago?: string | null;
    fechaTransferencia?: Date | null;
    notasCliente?: string | null;
  }
) {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  try {
    const result = await pagoService.subirComprobante(pagoId, datos, session.id);
    revalidatePath("/pagos");
    revalidatePath("/dashboard/negocio/pagos");
    revalidatePath(`/pagos/${pagoId}`);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function vincularFacturaPagoAction(pagoId: string, facturaId: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const result = await pagoService.vincularFactura(pagoId, facturaId);
    revalidatePath(`/pagos/${pagoId}`);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function verificarIdTransferenciaAction(idTransferencia: string) {
  try {
    const existe = await pagoService.existeIdTransferencia(idTransferencia);
    return { existe, disponible: !existe };
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function buscarPagoPorIdTransferenciaAction(idTransferencia: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const result = await pagoService.buscarPagoPorIdTransferencia(
      idTransferencia,
      session.id,
      session.rol
    );
    if (!result) {
      return { error: "Pago no encontrado", codigo: "NO_ENCONTRADO", statusCode: 404 };
    }
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Códigos de entrega EFECTIVO_CONTRA_ENTREGA
// ---------------------------------------------------------------------------

export async function getCodigoEntregaAction(pagoId: string) {
  const session = await requireRole([Rol.CLIENTE]);
  try {
    const result = await pagoService.getCodigoEntregaCache(pagoId, session.id);
    return { codigo: result };
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function regenerarCodigoEntregaAction(pagoId: string, motivo: string) {
  const session = await requireRole([Rol.CLIENTE, Rol.ADMIN]);
  try {
    const result = await pagoService.regenerarCodigoEntrega(pagoId, session.id, motivo);
    revalidatePath(`/pagos/${pagoId}`);
    return { codigo: result };
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function confirmarPagoConCodigoAction(
  pagoId: string,
  codigo: string,
  datos?: { notasNegocio?: string | null }
) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const result = await pagoService.confirmarConCodigoEntrega(
      pagoId,
      codigo,
      session.id,
      session.rol,
      datos?.notasNegocio ?? undefined
    );
    revalidatePath("/pagos");
    revalidatePath("/dashboard/negocio/pagos");
    revalidatePath("/admin/pagos");
    revalidatePath(`/pagos/${pagoId}`);
    return result;
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function validarCodigoEntregaAction(pagoId: string, codigo: string) {
  const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  try {
    const result = await pagoService.validarCodigoEntrega(pagoId, codigo, session.id, session.rol);
    return { valido: result };
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return { error: err.message, codigo: err.code, statusCode: err.status };
    }
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
