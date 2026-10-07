import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Logout navigation — Volver a inicio should go to home, not dashboard", () => {
  test("logout → login page → 'Volver a inicio' links to / (not /cliente)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState("networkidle");

    await page.fill('input[id="identifier"]', "cliente@test.com");
    await page.fill('input[id="password"]', "cliente123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/cliente/);

    await page.getByRole("button", { name: "Menú de usuario" }).click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();

    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });

    const title = await page.title();
    expect(title).not.toContain("MiPyme Chile");
    expect(page.url()).toMatch(/^https?:\/\/[^/]+\/auth\/login/);

    const backLink = page.locator('a:has-text("Volver a inicio")').first();
    await expect(backLink).toBeVisible();

    await backLink.click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toMatch(/^https?:\/\/[^/]+$/);
    expect(page.url()).not.toContain("/cliente");
    expect(page.url()).not.toContain("/negocio");

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) =>
      c.name.includes("session-token")
    );
    expect(sessionCookie).toBeUndefined();
  });

  test("logout clears session — /cliente redirects to login without auth", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState("networkidle");

    await page.fill('input[id="identifier"]', "cliente@test.com");
    await page.fill('input[id="password"]', "cliente123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/cliente/);

    await page.getByRole("button", { name: "Menú de usuario" }).click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();

    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });

    await page.goto(`${BASE_URL}/cliente`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    expect(page.url()).not.toContain("/cliente");
    expect(page.url()).toMatch(/\/auth\/login|\//);
  });
});
