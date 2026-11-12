import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home hero and CTA respect light/dark theme contrast", async ({ page }) => {
  await page.goto("/");

  const startLink = page.getByRole("link", { name: "Comenzar gratis" });
  await expect(startLink).toBeVisible();
  const lightStyles = await startLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderWidth: style.borderTopWidth,
      borderColor: style.borderTopColor,
      color: style.color,
    };
  });
  expect(lightStyles.borderWidth).toBe("2px");
  expect(lightStyles.borderColor).toContain("255");
  expect(lightStyles.color).toBe("rgb(255, 255, 255)");

  const hero = page.getByText("Plataforma #1 para PYMEs")
    .locator("xpath=ancestor::section[1]");
  await expect(hero).toHaveCSS("border-bottom-width", "0px");

  const cta = page.locator("section").filter({ hasText: "¿Listo para empezar?" });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.setAttribute("data-theme", value);
    }, theme);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include('[data-testid="home-cta"]')
      .analyze();
    expect(results.violations).toEqual([]);
    await expect(cta).toBeVisible();
  }
});
