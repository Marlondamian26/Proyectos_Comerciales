import { test, expect } from "@playwright/test";

test.describe("Navbar transparente y scroll (React #441)", () => {
  test("navbar tiene bg-background/80 en top y /95 al scrollear", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    const header = page.locator("header, nav").first();
    await expect(header).toBeVisible();

    const before = (await header.getAttribute("class")) ?? "";
    expect(before).toMatch(/bg-background\/(60|70|80)/);

    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(450);

    const after = (await header.getAttribute("class")) ?? "";
    expect(after).toContain("bg-background/95");

    // No debe haber errores de React #441 en consola
    const react441Errors = consoleErrors.filter((e) => e.includes("441"));
    expect(react441Errors.length).toBe(0);
  });
});

test.describe("Buscador no causa React #441", () => {
  test("buscar en /catalogo no produce errores 441", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/catalogo");
    const searchInput = page.locator('input[type="search"], [placeholder*="buscar" i]').first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("aceite");
      await page.waitForTimeout(1000);
    }

    const react441Errors = consoleErrors.filter((e) => e.includes("441"));
    expect(react441Errors.length).toBe(0);
  });
});

test.describe("Back buttons en vistas internas", () => {
  test("cliente: catalogo tiene Volver al dashboard y navega a /cliente", async ({ page }) => {
    // Login como cliente
    await page.goto("/auth/login");
    await page.fill('input[name="email"], input[type="email"]', "cliente1@test.com");
    await page.fill('input[name="password"], input[type="password"]', "cliente123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/cliente/);

    // Ir a catalogo
    await page.goto("/catalogo");
    await expect(page.locator('text=Volver al dashboard')).toBeVisible();
    await page.click('text=Volver al dashboard');
    await page.waitForURL("/cliente");
  });

  test("cliente: servicios tiene Volver al dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="email"], input[type="email"]', "cliente1@test.com");
    await page.fill('input[name="password"], input[type="password"]', "cliente123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/cliente/);

    await page.goto("/servicios");
    await expect(page.locator('text=Volver al dashboard')).toBeVisible();
  });
});

test.describe("Responsive móvil sin overflow", () => {
  const viewports = [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone 12", width: 390, height: 844 },
    { name: "Galaxy S20", width: 360, height: 800 },
  ];

  for (const vp of viewports) {
    test(`sin overflow horizontal en ${vp.name} (/cliente)`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto("/cliente");
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasOverflow).toBe(false);
    });

    test(`sin overflow horizontal en ${vp.name} (/catalogo)`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto("/catalogo");
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasOverflow).toBe(false);
    });
  }
});
