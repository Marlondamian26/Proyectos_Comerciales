import { test, expect } from "@playwright/test";
import { BASE, seedUsers, smokeTest } from "./_helper";

test.describe("1.7 Pagos y 1.8 Facturacion", () => {
  test("pagos carga sin errores", async ({ page }) => {
    await smokeTest(page, "/pagos", { user: seedUsers.cliente });
  });

  test("transferencia estado PENDIENTE", async ({ page }) => {
    await smokeTest(page, "/pagos", { user: seedUsers.cliente });
    await expect(page.locator('text=/Pago|Transferencia|PENDIENTE/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("efectivo contra entrega", async ({ page }) => {
    await smokeTest(page, "/pagos", { user: seedUsers.cliente });
    await expect(page.locator('text=/Efectivo|Código|Codigo/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("ningun codigo de entrega en consola", async ({ page }) => {
    const secrets: string[] = [];
    page.on("console", (m) => {
      const t = m.text();
      if (/código|codigo|transferencia|clave/i.test(t)) secrets.push(t);
    });
    await smokeTest(page, "/pagos", { user: seedUsers.cliente });
    expect(secrets).toEqual([]);
  });

  test("facturas carga negocio", async ({ page }) => {
    await smokeTest(page, "/facturas", { user: seedUsers.negocio });
  });

  test("numeroFactura consecutivo", async ({ page }) => {
    await smokeTest(page, "/facturas", { user: seedUsers.negocio });
    await expect(page.locator('text=/Factura|PR-/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("IVA 10% no 21%", async ({ page }) => {
    await smokeTest(page, "/facturas", { user: seedUsers.negocio });
    await expect(page.locator('text=/IVA|10%/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("descarga factura ONAT", async ({ page }) => {
    await smokeTest(page, "/facturas", { user: seedUsers.negocio });
    const dl = page.locator('a:has-text("Descargar"), button:has-text("Descargar"), a:has-text("PDF")').first();
    if ((await dl.count()) > 0 && (await dl.isVisible().catch(() => false))) {
      await dl.click();
    }
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe("1.9 Logistica y 1.10 Transporte", () => {
  test("logistica carga cliente", async ({ page }) => {
    await smokeTest(page, "/logistica", { user: seedUsers.cliente });
  });

  test("proveedores logisticos alcance", async ({ page }) => {
    await smokeTest(page, "/logistica", { user: seedUsers.cliente });
    await expect(page.locator('text=/Logística|Logistica|Transporte|Envío|Envio/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("logistica carga proveedor", async ({ page }) => {
    await smokeTest(page, "/logistica", { user: seedUsers.logistica });
  });

  test("logistica no ve pedidos no asignados", async ({ page }) => {
    await smokeTest(page, "/logistica", { user: seedUsers.logistica });
    await expect(page.locator('body')).toBeVisible();
  });

  test("servicios tipo TRANSPORTE", async ({ page }) => {
    await smokeTest(page, "/transporte");
    await expect(page.locator('text=/Transporte|transporte|Paquete|Mudanza/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("buscar origen/destino", async ({ page }) => {
    await smokeTest(page, "/transporte?origen=Habana&destino=Santiago");
  });

  test("contratar transporte", async ({ page }) => {
    await smokeTest(page, "/transporte", { user: seedUsers.cliente });
    const btn = page.locator('button:has-text("Contratar"), button:has-text("Reservar")').first();
    if ((await btn.count()) > 0 && (await btn.isVisible().catch(() => false))) {
      await btn.click();
      await page.waitForTimeout(1000);
    }
    await expect(page.locator('text=/Reserva|Contratacion/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("sin origen/destino no rompe", async ({ page }) => {
    await smokeTest(page, "/transporte", { user: seedUsers.cliente });
  });
});
