import { test, expect } from "@playwright/test";

const viewports = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 12", width: 390, height: 844 },
  { name: "iPhone 14 Pro Max", width: 430, height: 932 },
  { name: "Galaxy S20", width: 360, height: 800 },
  { name: "Pixel 5", width: 393, height: 851 },
  { name: "iPad Mini", width: 768, height: 1024 },
  { name: "iPad Pro", width: 1024, height: 1366 },
  { name: "Laptop", width: 1440, height: 900 },
  { name: "Desktop", width: 1920, height: 1080 },
];

const routes = [
  "/",
  "/catalogo",
  "/servicios",
  "/carrito",
  "/checkout",
  "/pedidos",
  "/reservas",
  "/pagos",
  "/facturas",
  "/notificaciones",
  "/perfil",
  "/auth/login",
  "/auth/registro",
  "/cliente",
  "/negocio",
  "/negocio/productos",
  "/negocio/pedidos",
  "/logistica",
  "/admin",
  "/admin/usuarios",
  "/admin/solicitudes",
];

for (const vp of viewports) {
  test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of routes) {
      test(`sin overflow horizontal en ${route}`, async ({ page }) => {
        await page.goto(`http://localhost:3000${route}`);
        await page.waitForLoadState("networkidle");

        const hasOverflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
        );

        expect(hasOverflow).toBe(false);
      });
    }
  });
}

test.describe("mobile (iPhone 12 390x844) validaciones UX", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("todos los touch targets >= 44x44", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("networkidle");

    const smallTargets = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(
          'button, a, input, select, textarea, [role="button"]'
        )
      )
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            (rect.width < 44 || rect.height < 44)
          );
        })
        .map((el) => ({
          tag: el.tagName,
          text: el.textContent?.slice(0, 30),
          width: Math.round(el.getBoundingClientRect().width),
          height: Math.round(el.getBoundingClientRect().height),
        }));
    });

    expect(smallTargets).toEqual([]);
  });

  test("todo el texto body es >= 14px", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("networkidle");

    const smallTexts = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("p, span, a, button, li, td, th, label")
      )
        .filter((el) => {
          const fontSize = parseFloat(getComputedStyle(el).fontSize);
          const text = el.textContent?.trim();
          return text && text.length > 0 && fontSize < 14;
        })
        .map((el) => ({
          text: el.textContent?.slice(0, 30),
          fontSize: getComputedStyle(el).fontSize,
        }));
    });

    expect(smallTexts).toEqual([]);
  });

  test("ninguna imagen esta distorsionada en catalogo", async ({ page }) => {
    await page.goto("http://localhost:3000/catalogo");
    await page.waitForLoadState("networkidle");

    const distorted = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img"))
        .filter((el) => {
          if (!el.naturalWidth || !el.naturalHeight) return false;
          const naturalRatio = el.naturalWidth / el.naturalHeight;
          const displayRatio = el.width / el.height;
          return Math.abs(naturalRatio - displayRatio) > 0.1;
        })
        .map((el) => ({
          src: el.src.slice(0, 80),
          alt: el.alt,
        }));
    });

    expect(distorted).toEqual([]);
  });
});
