import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

const CREDENTIALS = {
  cliente: { email: "cliente@test.com", password: "cliente123" },
  negocio: { email: "negocio@test.com", password: "negocio123" },
  admin: { email: "admin@test.com", password: "admin123" },
  mustchange: { email: "mustchange@test.com", password: "test1234" },
  locked: { email: "locked@test.com", password: "test1234" },
};

async function login(page, { email, password }) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[id="identifier"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');
}

async function logout(page) {
  await page.getByRole("button", { name: "Menú de usuario" }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
}

// ============================================================
// ESTADO A — ANÓNIMO (no logueado)
// ============================================================
test.describe("Estado A — Anónimo", () => {
  test("A1: home accesible sin sesión", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Iniciar sesión")).toBeVisible();
    await expect(page.locator("text=Comenzar gratis")).toBeVisible();
  });

  test("A2: /cliente redirige a login sin sesión", async ({ page }) => {
    await page.goto(`${BASE_URL}/cliente`);
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("callbackUrl=/cliente");
  });

  test("A3: /negocio redirige a login sin sesión", async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio`);
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("callbackUrl=/negocio");
  });

  test("A4: /admin redirige a login sin sesión", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("callbackUrl=/admin");
  });

  test("A5: /perfil redirige a login sin sesión", async ({ page }) => {
    await page.goto(`${BASE_URL}/perfil`);
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("callbackUrl=/perfil");
  });

  test("A6: agregar al carrito sin sesión redirige a login", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`);
    const agregarBtn = page.locator('button:has-text("Agregar")').first();
    if ((await agregarBtn.count()) > 0) {
      await agregarBtn.click();
      await page.waitForURL(/\/auth\/login/);
    }
  });
});

// ============================================================
// ESTADO B — LOGUEADO (sesión por defecto, 24h)
// ============================================================
test.describe("Estado B — Logueado", () => {
  test("B1: login como cliente redirige a /cliente", async ({ page }) => {
    await login(page, CREDENTIALS.cliente);
    await page.waitForURL(/\/cliente/);
  });

  test("B2: home muestra dashboard para usuario logueado", async ({ page }) => {
    await login(page, CREDENTIALS.cliente);
    await page.waitForURL(/\/cliente/);
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Ir a mi dashboard")).toBeVisible();
  });

  test("B3: logout redirige a /auth/login", async ({ page }) => {
    await login(page, CREDENTIALS.cliente);
    await page.waitForURL(/\/cliente/);
    await logout(page);
    expect(page.url()).toContain("/auth/login");
  });

  test("B4: tras logout, cookies de sesión eliminadas", async ({ page, context }) => {
    await login(page, CREDENTIALS.cliente);
    await page.waitForURL(/\/cliente/);

    const cookiesBefore = await context.cookies();
    const hasSessionBefore = cookiesBefore.some((c) =>
      c.name.includes("session-token")
    );
    expect(hasSessionBefore).toBe(true);

    await logout(page);

    const cookiesAfter = await context.cookies();
    const hasSessionAfter = cookiesAfter.some((c) =>
      c.name.includes("session-token")
    );
    expect(hasSessionAfter).toBe(false);
  });

  test("B5: cliente no puede acceder a /negocio", async ({ page }) => {
    await login(page, CREDENTIALS.cliente);
    await page.waitForURL(/\/cliente/);
    await page.goto(`${BASE_URL}/negocio`);
    await page.waitForURL(`${BASE_URL}/`);
  });

  test("B6: navbar muestra 'Cerrar sesión' cuando hay sesión", async ({ page }) => {
    await login(page, CREDENTIALS.cliente);
    await page.waitForURL(/\/cliente/);
    await expect(
      page.getByRole("button", { name: "Menú de usuario" })
    ).toBeVisible();
  });
});

// ============================================================
// ESTADO C — REMEMBER ME (30 días)
// ============================================================
test.describe("Estado C — Remember Me", () => {
  test("C1: rememberMe extiende expiración de cookie", async ({ page, context }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[id="identifier"]', CREDENTIALS.cliente.email);
    await page.fill('input[id="password"]', CREDENTIALS.cliente.password);
    await page.check('input[id="rememberMe"]');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/cliente/);

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) =>
      c.name.includes("session-token")
    );
    if (sessionCookie && sessionCookie.expires) {
      const expiresIn = sessionCookie.expires - Date.now() / 1000;
      expect(expiresIn).toBeGreaterThan(7 * 24 * 60 * 60);
    }
  });
});

// ============================================================
// ESTADO D — SESIÓN EXPIRADA
// ============================================================
test.describe("Estado D — Sesión expirada", () => {
  test("D1: sesión expirada redirige a login", async ({ page, context }) => {
    await login(page, CREDENTIALS.cliente);
    await page.waitForURL(/\/cliente/);

    await context.clearCookies();

    await page.goto(`${BASE_URL}/cliente`);
    await page.waitForURL(/\/auth\/login/);
  });
});

// ============================================================
// ESTADO G — MUST CHANGE PASSWORD
// ============================================================
test.describe("Estado G — Must Change Password", () => {
  test("G1: mustChangePassword fuerza redirect a cambiar-password", async ({ page }) => {
    await login(page, CREDENTIALS.mustchange);
    await page.waitForURL(/\/perfil\/cambiar-password/);
  });

  test("G2: mustChangePassword bloquea navegación a otras rutas", async ({ page }) => {
    await login(page, CREDENTIALS.mustchange);
    await page.waitForURL(/\/perfil\/cambiar-password/);

    await page.goto(`${BASE_URL}/catalogo`);
    await page.waitForURL(/\/perfil\/cambiar-password/);
  });
});

// ============================================================
// ESTADO I — MULTI-TAB
// ============================================================
test.describe("Estado I — Multi-tab", () => {
  test("I1: logout en una pestaña afecta a la otra", async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await login(page1, CREDENTIALS.cliente);
    await page1.waitForURL(/\/cliente/);

    await page2.goto(`${BASE_URL}/cliente`);
    await page2.waitForURL(/\/cliente/);

    await logout(page1);

    await page2.reload();
    await page2.waitForURL(/\/auth\/login/);

    await context.close();
  });
});
