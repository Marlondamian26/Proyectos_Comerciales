import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Payment Flow E2E", () => {
  test("cliente: ver lista de pagos", async ({ page }) => {
    await page.goto(`${BASE_URL}/pagos`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText(/mis pagos/i);

    const table = page.locator("table tbody");
    if (await table.isVisible()) {
      const rows = await table.locator("tr").count();
      console.log(`Found ${rows} payment rows`);
    }
  });

  test("cliente: navegar a detalle de pago desde pedidos", async ({ page }) => {
    await page.goto(`${BASE_URL}/pedidos`);
    await page.waitForLoadState("networkidle");

    const pagoLink = page.locator("a:has-text('Ver mi pago'), a:has-text('Asignar pago'), a:has-text('Ver pago')");
    if ((await pagoLink.count()) > 0) {
      await pagoLink.first().click();
      await page.waitForLoadState("networkidle");
      await expect(page.locator("text=/recibo de pago/i, text=/mis pagos/i")).toBeVisible();
    }
  });

  test("admin: ver panel de pagos con resumen", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pagos`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText(/pagos/i);

    const summaryLabel = page.locator("text=/Total cobrado/i");
    if (await summaryLabel.count() > 0) {
      await expect(summaryLabel.first()).toBeVisible();
    }
  });

  test("negocio: ver pagos de su negocio", async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/pagos`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText(/pagos/i);
  });

  test("admin: generar recibo desde detalle de pago", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pagos`);
    await page.waitForLoadState("networkidle");

    const rows = page.locator("table tbody tr");
    if ((await rows.count()) > 0) {
      const firstRowActions = rows.first().locator("text=/Ver detalle/i, text=/Detalle/i");
      if (await firstRowActions.count() > 0) {
        await firstRowActions.first().click();
        await page.waitForLoadState("networkidle");

        const reciboLink = page.locator("a:has-text('Recibo'), text=/recibo/i, a:has-text('Imprimir')");
        if (await reciboLink.count() > 0) {
          await reciboLink.first().click();
          await page.waitForLoadState("networkidle");
        }
      }
    }
  });
});
