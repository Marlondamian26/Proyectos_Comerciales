const dashboardRoots = ["/cliente", "/negocio", "/logistica", "/admin"];
const sharedDashboardRoutes = [
  "/carrito",
  "/catalogo",
  "/facturas",
  "/mis-solicitudes",
  "/notificaciones",
  "/pagos",
  "/pedidos",
  "/perfil",
  "/reservas",
];

export function isDashboardNavigationRoute(pathname: string): boolean {
  return [...dashboardRoots, ...sharedDashboardRoutes].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
