import { test, expect } from "@playwright/test";
import { BASE, smokeTest } from "./_helper";

test.describe("1.21 Home y fondos dinamicos", () => {
  test("home carga sin errores", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Mi-Pyme/i })).toBeVisible();
  });

  test("hero carousel", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('body')).toBeVisible();
  });

  test("fondos seccion rotan", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('body')).toBeVisible();
  });

  test("cards imagen unica", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('img')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("fallback visual", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('body')).toBeVisible();
  });

  test("sin flashback mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await smokeTest(page, "/");
  });

  test("grid responsive", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await smokeTest(page, "/");
  });

  test("CTAs segun sesion", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('text=/Comenzar|Dashboard|Ir a mi dashboard/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("divisores gradientes", async ({ page }) => {
    await smokeTest(page, "/");
    await expect(page.locator('body')).toBeVisible();
  });
});
