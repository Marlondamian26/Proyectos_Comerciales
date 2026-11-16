import { expect, type Page } from "@playwright/test";

export const BASE = "http://localhost:3000";

export const seedUsers = {
  cliente: { email: "cliente1@test.com", password: "cliente123", dashboard: "/cliente" },
  negocio: { email: "negocio.pizzeria@test.com", password: "negocio123", dashboard: "/negocio" },
  logistica: { email: "logistica1@test.com", password: "logistica123", dashboard: "/logistica" },
  admin: { email: "admin@mi-pyme.local", password: "12345678", dashboard: "/admin" },
};

type SmokeOpts = { user?: { email: string; password: string; dashboard: string }; checkOverflow?: boolean };

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto(`${BASE}/auth/login`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[id="identifier"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.click('button:has-text("Iniciar Sesion")');
  await page.waitForTimeout(1500);
}

// Robust smoke test: page loads, no unhandled JS errors, no 500 responses, no overflow.
export async function smokeTest(page: Page, route: string, opts: SmokeOpts = {}) {
  const { user = null, checkOverflow = true } = opts;
  const pageErrors: string[] = [];
  const failedResponses: { url: string; status: number }[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 500) failedResponses.push({ url: r.url(), status: r.status() });
  });
  if (user) await login(page, user);
  await page.goto(`${BASE}${route}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  if (checkOverflow) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) pageErrors.push("overflow horizontal en " + route);
  }
  expect(pageErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
  return page;
}

export async function logout(page: Page) {
  const menu = page.locator('[data-testid="user-menu"], button:has-text("Cuenta"), [aria-label="Usuario"], [role="button"]').first();
  if ((await menu.count()) > 0 && (await menu.isVisible().catch(() => false))) {
    await menu.click();
    await page.waitForTimeout(300);
  }
  const lo = page.locator('a:has-text("Cerrar sesion"), button:has-text("Cerrar sesion"), [role="menuitem"]:has-text("Cerrar sesion")').first();
  if ((await lo.count()) > 0 && (await lo.isVisible().catch(() => false))) {
    await lo.click();
    await page.waitForLoadState("networkidle").catch(() => {});
  }
}
