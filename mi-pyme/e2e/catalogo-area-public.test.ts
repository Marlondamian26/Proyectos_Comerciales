import { expect, test } from "@playwright/test";

test.describe("Catálogo público y acceso a dashboards", () => {
  test("la home no muestra empty states ni CTA de administración", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByText("No hay servicios disponibles")).toHaveCount(0);
    await expect(page.getByText("Agregar primer servicio")).toHaveCount(0);
    await expect(page.getByText("Agregar primer producto")).toHaveCount(0);
  });

  test("el catálogo no expone CTA de administración cuando no hay resultados", async ({
    page,
  }) => {
    await page.goto("/catalogo?area=area-inexistente-para-prueba");

    await expect(page.getByText("Agregar primer servicio")).toHaveCount(0);
    await expect(page.getByText("Agregar primer producto")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ver catálogo completo" })).toHaveCount(2);
  });

  test("un usuario anónimo que visita /cliente es enviado al login", async ({
    page,
  }) => {
    await page.goto("/cliente");
    await expect(page).toHaveURL(/\/auth\/login\?/);
    expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/cliente");
  });
});
