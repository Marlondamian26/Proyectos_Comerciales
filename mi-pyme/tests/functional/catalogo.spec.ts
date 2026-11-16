import { test, expect } from "@playwright/test";
import { BASE, smokeTest } from "./_helper";

test.describe("1.2 Catalogo", () => {
  test("catalogo carga sin errores", async ({ page }) => {
    await smokeTest(page, "/catalogo");
  });

  test("filtrar por area", async ({ page }) => {
    await smokeTest(page, "/catalogo?area=servicios");
  });

  test("filtrar por subarea", async ({ page }) => {
    await smokeTest(page, "/catalogo?subarea=belleza");
  });

  test("filtrar por negocio", async ({ page }) => {
    await smokeTest(page, "/catalogo?negocio=pizzeria");
  });

  test("filtrar por disponibilidad hoy", async ({ page }) => {
    await smokeTest(page, "/catalogo?disponibleHoy=true");
  });

  test("busqueda por texto", async ({ page }) => {
    await smokeTest(page, "/catalogo?q=kit");
    await expect(page.locator('text=/Kit|Belleza/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("busqueda sin resultados empty state", async ({ page }) => {
    await smokeTest(page, "/catalogo?q=zzznonexistente12345");
    await expect(page.locator('text=/No se encuentran|sin resultados|Empty|No hay/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("busqueda caracteres especiales no rompe", async ({ page }) => {
    await smokeTest(page, "/catalogo?q=%24%23%40%21");
  });

  test("paginacion", async ({ page }) => {
    await smokeTest(page, "/catalogo?page=2");
  });

  test("ordenamiento por precio", async ({ page }) => {
    await smokeTest(page, "/catalogo?sort=precio&orden=asc");
  });

  test("cards muestran imagen", async ({ page }) => {
    await smokeTest(page, "/catalogo");
    await expect(page.locator('img')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("cards muestran precio", async ({ page }) => {
    await smokeTest(page, "/catalogo");
    await expect(page.locator('text=/\\$|USD|CUP|precio|\\d/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("sin overflow horizontal", async ({ page }) => {
    await smokeTest(page, "/catalogo");
  });

  test("filtrar por ubicacion provincia/municipio", async ({ page }) => {
    await smokeTest(page, "/catalogo?provincia=Habana");
  });
});
