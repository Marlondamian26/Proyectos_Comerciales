import { expect, test } from "@playwright/test";

test.describe("protección de administración de usuarios", () => {
  test("redirige a login a usuarios no autenticados", async ({ page }) => {
    await page.goto("/admin/usuarios");
    await expect(page).toHaveURL(/\/login/);
  });

  test("requiere autenticación en la API administrativa", async ({ request }) => {
    const response = await request.get("/api/admin/usuarios");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Autenticación requerida",
    });
  });
});
