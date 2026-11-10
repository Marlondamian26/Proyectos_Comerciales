import { test, expect } from "@playwright/test";

const PROD_URL = "https://mi-pyme-seven.vercel.app";

const views = [
  { name: "catalogo", path: "/catalogo", selector: 'input[name="q"]' },
  { name: "servicios", path: "/servicios", selector: "select" },
];

for (const view of views) {
  test.describe(`Producción - ${view.name} sin #441`, () => {
    const errors: string[] = [];

    test.beforeEach(async ({ page }) => {
      errors.length = 0;
      page.on("pageerror", (err) => {
        if (err.message.includes("441")) errors.push(err.message);
      });
      page.on("console", (msg) => {
        if (msg.type() === "error" && msg.text().includes("441")) {
          errors.push(msg.text());
        }
      });
    });

    test("búsqueda sin error #441 en producción", async ({ page }) => {
      await page.goto(`${PROD_URL}${view.path}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const input = page.locator(view.selector).first();
      if ((await input.count()) > 0) {
        await input.fill("aceite");
        await input.press("Enter");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
      }

      expect(errors).toEqual([]);
    });
  });
}
