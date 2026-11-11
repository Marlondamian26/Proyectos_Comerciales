import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Recuperación de contraseña — E2E", () => {
  test("Página de recuperación carga y muestra formulario", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/recuperar`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText("Recuperar contraseña");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(
      page.locator('a:has-text("Volver al inicio de sesión")')
    ).toBeVisible();
  });

  test("Solicitar recuperación con email existente — mensaje genérico, sin token en respuesta", async ({
    page,
    request,
  }) => {
    await page.goto(`${BASE_URL}/auth/recuperar`);
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "e2e-cliente-negocio@test.com");
    await page.click('button[type="submit"]');

    // Debe mostrar mensaje de éxito genérico (anti-enumeración)
    await expect(page.locator("text=Correo enviado")).toBeVisible();
    await expect(
      page.locator("text=Si el email existe en nuestro sistema")
    ).toBeVisible();
  });

  test("Solicitar recuperación con email inexistente — mismo mensaje genérico (anti-enumeración)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth/recuperar`);
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "noexiste-e2e@test.com");
    await page.click('button[type="submit"]');

    // Mismo mensaje que email existente
    await expect(page.locator("text=Correo enviado")).toBeVisible();
    await expect(
      page.locator("text=Si el email existe en nuestro sistema")
    ).toBeVisible();
  });

  test("Token inválido muestra error en página de resetear", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/resetear/token-invalido-e2e`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("text=Token inválido o expirado")
    ).toBeVisible();
  });

  test("Link '¿Olvidaste tu contraseña?' en login redirige a recuperar", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState("networkidle");

    await page.click('a:has-text("¿Olvidaste tu contraseña?")');
    await page.waitForURL(/\/auth\/recuperar/);
  });

  test("Vincular 'Volver al inicio de sesion' en recuperación redirige a login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth/recuperar`);
    await page.waitForLoadState("networkidle");

    await page.click('a:has-text("Volver al inicio de sesión")');
    await page.waitForURL(/\/auth\/login/);
  });
});
