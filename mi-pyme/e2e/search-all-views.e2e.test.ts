import { test, expect } from "@playwright/test";

const views = [
  { name: "catalogo", path: "/catalogo", selector: 'input[name="q"]' },
  { name: "servicios", path: "/servicios", selector: 'input[name="q"], select[name="area"], select[name="tipo"]' },
];

for (const view of views) {
  test.describe(`Búsqueda en ${view.name}`, () => {
    const errors: string[] = [];

    test.beforeEach(async ({ page }) => {
      errors.length = 0;
      page.on("pageerror", (err) => {
        if (err.message.includes("441") || err.message.includes("Server Components")) {
          errors.push(err.message);
        }
      });
      page.on("console", (msg) => {
        if (msg.type() === "error" && msg.text().includes("441")) {
          errors.push(msg.text());
        }
      });
    });

    test("sin error #441 con query válido", async ({ page }) => {
      await page.goto(view.path);
      const input = page.locator(view.selector).first();
      if ((await input.count()) > 0) {
        await input.fill("aceite");
        await input.press("Enter");
      }
      await page.waitForLoadState("networkidle");

      expect(errors).toEqual([]);
    });

    test("sin error #441 con caracteres especiales", async ({ page }) => {
      await page.goto(view.path);
      const input = page.locator(view.selector).first();
      if ((await input.count()) > 0) {
        await input.fill("aceite & %$#");
        await input.press("Enter");
      }
      await page.waitForLoadState("networkidle");

      expect(errors).toEqual([]);
    });

    test("sin error #441 con query vacío", async ({ page }) => {
      await page.goto(`${view.path}?q=`);
      await page.waitForLoadState("networkidle");

      expect(errors).toEqual([]);
    });

    test("sin error #441 con búsqueda sin resultados", async ({ page }) => {
      await page.goto(view.path);
      const input = page.locator(view.selector).first();
      if ((await input.count()) > 0) {
        await input.fill("xyz123notfound");
        await input.press("Enter");
      }
      await page.waitForLoadState("networkidle");

      expect(errors).toEqual([]);
    });
  });
}
