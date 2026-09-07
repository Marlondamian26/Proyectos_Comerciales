"use server";

import prisma from "@/lib/db/prisma";
import { cachedQuery } from "@/lib/db/prisma";
import { delCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";

const RESERVA_TTL_MS = 15 * 60 * 1000;

export async function listarAreas() {
  return cachedQuery("areas", async () => {
    return prisma.area.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });
  });
}

export async function listarSubareas(areaId?: string) {
  const cacheKey = areaId ? `subareas:${areaId}` : "subareas";
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

export async function listarNegocios() {
  return cachedQuery("negocios", async () => {
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
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function obtenerNegocioDelUsuario(usuarioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  return cachedQuery(`usuario:${usuarioId}:negocio`, async () => {
    const negocio = await prisma.negocio.findFirst({
      where: { userId: usuarioId, activo: true },
      include: { area: true, subareas: true },
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
  const cacheKey = `productos:${JSON.stringify(filtros || {})}`;

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

export async function listarServicios(filtros?: {
  areaId?: string;
  negocioId?: string;
  subareaId?: string;
  activo?: boolean;
}) {
  const cacheKey = `servicios:${JSON.stringify(filtros || {})}`;

  return cachedQuery(cacheKey, async () => {
    return prisma.servicio.findMany({
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
  });
}

export async function obtenerCarrito(usuarioId: string) {
  const cacheKey = `carrito:${usuarioId}`;
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
  }
) {
  const cantidad = datos.cantidad ?? 1;

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

  delCache(`carrito:${usuarioId}`);

  return prisma.carrito.findUnique({
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
    delCache(`carrito:${usuarioId}`);
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

  delCache(`carrito:${usuarioId}`);
}

export async function listarReservas(usuarioId: string) {
  const cacheKey = `reservas:${usuarioId}`;

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
  await prisma.reserva.update({
    where: { id: reservaId },
    data: { estado: "cancelada" },
  });

  if (usuarioId) {
    delCache(`reservas:${usuarioId}`);
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

  const fechaFin = new Date(
    fechaInicio.getTime() + servicio.duracionMinutos * 60 * 1000
  );

  const existingCount = await prisma.reserva.count({
    where: {
      servicioId: datos.servicioId,
      fechaHoraInicio: fechaInicio,
      estado: { not: "cancelada" },
    },
  });

  if (existingCount >= servicio.capacidad) {
    throw new Error("Servicio sin disponibilidad en esta fecha y hora");
  }

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

   delCache(`reservas:${usuarioId}`);

  return reserva;
}

export async function listarPedidos(usuarioId: string) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = `pedidos:${usuarioId}`;

  return cachedQuery(cacheKey, async () => {
    return prisma.pedido.findMany({
      where: { usuarioId },
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
  });
}

export async function listarPedidosPorNegocio(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = `pedidos:negocio:${negocioId}`;

  return cachedQuery(cacheKey, async () => {
    return prisma.pedido.findMany({
      where: {
        items: {
          some: { negocioId },
        },
      },
      include: {
        items: {
          where: { negocioId },
          include: {
            producto: true,
            servicio: true,
            negocio: true,
          },
        },
        logistica: true,
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

  const total = carrito.items.reduce(
    (sum, item) => sum + item.precioUnitario * item.cantidad,
    0
  );

  const pedido = await prisma.pedido.create({
    data: {
      usuarioId,
      total,
      estado: "pendiente",
      tipo,
      negocioIds: JSON.stringify(negocioIds),
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

  delCache(`carrito:${usuarioId}`);
  delCache(`pedidos:${usuarioId}`);

  return pedido;
}

export async function listarOpcionesLogisticas(negocioId?: string) {
  await requireRole([Rol.LOGISTICA, Rol.ADMIN]);
  const cacheKey = negocioId
    ? `logistica:opciones:${negocioId}`
    : "logistica:opciones";

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
  return cachedQuery("logistica:proveedores", async () => {
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
  const cacheKey = `logistica:pedidos:${usuarioId}`;

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
        logisticaId: { in: opcionesLogisticasIds },
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
    delCache(`pedidos:${pedido.usuarioId}`);
    delCache(`logistica:pedidos:*`);
  }

  return pedido;
}

export async function asignarLogistica(
  pedidoId: string,
  logisticaId: string
) {
  await requireRole([Rol.LOGISTICA, Rol.ADMIN]);
  const opcionLogistica = await prisma.opcionLogistica.findUnique({
    where: { id: logisticaId },
  });

  if (!opcionLogistica) {
    throw new Error("Opcion logistica no encontrada");
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

   delCache(`pedidos:${pedido.usuarioId}`);

   return pedido;
}

export async function asignarLogisticaForm(
   prevState: { error?: string; ok?: boolean } | undefined,
   data: FormData
) {
   const pedidoId = data.get("pedidoId") as string;
   const logisticaId = data.get("logisticaId") as string;

   if (!pedidoId || !logisticaId) {
     return { error: "Faltan parámetros: pedidoId y logisticaId son requeridos" };
   }

   try {
     const pedido = await asignarLogistica(pedidoId, logisticaId);
     revalidatePath("/logistica");
     revalidatePath("/pedidos");
     return { ok: true, pedido };
   } catch (err: unknown) {
     return { error: err instanceof Error ? err.message : String(err) };
   }
}

const TASA_IMPUESTO = 0.21;

export async function listarFacturas(usuarioId?: string, negocioId?: string) {
  await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = negocioId
    ? `facturas:negocio:${negocioId}`
    : `facturas:usuario:${usuarioId}`;

  return cachedQuery(cacheKey, async () => {
    return prisma.factura.findMany({
      where: {
        ...(usuarioId && !negocioId && { usuarioId }),
        ...(negocioId && { negocioId }),
      },
      include: {
        pedido: true,
        items: {
          include: {
            producto: true,
            servicio: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });
  });
}

export async function emitirFactura(pedidoId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      items: {
        include: {
          producto: true,
          servicio: true,
        },
      },
    },
  });

  if (!pedido) {
    throw new Error("Pedido no encontrado");
  }

  const existingFactura = await prisma.factura.findUnique({
    where: { pedidoId },
  });

  if (existingFactura) {
    throw new Error("Ya existe una factura para este pedido");
  }

  const subtotal = pedido.total;
  const impuestos = subtotal * TASA_IMPUESTO;
  const total = subtotal + impuestos;

  const now = new Date();
  const año = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const día = String(now.getDate()).padStart(2, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const numero = `FAC-${año}${mes}${día}-${randomSuffix}`;

  const negocioId = pedido.items[0]?.negocioId ?? null;

  const factura = await prisma.factura.create({
    data: {
      pedidoId: pedido.id,
      usuarioId: pedido.usuarioId,
      negocioId,
      numero,
      fecha: now,
      estado: "emitida",
      subtotal,
      impuestos,
      total,
      items: {
        create: pedido.items.map((item) => ({
          productoId: item.productoId,
          servicioId: item.servicioId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
        })),
      },
    },
    include: {
      items: {
        include: {
          producto: true,
          servicio: true,
        },
      },
      pedido: true,
    },
  });

  delCache(`pedidos:${pedido.usuarioId}`);
  delCache(`facturas:usuario:${pedido.usuarioId}`);
  if (negocioId) {
    delCache(`facturas:negocio:${negocioId}`);
  }

  return factura;
}

export async function reporteVentasPorDia(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = `reporte:ventas:${negocioId}`;

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
      ventasPorDiaMap[fecha].totalVentas += item.subtotal;
      ventasPorDiaMap[fecha].cantidad += item.cantidad;
    });

    return Object.values(ventasPorDiaMap).sort((a, b) =>
      b.fecha.localeCompare(a.fecha)
    );
  });
}

export async function reporteVentasGlobal() {
  await requireRole([Rol.ADMIN]);
  const cacheKey = "reporte:ventas:global";

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
      ventasPorDiaMap[fecha].totalVentas += item.subtotal;
      ventasPorDiaMap[fecha].cantidad += item.cantidad;
    });

    return Object.values(ventasPorDiaMap).sort((a, b) =>
      b.fecha.localeCompare(a.fecha)
    );
  });
}

export async function reporteProductosMasVendidos(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = `reporte:productos:${negocioId}`;

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
      productosMap[key].totalVentas += item.subtotal;
    });

    return Object.entries(productosMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalVentas - a.totalVentas);
  });
}

export async function reporteInventario(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = `reporte:inventario:${negocioId}`;

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
  const cacheKey = `reporte:productos-vendidos:${negocioId}`;

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
      productosMap[key].totalVentas += item.subtotal;
    });

    return Object.entries(productosMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });
}

export async function estadoInventario(negocioId: string) {
  await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
  const cacheKey = `reporte:inventario-estado:${negocioId}`;

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
  return cachedQuery("usuarios", async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function estadoUsuario(usuarioId: string) {
  await requireRole([Rol.ADMIN]);
  return cachedQuery(`usuario:${usuarioId}`, async () => {
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

  const data: { rol?: Rol; nombre?: string } = {};

  if (datos.rol !== undefined) data.rol = datos.rol;
  if (datos.nombre !== undefined) data.nombre = datos.nombre;

  await prisma.user.update({
    where: { id: usuarioId },
    data,
  });

  delCache("usuarios");
  delCache(`usuario:${usuarioId}`);

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

  delCache("areas");
  delCache(`area:${areaId}`);

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

  delCache("subareas");
  delCache(`subarea:${subareaId}`);

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

  delCache("negocios");
  delCache(`negocio:${negocioId}`);

  return prisma.negocio.findUnique({
    where: { id: negocioId },
  });
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

  delCache("areas");
  delCache(`area:${areaId}`);

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

  delCache("subareas");
  delCache(`subarea:${subareaId}`);

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

  delCache("negocios");
  delCache(`negocio:${negocioId}`);

  return prisma.negocio.update({
    where: { id: negocioId },
    data: datos,
  });
}

