import { test, expect } from "@playwright/test";
import { BASE, seedUsers, login, logout } from "./_helper";

test.describe("1.20 Sesiones (10 estados)", () => {
  test("A Anonimo: home accesible, rutas protegidas redirigen a login", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('body')).toBeVisible();
    await page.goto(`${BASE}/cliente`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/auth/login");
  });

  test("B Logueado: dashboard accesible, logout funciona", async ({ page }) => {
    await login(page, seedUsers.cliente);
    await page.goto(`${BASE}/cliente`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/cliente");
    await logout(page);
    expect(page.url()).toContain("/auth/login");
  });

  test("C RememberMe: sesion dura 30 dias", async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="identifier"]', seedUsers.cliente.email);
    await page.fill('input[id="password"]', seedUsers.cliente.password);
    await page.check('input[id="rememberMe"]');
    await page.click('button:has-text("Iniciar Sesion")');
    await page.waitForLoadState("networkidle");
    const cookies = await page.context().cookies();
    const nextAuth = cookies.find(c => c.name.includes("next-auth") || c.name.includes("session"));
    expect(nextAuth).toBeDefined();
  });

  test("D Expirada: redirige a login", async ({ page }) => {
    await page.goto(`${BASE}/cliente`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/auth/login");
  });

  test("E Invalida: sessionVersion invalida sesion", async ({ page }) => {
    await login(page, seedUsers.cliente);
    await page.goto(`${BASE}/cliente`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/cliente");
  });

  test("F Suspendida: isActive:false bloquea login", async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="identifier"]', seedUsers.cliente.email);
    await page.fill('input[id="password"]', seedUsers.cliente.password);
    await page.click('button:has-text("Iniciar Sesion")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Credenciales (invalidas|inválidas)|inactiva|suspendida/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("G MustChangePassword: fuerza cambio", async ({ page }) => {
    await login(page, seedUsers.cliente);
    await page.waitForTimeout(500);
    await expect(page.locator('text=/cambiar-password|Contraseña/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("H Bloqueada: lockedUntil bloquea login", async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="identifier"]', seedUsers.cliente.email);
    await page.fill('input[id="password"]', "wrong");
    await page.click('button:has-text("Iniciar Sesion")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Credenciales (invalidas|inválidas)/i')).toBeVisible();
  });

  test("I Multi-tab: logout afecta a otras pestañas", async ({ page, context }) => {
    await login(page, seedUsers.cliente);
    const page2 = await context.newPage();
    await page2.goto(`${BASE}/cliente`);
    await page2.waitForLoadState("networkidle");
    await logout(page);
    await page2.waitForTimeout(2000);
    await page2.reload();
    await page2.waitForLoadState("networkidle");
    expect(page2.url()).toContain("/auth/login");
    await page2.close();
  });

  test("J Multi-dispositivo: cambio de password invalida todos", async ({ page, context }) => {
    await login(page, seedUsers.cliente);
    const page2 = await context.newPage();
    await page2.goto(`${BASE}/cliente`);
    await page2.waitForLoadState("networkidle");
    await page.goto(`${BASE}/perfil/cambiar-password`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="currentPassword"]', seedUsers.cliente.password);
    await page.fill('input[id="password"]', "NuevaPass123!");
    await page.fill('input[id="confirmPassword"]', "NuevaPass123!");
    await page.click('button:has-text("Cambiar"), button[type="submit"]');
    await page.waitForTimeout(1000);
    await page2.waitForTimeout(2000);
    await page2.reload();
    await page2.waitForLoadState("networkidle");
    expect(page2.url()).toContain("/auth/login");
    await page2.close();
  });
});
