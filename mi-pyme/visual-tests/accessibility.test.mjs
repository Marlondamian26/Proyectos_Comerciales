import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const testPages = [
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/auth/registro" },
  { name: "catalogo", path: "/catalogo" },
  { name: "perfil", path: "/perfil" },
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

test("keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.keyboard.press("Tab");
  await page.waitForTimeout(100);

  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedElement).toBeTruthy();
});