import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Problema 1 — Navbar home (sin sesión) en mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no desborda y muestra hamburguesa + drawer con login/registro", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);

    const hamburger = page.locator('[aria-label="Abrir menú"]');
    await expect(hamburger).toBeVisible();

    await hamburger.click();

    await expect(page.locator('a:has-text("Iniciar sesión")')).toBeVisible();
    await expect(page.locator('a:has-text("Registrarse")')).toBeVisible();
  });
});

test.describe("Problema 2 — Navbar sticky", () => {
  test("se mantiene en el top al hacer scroll", async ({ page }) => {
    await page.goto("/catalogo");
    const navbar = page.locator("header, nav[aria-label='Navegación principal']").first();

    let box = await navbar.boundingBox();
    expect(box?.y).toBe(0);

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    box = await navbar.boundingBox();
    expect(box?.y).toBe(0);
  });
});

test.describe("Problema 3 — Sidebar mobile / body scroll lock", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("bloquea scroll del body cuando el drawer está abierto", async ({ page }) => {
    await page.goto("/cliente");
    await page.waitForLoadState("networkidle");

    await page.click('[aria-label="Abrir menú"]');

    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe("hidden");

    const initialScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 500);
    const finalScroll = await page.evaluate(() => window.scrollY);
    expect(finalScroll).toBe(initialScroll);

    await page.click('[aria-label="Cerrar menú"]');

    const restoredOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflow).toBe("");
  });
});

test.describe("Problema 5 — CTA sección contraste", () => {
  test("sin violaciones de contraste en la sección CTA", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const cta = page.locator('text=¿Listo para empezar?').locator("..");
    await expect(cta).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include(cta)
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
