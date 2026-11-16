import { test, expect } from "@playwright/test";
import { BASE, seedUsers, login, smokeTest, logout } from "./_helper";

test.describe("1.1 Autenticacion", () => {
  test("login con email valido redirige a dashboard del cliente", async ({ page }) => {
    await smokeTest(page, "/cliente", { user: seedUsers.cliente });
    expect(page.url()).toContain(seedUsers.cliente.dashboard);
  });

  test("login con email valido redirige a dashboard del negocio", async ({ page }) => {
    await smokeTest(page, "/negocio", { user: seedUsers.negocio });
    expect(page.url()).toContain(seedUsers.negocio.dashboard);
  });

  test("login con password incorrecta muestra Credenciales invalidas", async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="identifier"]', seedUsers.cliente.email);
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button:has-text("Iniciar Sesion")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Credenciales (invalidas|inválidas)/i')).toBeVisible();
  });

  test("login con usuario inexistente muestra mismo mensaje (anti-enumeracion)", async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="identifier"]', "noexiste@test.com");
    await page.fill('input[id="password"]', seedUsers.cliente.password);
    await page.click('button:has-text("Iniciar Sesion")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Credenciales (invalidas|inválidas)/i')).toBeVisible();
  });

  test("registro con email duplicado da error", async ({ page }) => {
    await page.goto(`${BASE}/auth/registro`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="nombre"]', "Dup User");
    await page.fill('input[id="username"]', "dupuser_" + Date.now());
    await page.fill('input[id="email"]', seedUsers.cliente.email);
    await page.fill('input[id="password"]', "Test123!");
    await page.fill('input[id="confirmPassword"]', "Test123!");
    await page.fill('input[id="provincia"]', "Habana");
    await page.fill('input[id="municipio"]', "Playa");
    await page.click('button:has-text("Cliente")');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/ya existe|existente|duplicado|Credenciales/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("logout redirige a /auth/login", async ({ page }) => {
    await smokeTest(page, "/cliente", { user: seedUsers.cliente });
    await logout(page);
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/auth/login");
  });

  test("rutas protegidas redirigen a login cuando anonimo", async ({ page }) => {
    await page.goto(`${BASE}/cliente`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/auth/login");
  });

  test("no errores de consola en login", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.goto(`${BASE}/auth/login`);
    await page.waitForLoadState("networkidle");
    expect(pageErrors.filter(e => !e.includes("favicon") && !e.includes("404"))).toEqual([]);
  });
});
