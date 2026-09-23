/**
 * Centralized cache key generators.
 *
 * All cache keys MUST be generated through this module. Prohibited:
 * writing raw cache key strings outside of this file.
 *
 * Uses hashFiltros for deterministic stringification (sorted keys) so the
 * same params always produce the same key regardless of property order.
 */

export function hashFiltros(obj: Record<string, unknown> | undefined): string {
  if (!obj || Object.keys(obj).length === 0) return "";
  return Object.keys(obj)
    .sort()
    .map((k) => `${k}=${JSON.stringify(obj[k])}`)
    .join("&");
}

function buildKey(prefix: string, hash: string): string {
  return hash ? `${prefix}:${hash}` : `${prefix}:`;
}

export const cacheKeys = {
  catalogo: {
    areas: (params?: Record<string, unknown>) => `catalogo:areas:${hashFiltros(params)}`,
    subareas: (params?: Record<string, unknown>) => `catalogo:subareas:${hashFiltros(params)}`,
    negocios: (params?: Record<string, unknown>) => `catalogo:negocios:${hashFiltros(params)}`,
    productos: (params?: Record<string, unknown>) => `catalogo:productos:${hashFiltros(params)}`,
    servicios: (params?: Record<string, unknown>) => `catalogo:servicios:${hashFiltros(params)}`,
    productosDisp: (filtros?: Record<string, unknown>) =>
      buildKey(`catalogo:productos:disp`, hashFiltros(filtros)),
    serviciosDisp: (filtros?: Record<string, unknown>) =>
      buildKey(`catalogo:servicios:disp`, hashFiltros(filtros)),
  },
  disponibilidad: {
    producto: (productoId: string, fechaISO: string) =>
      `disponibilidad:producto:${productoId}:${fechaISO}`,
    servicio: (servicioId: string, fechaISO: string) =>
      `disponibilidad:servicio:${servicioId}:${fechaISO}`,
    semana: (productoId: string) => `disponibilidad:semana:${productoId}`,
  },
  carrito: {
    usuario: (userId: string) => `carrito:usuario:${userId}`,
  },
  pedidos: {
    usuario: (userId: string, opts?: Record<string, unknown>) =>
      buildKey(`pedidos:usuario:${userId}`, hashFiltros(opts)),
    grupos: (userId: string, opts?: Record<string, unknown>) =>
      buildKey(`pedidos:grupos:${userId}`, hashFiltros(opts)),
    negocio: (negocioId: string, opts?: Record<string, unknown>) =>
      buildKey(`pedidos:negocio:${negocioId}`, hashFiltros(opts)),
    detalle: (pedidoId: string, userId?: string) =>
      userId
        ? `pedidos:detalle:${pedidoId}:usuario:${userId}`
        : `pedidos:detalle:${pedidoId}`,
  },
  reservas: {
    usuario: (userId: string) => `reservas:usuario:${userId}`,
  },
  facturas: {
    usuario: (usuarioId: string, opts?: Record<string, unknown>) =>
      buildKey(`facturas:usuario:${usuarioId}`, hashFiltros(opts)),
    negocio: (negocioId: string, opts?: Record<string, unknown>) =>
      buildKey(`facturas:negocio:${negocioId}`, hashFiltros(opts)),
  },
  pagos: {
    usuario: (userId: string) => `pagos:usuario:${userId}`,
    negocio: (negocioId: string) => `pagos:negocio:${negocioId}`,
    pedido: (pedidoId: string) => `pagos:pedido:${pedidoId}`,
  },
  codigoEntrega: {
    cache: (pagoId: string) => `pago:${pagoId}:codigo-entrega`,
    intentos: (pagoId: string) => `pago:${pagoId}:codigo-intentos`,
  },
   negocio: {
    detalle: (negocioId: string) => `negocio:${negocioId}`,
    horarios: (negocioId: string) => `negocio:${negocioId}:horarios`,
    dashboardFiscal: (negocioId: string, rango?: { desde?: Date; hasta?: Date }) =>
      buildKey(`negocio:${negocioId}:dashboard:fiscal`, hashFiltros(rango)),
    porUsuario: (userId: string) => `negocio:porUsuario:${userId}`,
  },
  logistica: {
    checkout: (negocioId: string) => `logistica:checkout:${negocioId}`,
    opciones: (negocioId?: string) =>
      negocioId ? `logistica:opciones:${negocioId}` : `logistica:opciones`,
    proveedores: () => `logistica:proveedores`,
    pedidos: (userId: string) => `logistica:pedidos:${userId}`,
    negocio: (negocioId: string) => `logistica:${negocioId}`,
    pending: () => `logistica:pending`,
  },
  solicitudes: {
    pending: () => `solicitudes:pending`,
    byEstado: (estado: string) => `solicitudes:${estado}`,
    detail: (id: string) => `solicitudes:${id}`,
  },
  usuario: {
    detalle: (usuarioId: string) => `usuario:${usuarioId}`,
    negocio: (usuarioId: string) => `usuario:${usuarioId}:negocio`,
    all: () => `usuarios`,
  },
  checkout: {
    token: (token: string) => `checkout:token:${token}`,
  },
  dashboard: {
    resumen: (negocioId: string, rango?: { desde?: Date; hasta?: Date }) =>
      buildKey(`dashboard:resumen:${negocioId}`, hashFiltros(rango)),
  },
  reporte: {
    ventas: (negocioId: string) => `reporte:ventas:${negocioId}`,
    ventasGlobal: () => `reporte:ventas:global`,
    productos: (negocioId: string) => `reporte:productos:${negocioId}`,
    inventario: (negocioId: string) => `reporte:inventario:${negocioId}`,
    productosVendidos: (negocioId: string) => `reporte:productos-vendidos:${negocioId}`,
    inventivoEstado: (negocioId: string) => `reporte:inventario-estado:${negocioId}`,
  },
};

/**
 * Namespace prefixes for bulk invalidation via `invalidatePrefix`.
 * Each key maps to the full prefix that all keys in that domain share.
 */
export const cachePrefixes = {
  catalogo: "catalogo:",
  disponibilidad: "disponibilidad:",
  carritoUsuario: "carrito:usuario:",
  pedidosUsuario: "pedidos:usuario:",
  pedidosGrupos: "pedidos:grupos:",
  pedidosNegocio: "pedidos:negocio:",
  pedidosDetalle: "pedidos:detalle:",
  reservas: "reservas:usuario:",
  facturas: "facturas:",
  pagos: "pagos:",
  negocio: "negocio:",
  logistica: "logistica:",
  logisticaCheckout: "logistica:checkout:",
  logisticaOpciones: "logistica:opciones",
  logisticaPedidos: "logistica:pedidos:",
  logisticaNegocio: "logistica:negocio:",
  solicitudes: "solicitudes:",
  solicitudesPending: "solicitudes:pending",
  usuario: "usuario:",
  usuarios: "usuarios",
  checkout: "checkout:",
  codigoEntrega: "pago:codigo-entrega:",
  dashboard: "dashboard:",
  reporte: "reporte:",
} as const;
