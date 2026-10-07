import { test, expect, devices } from "@playwright/test";

test.describe("Logos visibles en móvil (iPhone 12)", () => {
  test.use({ ...devices["iPhone 12"] });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("logo horizontal visible en navbar (móvil)", async ({ page }) => {
    const logo = page.locator('img[alt="Mi-Pyme"]').first();
    await expect(logo).toBeVisible();

    const box = await logo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test("logo principal visible en hero (móvil)", async ({ page }) => {
    const logos = page.locator('img[alt="Mi-Pyme"]');
    await expect(logos).toHaveCount(2);

    const principalLogo = logos.nth(1);
    await expect(principalLogo).toBeVisible();

    const box = await principalLogo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test("todos los logos tienen atributo sizes (móvil)", async ({ page }) => {
    const logos = page.locator('img[alt="Mi-Pyme"]');
    await expect(logos).toHaveCount(2);

    for (const logo of await logos.all()) {
      const hasSizes = await logo.getAttribute("sizes");
      expect(hasSizes).not.toBeNull();
      expect(hasSizes!.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Logos visibles en tablet (iPad)", () => {
  test.use({ ...devices["iPad"] });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("logo horizontal visible en navbar (tablet)", async ({ page }) => {
    const logo = page.locator('img[alt="Mi-Pyme"]').first();
    await expect(logo).toBeVisible();

    const box = await logo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test("logo principal visible en hero (tablet)", async ({ page }) => {
    const logos = page.locator('img[alt="Mi-Pyme"]');
    await expect(logos).toHaveCount(2);

    const principalLogo = logos.nth(1);
    await expect(principalLogo).toBeVisible();
  });
});

test.describe("Logos visibles en desktop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("todos los logos visibles (desktop)", async ({ page }) => {
    const logos = page.locator('img[alt="Mi-Pyme"]');
    await expect(logos).toHaveCount(2);

    for (const logo of await logos.all()) {
      await expect(logo).toBeVisible();
      const box = await logo.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    }
  });
});

test.describe("Carga correcta de imágenes de logo", () => {
  test("imágenes de logo sin errores 404 (desktop)", async ({ page }) => {
    const responses: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      if (response.url().includes("logo-")) {
        responses.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const logoResponses = responses.filter((r) => r.url.includes("logo-"));
    expect(logoResponses.length).toBeGreaterThan(0);

    for (const resp of logoResponses) {
      expect(resp.status).toBe(200);
    }
  });

  test("imágenes de logo sin errores 404 (móvil)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const responses: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      if (response.url().includes("logo-")) {
        responses.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const logoResponses = responses.filter((r) => r.url.includes("logo-"));
    expect(logoResponses.length).toBeGreaterThan(0);

    for (const resp of logoResponses) {
      expect(resp.status).toBe(200);
    }
  });
});
