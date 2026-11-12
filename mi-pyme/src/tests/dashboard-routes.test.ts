import { describe, expect, it } from "vitest";
import { isDashboardNavigationRoute } from "@/lib/navigation/dashboard-routes";

describe("isDashboardNavigationRoute", () => {
  it.each([
    "/cliente",
    "/negocio/productos",
    "/logistica",
    "/admin/usuarios",
    "/pedidos",
    "/facturas/123",
    "/perfil",
    "/notificaciones",
  ])("recognizes %s as a dashboard view", (pathname) => {
    expect(isDashboardNavigationRoute(pathname)).toBe(true);
  });

  it.each(["/", "/catalogo", "/servicios", "/administracion"])(
    "does not recognize %s as a dashboard view",
    (pathname) => {
      expect(isDashboardNavigationRoute(pathname)).toBe(false);
    }
  );
});
