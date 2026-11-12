import { expect, test } from "@playwright/test";

test.describe("Protected route redirects", () => {
  for (const route of [
    "/perfil",
    "/carrito",
    "/checkout",
    "/pedidos",
    "/reservas",
    "/pagos",
    "/facturas",
    "/notificaciones",
    "/mis-solicitudes",
  ]) {
    test(`${route} redirects anonymous visitors to login`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL(
        new RegExp(`/auth/login\\?callbackUrl=${encodeURIComponent(route)}`)
      );
    });
  }

  test("preserves the query string in callbackUrl", async ({ page }) => {
    await page.goto("/pedidos?estado=pendiente");

    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth/login");
    expect(url.searchParams.get("callbackUrl")).toBe(
      "/pedidos?estado=pendiente"
    );
  });

  test("rememberMe persists a 30-day session cookie", async ({ page, context }) => {
    await page.goto("/auth/login");
    await page.locator("#identifier").fill("e2e-cliente-negocio@test.com");
    await page.locator("#password").fill("E2eCliente123");
    await page.locator("#rememberMe").check();
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/cliente$/);

    const cookie = (await context.cookies()).find((entry) =>
      entry.name.endsWith("authjs.session-token")
    );
    if (!cookie) {
      throw new Error("Auth.js session cookie was not set after login");
    }
    expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(
      7 * 24 * 60 * 60
    );
  });

  test("logout clears the Auth.js session cookie across tabs", async ({
    page,
  }) => {
    const context = page.context();
    const secondTab = await context.newPage();

    await page.goto("/auth/login");
    await page.locator("#identifier").fill("e2e-cliente-negocio@test.com");
    await page.locator("#password").fill("E2eCliente123");
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/cliente$/);

    await secondTab.goto("/cliente");
    await expect(secondTab).toHaveURL(/\/cliente$/);

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);

    await secondTab.reload();
    await expect(secondTab).toHaveURL(/\/auth\/login/);

    const sessionCookie = (await context.cookies()).find((entry) =>
      entry.name.endsWith("authjs.session-token")
    );
    expect(sessionCookie).toBeUndefined();
  });
});
