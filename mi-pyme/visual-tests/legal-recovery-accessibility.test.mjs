import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const legalPages = [
  { name: "privacidad", path: "/privacidad" },
  { name: "terminos", path: "/terminos" },
  { name: "devoluciones", path: "/devoluciones" },
];

const recoveryPages = [
  { name: "recuperar", path: "/auth/recuperar" },
  { name: "resetear", path: "/auth/resetear/token-invalido" },
  { name: "login", path: "/auth/login" },
  { name: "registro", path: "/auth/registro" },
  { name: "checkout", path: "/checkout" },
];

const themes = ["light", "dark"];

test.describe("Nuevas páginas — Accesibilidad WCAG 2.1 AA", () => {
  for (const page of legalPages) {
    for (const theme of themes) {
      test(`${page.name} — ${theme} mode`, async ({ page: p }) => {
        await p.goto(`http://localhost:3000${page.path}`);
        await p.waitForLoadState("networkidle");

        if (theme === "dark") {
          await p.evaluate(() =>
            document.documentElement.setAttribute("data-theme", "dark")
          );
        } else {
          await p.evaluate(() =>
            document.documentElement.setAttribute("data-theme", "light")
          );
        }
        await p.waitForTimeout(100);

        const results = await new AxeBuilder({ page: p })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  }

  for (const page of recoveryPages) {
    for (const theme of themes) {
      test(`${page.name} — ${theme} mode`, async ({ page: p }) => {
        await p.goto(`http://localhost:3000${page.path}`);
        await p.waitForLoadState("networkidle");

        if (theme === "dark") {
          await p.evaluate(() =>
            document.documentElement.setAttribute("data-theme", "dark")
          );
        } else {
          await p.evaluate(() =>
            document.documentElement.setAttribute("data-theme", "light")
          );
        }
        await p.waitForTimeout(100);

        const results = await new AxeBuilder({ page: p })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  }

  test("todos los textos de la página legal tienen contraste válido en light", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/privacidad");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["cat.color"])
      .analyze();

    const contrastViolations = results.violations.filter(
      (v) => v.id === "color-contrast"
    );
    expect(contrastViolations).toEqual([]);
  });

  test("todos los textos de la página legal tienen contraste válido en dark", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/privacidad");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "dark")
    );
    await page.waitForTimeout(100);

    const results = await new AxeBuilder({ page })
      .withTags(["cat.color"])
      .analyze();

    const contrastViolations = results.violations.filter(
      (v) => v.id === "color-contrast"
    );
    expect(contrastViolations).toEqual([]);
  });

  test("checkbox de términos en registro es accesible", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/registro");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include("form")
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
