import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/* ============================================================
   Problema 1 — Navbar sticky global en TODAS las vistas
   ============================================================ */
const stickyRoutes = [
  "/",
  "/catalogo",
  "/servicios",
  "/combos",
  "/transporte",
  "/carrito",
  "/pedidos",
  "/cliente",
  "/negocio",
  "/admin",
  "/perfil",
];

for (const route of stickyRoutes) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`navbar sticky en ${route} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState("networkidle");

      const navbar = page.locator("header, nav[aria-label='Navegación principal']").first();
      await expect(navbar).toBeVisible();

      let box = await navbar.boundingBox();
      expect(box?.y).toBe(0);

      // Scroll 500px
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(300);

      box = await navbar.boundingBox();
      expect(box?.y).toBe(0);
    });
  }
}

/* ============================================================
   Problema 2 — Grids con columnas correctas en mobile
   ============================================================ */
const grids = [
  { route: "/", testId: "servicios-populares-grid", expected: 2 },
  { route: "/", testId: "negocios-destacados-grid", expected: 1 },
  { route: "/", testId: "areas-grid", expected: 3 },
  { route: "/catalogo", testId: "catalogo-grid", expected: 2 },
  { route: "/servicios", testId: "servicios-grid", expected: 2 },
  { route: "/combos", testId: "combos-grid", expected: 1 },
  { route: "/transporte", testId: "transporte-grid", expected: 1 },
];

for (const g of grids) {
  test(`${g.route} — ${g.testId} tiene ${g.expected} columna(s) en mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://localhost:3000${g.route}`);

    const grid = page.locator(`[data-testid="${g.testId}"]`).first();
    await expect(grid).toBeVisible();

    const gridCols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    const columnCount = gridCols.split(" ").filter(Boolean).length;
    expect(columnCount).toBe(g.expected);
  });
}

/* ============================================================
   Problema 4 — Negocios Destacados: 1 col mobile / 2 tablet / 3 desktop
   ============================================================ */
const negocioGridCases = [
  { width: 390, expected: 1 },
  { width: 768, expected: 2 },
  { width: 1440, expected: 3 },
];

for (const c of negocioGridCases) {
  test(`Negocios Destacados ${c.expected} columna(s) en ${c.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: c.width, height: 900 });
    await page.goto("/");

    const grid = page.locator('[data-testid="negocios-destacados-grid"]').first();
    await expect(grid).toBeVisible();

    const gridCols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    const columnCount = gridCols.split(" ").filter(Boolean).length;
    expect(columnCount).toBe(c.expected);
  });
}
test("todas las imágenes del catálogo cargan sin error 4xx/5xx", async ({ page }) => {
  const errors: Array<{ url: string; status: number }> = [];

  page.on("response", (res) => {
    if (
      res.url().includes("unsplash") ||
      res.url().includes("cloudinary") ||
      res.url().includes("pexels")
    ) {
      if (res.status() >= 400) {
        errors.push({ url: res.url(), status: res.status() });
      }
    }
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/catalogo");
  await page.waitForLoadState("networkidle");

  expect(errors).toEqual([]);
});

/* ============================================================
   Axe — accesibilidad en home mobile
   ============================================================ */
test("sin violaciones de accesibilidad en home mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
