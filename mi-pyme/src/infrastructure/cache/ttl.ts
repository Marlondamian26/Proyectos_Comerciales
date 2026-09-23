/**
 * Central registry of cache TTLs (in seconds) for every domain.
 *
 * Default stdTTL is 600s (10 min), matching the previous node-cache configuration.
 * Individual services may override with explicit TTL per key.
 */
export const cacheTTL = {
  catalogo: 300,
  disponibilidad: 60,
  carrito: 600,
  pedidos: 600,
  reservas: 600,
  pagos: 600,
  codigoEntrega: 3600,
  negocio: 120,
  dashboardFiscal: 120,
  dashboardResumen: 120,
  logistica: 3600,
  checkout: 1800,
  reportes: 600,
  usuarios: 600,
  solicitudes: 600,
  default: 600,
} as const;
