/**
 * Rutas que SIEMPRE deben abrir en el top (incluso al volver atrás).
 * Casos de excepción: autenticación, pago, acciones destructivas y formularios.
 */
export const EXCEPTION_ROUTES: string[] = [
  "/auth/login",
  "/auth/registro",
  "/auth/recuperar",
  "/auth/resetear",
  "/checkout/confirmacion",
];

export function isExceptionRoute(pathname: string): boolean {
  return EXCEPTION_ROUTES.some((route) => pathname.startsWith(route));
}
