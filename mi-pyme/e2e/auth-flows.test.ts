import { test, expect } from "@playwright/test";

test.describe("S1: Flujo admin genérico forzado a cambiar contraseña", () => {
  test.beforeEach(async ({ page, request }) => {
    const response = await request.post("/api/test/reset-admin", {
      data: { password: "12345678", mustChangePassword: true },
    });
    expect(response.ok()).toBeTruthy();
    await page.context().clearCookies();
  });
  test("admin genérico → login con 12345678 → redirigido a /perfil/cambiar-password → cambia password → logout → re-login sin forzar", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "12345678");

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/perfil\/cambiar-password/);

    await expect(
      page.locator("text=Debes cambiar tu contraseña")
    ).toBeVisible();

     await page.fill('input[autocomplete="current-password"]', "12345678");
     await page.locator('input[autocomplete="new-password"]').nth(0).fill("newpassword123");
     await page.locator('input[autocomplete="new-password"]').nth(1).fill("newpassword123");

    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/auth\/login\?message=password-changed/);

    await expect(
      page.locator("text=Contraseña cambiada correctamente")
    ).toBeVisible();

    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "newpassword123");

    await page.click('button[type="submit"]');

    await page.waitForURL("/admin");

    await expect(page).not.toHaveURL(/\/perfil\/cambiar-password/);
  });

  test("admin genérico no puede navegar a /admin mientras mustChangePassword es true", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "12345678");

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/perfil\/cambiar-password/);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/perfil\/cambiar-password/);
  });

  test("admin genérico no puede navegar a /cliente mientras mustChangePassword es true", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "12345678");

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/perfil\/cambiar-password/);

    await page.goto("/cliente");

    await expect(page).toHaveURL(/\/perfil\/cambiar-password/);
  });
});

test.describe("S2: Usuario inactivo no puede loguearse", () => {
  test("usuario con isActive:false recibe 'Credenciales inválidas' (mismo mensaje que password incorrecta)", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    await page.fill('#identifier', "e2e-inactive@test.com");
    await page.fill('#password', "e2e-inactive-pass");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Credenciales invalidas")).toBeVisible();

    await expect(page).not.toHaveURL(/\/perfil\/cambiar-password/);
    await expect(page).not.toHaveURL("/admin");
    await expect(page).not.toHaveURL("/cliente");
  });

  test("usuario inactivo con password incorrecto también recibe 'Credenciales inválidas' (anti-enumeración)", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    await page.fill('#identifier', "e2e-inactive@test.com");
    await page.fill('#password', "wrongpassword");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Credenciales invalidas")).toBeVisible();
  });
});
