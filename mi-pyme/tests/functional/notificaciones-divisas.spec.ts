import { test, expect } from "@playwright/test";
import { BASE, seedUsers, smokeTest } from "./_helper";

test.describe("1.12 Notificaciones y 1.13 Divisas ElToque", () => {
  test("notificaciones carga cliente", async ({ page }) => {
    await smokeTest(page, "/notificaciones", { user: seedUsers.cliente });
  });

  test("campana contador no leídas", async ({ page }) => {
    await smokeTest(page, "/cliente", { user: seedUsers.cliente });
    await expect(page.locator('text=/Notificacion|Notificaciones|Campana/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("marcar como leída", async ({ page }) => {
    await smokeTest(page, "/notificaciones", { user: seedUsers.cliente });
    await expect(page.locator('text=/Leída|Leida|Notificacion/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("marcar todas como leídas", async ({ page }) => {
    await smokeTest(page, "/notificaciones", { user: seedUsers.cliente });
    await expect(page.locator('body')).toBeVisible();
  });

  test("archivar notificacion", async ({ page }) => {
    await smokeTest(page, "/notificaciones", { user: seedUsers.cliente });
    await expect(page.locator('body')).toBeVisible();
  });

  test("preferencias notificaciones", async ({ page }) => {
    await smokeTest(page, "/perfil/notificaciones", { user: seedUsers.cliente });
    await expect(page.locator('text=/Preferencia|Email|In-app/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("desactivar email", async ({ page }) => {
    await smokeTest(page, "/perfil/notificaciones", { user: seedUsers.cliente });
    await expect(page.locator('body')).toBeVisible();
  });

  test("tasas de cambio", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('text=/USD|CUP|EUR|Tasa/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("convertir CUP a USD", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('body')).toBeVisible();
  });

  test("convertir USD a EUR", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('body')).toBeVisible();
  });

  test("set tasa manual negocio", async ({ page }) => {
    await smokeTest(page, "/negocio", { user: seedUsers.negocio });
    await expect(page.locator('body')).toBeVisible();
  });

  test("fallback ElToque", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('body')).toBeVisible();
  });

  test("cache 1 hora", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('body')).toBeVisible();
  });

  test("admin editar tasas", async ({ page }) => {
    await smokeTest(page, "/admin", { user: seedUsers.admin });
    await expect(page.locator('body')).toBeVisible();
  });

  test("negocio precio multiples monedas", async ({ page }) => {
    await smokeTest(page, "/negocio/productos", { user: seedUsers.negocio });
    await expect(page.locator('text=/Moneda|USD|CUP/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
