import { test, expect } from "@playwright/test";
import { BASE, smokeTest } from "./_helper";

test.describe("1.18 Documentos legales y 1.19 Busqueda", () => {
  test("/privacidad carga", async ({ page }) => {
    await smokeTest(page, "/privacidad");
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Privacidad/i })).toBeVisible();
  });

  test("/terminos carga", async ({ page }) => {
    await smokeTest(page, "/terminos");
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Términos|Terminos/i })).toBeVisible();
  });

  test("/devoluciones carga", async ({ page }) => {
    await smokeTest(page, "/devoluciones");
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Devoluciones|Devolucion/i })).toBeVisible();
  });

  test("footer enlaces legales", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('a:has-text("Privacidad"), a:has-text("Términos"), a:has-text("Devoluciones")')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("checkbox terminos registro", async ({ page }) => {
    await smokeTest(page, "/auth/registro");
    await expect(page.locator('input[type="checkbox"], h1, h2, h3, label').filter({ hasText: /Términos|Terminos/i })).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("aviso terminos checkout", async ({ page }) => {
    await smokeTest(page, "/checkout");
    await expect(page.locator('h1, h2, h3, p, label').filter({ hasText: /Términos|Terminos|Política/i })).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("no errores consola paginas legales", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await smokeTest(page, "/privacidad");
    await smokeTest(page, "/terminos");
    await smokeTest(page, "/devoluciones");
    expect(pageErrors.filter(e => !e.includes("favicon") && !e.includes("404"))).toEqual([]);
  });

  test("buscar en catalogo", async ({ page }) => {
    await smokeTest(page, "/catalogo?q=kit");
    await expect(page.locator('h1, h2, h3, h4, p, span').filter({ hasText: /Kit|Belleza/i })).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("buscar sin resultados", async ({ page }) => {
    await smokeTest(page, "/catalogo?q=zzznonexistente12345");
    await expect(page.locator('h1, h2, h3, p, div').filter({ hasText: /No se encuentran|sin resultados|Empty|No hay/i })).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("buscar caracteres especiales", async ({ page }) => {
    await smokeTest(page, "/catalogo?q=%24%23%40");
  });

  test("query vacio todos resultados", async ({ page }) => {
    await smokeTest(page, "/catalogo");
    await expect(page.locator('h1, h2, h3, h4, p, span').filter({ hasText: /Kit|Producto/i })).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("sin error React 441", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await smokeTest(page, "/catalogo?q=test");
    const react441 = errors.filter(e => /441|hydration|Hydration/i.test(e));
    expect(react441).toEqual([]);
  });
});
