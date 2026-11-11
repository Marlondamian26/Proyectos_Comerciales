import { test, expect } from "@playwright/test";

test.describe("Home UI refinements", () => {
  test("navbar cambia opacidad al hacer scroll", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header, nav").first();
    await expect(header).toBeVisible();
    const before = (await header.getAttribute("class")) ?? "";
    expect(before).toMatch(/bg-background\/(60|70|80)/);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(450);
    const after = (await header.getAttribute("class")) ?? "";
    expect(after).toContain("bg-background/95");
  });

  test("orden de secciones: Servicios antes que Áreas y Áreas antes que Negocios", async ({ page }) => {
    await page.goto("/");
    const servicios = page.getByRole("heading", { name: "Servicios Populares" });
    const areas = page.getByRole("heading", { name: "Explora por Áreas" });
    const negocios = page.getByRole("heading", { name: "Negocios Destacados" });
    await expect(servicios).toBeVisible();
    await expect(areas).toBeVisible();
    await expect(negocios).toBeVisible();
    const [sy, ay, ny] = await Promise.all([
      servicios.boundingBox().then((b) => b?.y ?? 0),
      areas.boundingBox().then((b) => b?.y ?? 0),
      negocios.boundingBox().then((b) => b?.y ?? 0),
    ]);
    expect(sy).toBeLessThan(ay);
    expect(ay).toBeLessThan(ny);
  });

  test("sin overflow horizontal en móvil (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);
  });
});
