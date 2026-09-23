import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const testPages = [
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/auth/registro" },
  { name: "catalogo", path: "/catalogo" },
  { name: "carrito", path: "/carrito" },
  { name: "pedidos", path: "/pedidos" },
  { name: "pagos", path: "/pagos" },
  { name: "pago-detalle", path: "/pagos/sample-id" },
  { name: "negocio-pagos", path: "/negocio/pagos" },
  { name: "admin-pagos", path: "/admin/pagos" },
  { name: "facturas", path: "/facturas" },
  { name: "factura-detalle", path: "/facturas/sample-id" },
  { name: "negocio-facturas", path: "/negocio/facturas" },
  { name: "admin-facturas", path: "/admin/facturas" },
  { name: "admin-reportes-fiscal", path: "/admin/reportes/fiscal" },
  { name: "checkout", path: "/checkout" },
  { name: "checkout-confirmacion", path: "/checkout/confirmacion?pedidos=%5B%7B%22pedidosCreados%22%3A%5B%7D%2C%22totalGeneral%22%3A0%7D%5D" },
  { name: "perfil", path: "/perfil" },
  { name: "negocio-dashboard", path: "/negocio" },
  { name: "negocio-mi-negocio", path: "/negocio/mi-negocio" },
  { name: "negocio-horarios", path: "/negocio/horarios" },
  { name: "negocio-productos", path: "/negocio/productos" },
  { name: "negocio-servicios", path: "/negocio/servicios" },
  { name: "negocio-inventario", path: "/negocio/inventario" },
  { name: "negocio-disponibilidad", path: "/negocio/disponibilidad" },
  { name: "negocio-logistica", path: "/negocio/logistica" },
  { name: "negocio-pedidos", path: "/negocio/pedidos" },
  { name: "negocio-reservas", path: "/negocio/reservas" },
  { name: "negocio-ventas", path: "/negocio/ventas" },
  { name: "admin-solicitudes", path: "/admin/solicitudes" },
  { name: "solicitar-negocio", path: "/negocios/solicitar" },
  { name: "mis-solicitudes", path: "/mis-solicitudes" },
];

const themes = ["light", "dark"];

for (const testPage of testPages) {
  for (const theme of themes) {
    test(`${testPage.name} - ${theme} mode accessibility`, async ({ page }) => {
      await page.goto(testPage.path);
      await page.waitForLoadState("networkidle");

      if (theme === "dark") {
        await page.evaluate(() => {
          document.documentElement.setAttribute("data-theme", "dark");
        });
      } else {
        await page.evaluate(() => {
          document.documentElement.setAttribute("data-theme", "light");
        });
      }

      await page.waitForTimeout(100);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
}

test("theme toggle accessibility", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .include("[data-testid='theme-toggle']")
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("modal focus trap", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.click("button:has-text('Abrir Modal')");
  await page.waitForSelector('[role="dialog"]');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .include('[role="dialog"]')
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("form accessibility", async ({ page }) => {
  await page.goto("/auth/registro");
  await page.waitForLoadState("networkidle");

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .include("form")
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("table accessibility", async ({ page }) => {
  await page.goto("/catalogo");
  await page.waitForLoadState("networkidle");

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("catalogo availability badges - accessibility", async ({ page }) => {
  await page.goto("/catalogo");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const availabilityElements = page.locator('[data-testid="disponibilidad-badge"]');
  if (await availabilityElements.count() > 0) {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include('[data-testid="disponibilidad-badge"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  }
});

test("catalogo product cards - keyboard navigation", async ({ page }) => {
  await page.goto("/catalogo");
  await page.waitForLoadState("networkidle");

  const addButtons = page.locator('button:has-text("Ver detalles"), a:has-text("Ver detalles")');
  const count = await addButtons.count();
  if (count > 0) {
    await addButtons.first().focus();
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/catalogo\//);
  }
});

test("navigation accessibility", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .include("nav")
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test("color contrast - all text", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["cat.color"])
    .analyze();

  const contrastViolations = accessibilityScanResults.violations.filter(
    (v) => v.id === "color-contrast"
  );

  expect(contrastViolations).toEqual([]);
});

test("checkout fieldset and legend accessibility", async ({ page }) => {
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const fieldsets = await page.locator("fieldset").count();
  if (fieldsets > 0) {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include("fieldset")
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  }
});

test("checkout radio buttons accessibility", async ({ page }) => {
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const radios = await page.locator('input[type="radio"]').count();
  if (radios > 0) {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include('input[type="radio"]')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  }
});

test("checkout step navigation accessibility", async ({ page }) => {
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const nav = await page.locator('nav[aria-label="Pasos del checkout"]').count();
  if (nav > 0) {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include('nav[aria-label="Pasos del checkout"]')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  }
});

test("keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.keyboard.press("Tab");
  await page.waitForTimeout(100);

  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedElement).toBeTruthy();
});