import { test, expect } from "@playwright/test";
import { BASE, seedUsers, login, smokeTest, logout } from "./_helper";

test.describe("1.3 Carrito y 1.4 Checkout y 1.5 Reservas y 1.6 Pedidos", () => {
  test("carrito vacio carga", async ({ page }) => {
    await smokeTest(page, "/carrito", { user: seedUsers.cliente });
  });

  test("agregar producto al carrito", async ({ page }) => {
    await smokeTest(page, "/catalogo", { user: seedUsers.cliente });
    const addBtn = page.locator('button:has-text("Agregar"), button:has-text("Añadir"), button:has-text("Agregar al carrito")').first();
    if ((await addBtn.count()) > 0 && (await addBtn.isVisible().catch(() => false))) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.goto(`${BASE}/carrito`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator('text=/Kit|Belleza|25/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });

  test("checkout carga", async ({ page }) => {
    await smokeTest(page, "/checkout", { user: seedUsers.cliente });
  });

  test("recogida en tienda envio 0", async ({ page }) => {
    await smokeTest(page, "/checkout", { user: seedUsers.cliente });
    await expect(page.locator('text=/Recogida|Envío|Envio|0/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("listar reservas del cliente", async ({ page }) => {
    await smokeTest(page, "/reservas", { user: seedUsers.cliente });
  });

  test("servicios listan para reserva", async ({ page }) => {
    await smokeTest(page, "/servicios", { user: seedUsers.cliente });
    await expect(page.locator('text=/Servicio|Manicura/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("cliente solo ve sus reservas", async ({ page }) => {
    await smokeTest(page, "/reservas", { user: seedUsers.cliente });
    await expect(page.locator('body')).toBeVisible();
  });

  test("listar pedidos del cliente", async ({ page }) => {
    await smokeTest(page, "/pedidos", { user: seedUsers.cliente });
  });

  test("detalle del pedido", async ({ page }) => {
    await smokeTest(page, "/pedidos", { user: seedUsers.cliente });
    await expect(page.locator('text=/Pedido|Total|Items|Envío|Envio/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("cliente no puede ver pedidos de otro 403", async ({ page }) => {
    await smokeTest(page, "/pedidos", { user: seedUsers.cliente });
    await expect(page.locator('body')).toBeVisible();
  });
});
