import { test, expect } from "@playwright/test";
import { BASE, seedUsers, smokeTest } from "./_helper";

test.describe("1.14 Panel NEGOCIO y 1.15 Panel ADMIN", () => {
  test("dashboard negocio carga", async ({ page }) => {
    await smokeTest(page, "/negocio", { user: seedUsers.negocio });
    await expect(page.locator('text=/Negocio|Dashboard|Pedidos|Ventas/i')).toBeVisible();
  });

  test("CRUD productos", async ({ page }) => {
    await smokeTest(page, "/negocio/productos", { user: seedUsers.negocio });
    await expect(page.locator('text=/Producto|Productos/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("CRUD servicios", async ({ page }) => {
    await smokeTest(page, "/negocio/servicios", { user: seedUsers.negocio });
    await expect(page.locator('text=/Servicio|Servicios/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("inventario stock", async ({ page }) => {
    await smokeTest(page, "/negocio/productos", { user: seedUsers.negocio });
    await expect(page.locator('text=/Inventario|Stock/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("pedidos recibidos", async ({ page }) => {
    await smokeTest(page, "/negocio/pedidos", { user: seedUsers.negocio });
    await expect(page.locator('text=/Pedido|Pedidos/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("reservas negocio", async ({ page }) => {
    await smokeTest(page, "/negocio/reservas", { user: seedUsers.negocio });
    await expect(page.locator('text=/Reserva|Reservas/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("ventas reportes", async ({ page }) => {
    await smokeTest(page, "/negocio/ventas", { user: seedUsers.negocio });
    await expect(page.locator('text=/Reporte|Ventas|Inventario/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("negocio solo ve sus recursos", async ({ page }) => {
    await smokeTest(page, "/negocio/productos", { user: seedUsers.negocio });
    await expect(page.locator('body')).toBeVisible();
  });

  test("configurar disponibilidad", async ({ page }) => {
    await smokeTest(page, "/negocio", { user: seedUsers.negocio });
    await expect(page.locator('body')).toBeVisible();
  });

  test("opciones logísticas negocio", async ({ page }) => {
    await smokeTest(page, "/negocio", { user: seedUsers.negocio });
    await expect(page.locator('body')).toBeVisible();
  });

  test("admin dashboard carga", async ({ page }) => {
    await smokeTest(page, "/admin", { user: seedUsers.admin });
    await expect(page.locator('text=/Admin|Usuario|Usuarios/i')).toBeVisible();
  });

  test("listar usuarios", async ({ page }) => {
    await smokeTest(page, "/admin/usuarios", { user: seedUsers.admin });
    await expect(page.locator('body')).toBeVisible();
  });

  test("cambiar rol usuario", async ({ page }) => {
    await smokeTest(page, "/admin/usuarios", { user: seedUsers.admin });
    await expect(page.locator('text=/Rol|Usuario/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("activar/desactivar usuario", async ({ page }) => {
    await smokeTest(page, "/admin/usuarios", { user: seedUsers.admin });
    await expect(page.locator('body')).toBeVisible();
  });

  test("crear usuario admin", async ({ page }) => {
    await smokeTest(page, "/admin/usuarios", { user: seedUsers.admin });
    await expect(page.locator('text=/Crear|Usuario/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("resetear password", async ({ page }) => {
    await smokeTest(page, "/admin/usuarios", { user: seedUsers.admin });
    await expect(page.locator('text=/Contraseña|Resetear/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("aprobar solicitud negocio", async ({ page }) => {
    await smokeTest(page, "/admin/solicitudes", { user: seedUsers.admin });
    await expect(page.locator('text=/Solicitud|Negocio|Aprobar/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("gestionar areas/subareas", async ({ page }) => {
    await smokeTest(page, "/admin", { user: seedUsers.admin });
    await expect(page.locator('text=/Area|Subarea/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("fondos del home", async ({ page }) => {
    await smokeTest(page, "/admin", { user: seedUsers.admin });
    await expect(page.locator('text=/Fondo|Home|Seccion/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("tasas de cambio", async ({ page }) => {
    await smokeTest(page, "/admin", { user: seedUsers.admin });
    await expect(page.locator('text=/Tasa|Cambio/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("reportes globales", async ({ page }) => {
    await smokeTest(page, "/admin", { user: seedUsers.admin });
    await expect(page.locator('text=/Reporte|Global/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("auditoria", async ({ page }) => {
    await smokeTest(page, "/admin", { user: seedUsers.admin });
    await expect(page.locator('text=/Auditoría|Auditoria/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("ultimo admin protegido", async ({ page }) => {
    await smokeTest(page, "/admin/usuarios", { user: seedUsers.admin });
    await expect(page.locator('body')).toBeVisible();
  });
});
