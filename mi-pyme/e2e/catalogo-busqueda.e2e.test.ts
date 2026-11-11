import { test, expect } from "@playwright/test";

test.describe("Búsqueda en catálogo - sin errores React #441", () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("441")) {
        errors.push(msg.text());
      }
    });
  });

  test("buscar 'aceite' no genera error #441", async ({ page }) => {
    await page.goto("/catalogo");
    await page.fill('input[name="q"]', "aceite");
    await page.press('input[name="q"]', "Enter");
    await page.waitForLoadState("networkidle");

    const react441Errors = errors.filter((e) => e.includes("441"));
    expect(react441Errors.length).toBe(0);
  });

  test("buscar con caracteres especiales no genera error #441", async ({ page }) => {
    await page.goto("/catalogo");
    await page.fill('input[name="q"]', "aceite & %$#");
    await page.press('input[name="q"]', "Enter");
    await page.waitForLoadState("networkidle");

    const react441Errors = errors.filter((e) => e.includes("441"));
    expect(react441Errors.length).toBe(0);
  });

  test("búsqueda sin resultados no genera error #441", async ({ page }) => {
    await page.goto("/catalogo");
    await page.fill('input[name="q"]', "xyz123notfound");
    await page.press('input[name="q"]', "Enter");
    await page.waitForLoadState("networkidle");

    const react441Errors = errors.filter((e) => e.includes("441"));
    expect(react441Errors.length).toBe(0);
    await expect(page.locator('text=No se encontraron resultados')).toBeVisible();
  });

  test("búsqueda con query vacío no genera error #441", async ({ page }) => {
    await page.goto("/catalogo?q=");
    await page.waitForLoadState("networkidle");

    const react441Errors = errors.filter((e) => e.includes("441"));
    expect(react441Errors.length).toBe(0);
  });
});
