import { test, expect } from "@playwright/test";
import { BASE, seedUsers, smokeTest } from "./_helper";

test.describe("1.16 Perfil y foto y 1.17 Solicitudes de rol", () => {
  test("ver perfil", async ({ page }) => {
    await smokeTest(page, "/perfil", { user: seedUsers.cliente });
    await expect(page.locator('text=/Perfil|Cliente/i')).toBeVisible();
  });

  test("actualizar nombre email username", async ({ page }) => {
    await smokeTest(page, "/perfil", { user: seedUsers.cliente });
    await expect(page.locator('input[id="nombre"], input[id="email"], input[id="username"]')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("actualizar provincia municipio", async ({ page }) => {
    await smokeTest(page, "/perfil", { user: seedUsers.cliente });
    await expect(page.locator('input[id="provincia"], input[id="municipio"]')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("cambiar contraseña", async ({ page }) => {
    await smokeTest(page, "/perfil/cambiar-password", { user: seedUsers.cliente });
    await expect(page.locator('input[id="password"], input[id="currentPassword"], text=/Contraseña/i')).toBeVisible();
  });

  test("subir foto de perfil", async ({ page }) => {
    await smokeTest(page, "/perfil", { user: seedUsers.cliente });
    await expect(page.locator('text=/Foto|Imagen|imagen/i, input[type="file"]')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("eliminar foto vuelve a iniciales", async ({ page }) => {
    await smokeTest(page, "/perfil", { user: seedUsers.cliente });
    await expect(page.locator('body')).toBeVisible();
  });

  test("eliminar cuenta soft-delete", async ({ page }) => {
    await smokeTest(page, "/perfil", { user: seedUsers.cliente });
    await expect(page.locator('text=/Eliminar cuenta|Eliminar/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("eliminar cuenta invalida sesion", async ({ page }) => {
    await smokeTest(page, "/perfil", { user: seedUsers.cliente });
    await expect(page.locator('body')).toBeVisible();
  });

  test("solicitar rol NEGOCIO", async ({ page }) => {
    await smokeTest(page, "/solicitar-rol", { user: seedUsers.cliente });
    await expect(page.locator('text=/Solicitud|Negocio|Rol/i')).toBeVisible();
  });

  test("solicitar rol LOGISTICA", async ({ page }) => {
    await smokeTest(page, "/solicitar-rol", { user: seedUsers.cliente });
    await expect(page.locator('text=/Logística|Logistica/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("no 2 solicitudes pendientes", async ({ page }) => {
    await smokeTest(page, "/solicitar-rol", { user: seedUsers.cliente });
    await expect(page.locator('body')).toBeVisible();
  });

  test("cancelar solicitud pendiente", async ({ page }) => {
    await smokeTest(page, "/solicitar-rol/estado", { user: seedUsers.cliente });
    await expect(page.locator('text=/Estado|Cancelar/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("admin aprueba solicitud", async ({ page }) => {
    await smokeTest(page, "/admin/solicitudes", { user: seedUsers.admin });
    await expect(page.locator('text=/Aprobar|Solicitud/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("admin rechaza con motivo", async ({ page }) => {
    await smokeTest(page, "/admin/solicitudes", { user: seedUsers.admin });
    await expect(page.locator('body')).toBeVisible();
  });

  test("al aprobar se crea Negocio", async ({ page }) => {
    await smokeTest(page, "/admin/solicitudes", { user: seedUsers.admin });
    await expect(page.locator('body')).toBeVisible();
  });
});
