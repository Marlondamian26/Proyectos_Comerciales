import { test, expect } from "@playwright/test";

const ROLES = [
  { name: "CLIENTE", email: "cliente_test_" + Date.now() + "@test.com", password: "Test123!", username: "cliente_test_" + Date.now(), nombre: "Cliente Test", provincia: "Buenos Aires", municipio: "La Plata" },
  { name: "NEGOCIO", email: "negocio_test_" + Date.now() + "@test.com", password: "Test123!", username: "negocio_test_" + Date.now(), nombre: "Negocio Test", provincia: "Buenos Aires", municipio: "La Plata" },
  { name: "LOGISTICA", email: "logistica_test_" + Date.now() + "@test.com", password: "Test123!", username: "logistica_test_" + Date.now(), nombre: "Logistica Test", provincia: "Buenos Aires", municipio: "La Plata" },
  { name: "ADMIN", email: "admin_test_" + Date.now() + "@test.com", password: "Test123!", username: "admin_test_" + Date.now(), nombre: "Admin Test", provincia: "Buenos Aires", municipio: "La Plata" },
];

const BASE_URL = "http://localhost:3000";

test.describe("User Registration & Login Flow", () => {
  for (const role of ROLES) {
    test(`${role.name} - full auth flow: register, login, logout, re-login`, async ({ page }) => {
      // ===== REGISTER =====
      await page.goto(`${BASE_URL}/auth/registro`);
      await page.waitForLoadState("networkidle");

      await page.fill('input[id="nombre"]', role.nombre);
      await page.fill('input[id="username"]', role.username);
      await page.fill('input[id="email"]', role.email);
      await page.fill('input[id="password"]', role.password);
      await page.fill('input[id="confirmPassword"]', role.password);
      await page.fill('input[id="provincia"]', role.provincia);
      await page.fill('input[id="municipio"]', role.municipio);

      // Seleccionar rol
      await page.click(`button:has-text("${role.name}")`);

      await page.click('button[type="submit"]');
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(8000);

      // Verificar que redirige al dashboard correspondiente
      let currentUrl = page.url();
      console.log(`${role.name} registration - Current URL:`, currentUrl);

      // Check for error message - look for the error div specifically
      const errorDiv = page.locator('.bg-destructive, [role="alert"]').first();
      if (await errorDiv.isVisible({ timeout: 3000 }).catch(() => false)) {
        const errorText = await errorDiv.textContent();
        console.log(`${role.name} registration error:`, errorText);
      } else {
        // Check for loading state
        const loadingBtn = page.locator('button:has-text("Creando cuenta..."), button:has-text("Registrar")');
        if (await loadingBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`${role.name} registration: still loading...`);
          await page.waitForTimeout(5000);
          currentUrl = page.url();
          console.log(`${role.name} registration after wait - Current URL:`, currentUrl);
        }
      }

      const expectedDashboard = {
        CLIENTE: "/cliente",
        NEGOCIO: "/negocio",
        LOGISTICA: "/logistica",
        ADMIN: "/admin",
      }[role.name];

      expect(currentUrl).toContain(expectedDashboard);

      // ===== LOGOUT =====
      // Buscar botón de cerrar sesión
      const logoutButton = page.locator('button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión"), [data-testid="logout"]');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
      } else {
        // Buscar en menú desplegable
        const userMenu = page.locator('[data-testid="user-menu"], button[aria-label="Menú de usuario"]').first();
        if (await userMenu.isVisible()) {
          await userMenu.click();
          await page.waitForTimeout(500);
          const logoutOption = page.locator('[role="menuitem"]:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
          if (await logoutOption.isVisible()) {
            await logoutOption.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(2000);
          }
        }
      }

      // Verificar que redirigió al login o home
      currentUrl = page.url();
      console.log(`${role.name} logout - Current URL:`, currentUrl);

      // ===== LOGIN =====
      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForLoadState("networkidle");

      await page.fill('input[id="identifier"]', role.email);
      await page.fill('input[id="password"]', role.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(5000);

      currentUrl = page.url();
      console.log(`${role.name} login - Current URL:`, currentUrl);

      // Verificar que el login fue exitoso
      expect(currentUrl).not.toContain("/auth/login");
      expect(currentUrl).toContain(expectedDashboard);

      // Verificar que el usuario está loggeado
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
      await expect(userMenu.first()).toBeVisible({ timeout: 5000 });

      // ===== RE-LOGIN =====
      // Cerrar sesión otra vez
      const logoutButton2 = page.locator('button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión"), [data-testid="logout"]');
      if (await logoutButton2.isVisible()) {
        await logoutButton2.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
      } else {
        const userMenu2 = page.locator('[data-testid="user-menu"], button[aria-label="Menú de usuario"]').first();
        if (await userMenu2.isVisible()) {
          await userMenu2.click();
          await page.waitForTimeout(500);
          const logoutOption2 = page.locator('[role="menuitem"]:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
          if (await logoutOption2.isVisible()) {
            await logoutOption2.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(2000);
          }
        }
      }

      // Volver a hacer login
      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForLoadState("networkidle");
      await page.fill('input[id="identifier"]', role.email);
      await page.fill('input[id="password"]', role.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(5000);

      // Verificar re-login exitoso
      currentUrl = page.url();
      console.log(`${role.name} re-login - Current URL:`, currentUrl);
      expect(currentUrl).not.toContain("/auth/login");
      expect(currentUrl).toContain(expectedDashboard);

      const userMenu2 = page.locator('[data-testid="user-menu"], button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
      await expect(userMenu2.first()).toBeVisible({ timeout: 5000 });
    });
  }
});