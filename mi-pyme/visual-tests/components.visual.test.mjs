import { test, expect } from "@playwright/test";

const components = [
  "button",
  "card",
  "modal",
  "table",
  "input",
  "badge",
  "toast",
  "navbar",
  "sidebar",
];

const themes = ["light", "dark"];

for (const component of components) {
  for (const theme of themes) {
    test(`${component} - ${theme} mode`, async ({ page }) => {
      await page.goto(`/iframe.html?id=ui-${component}--default&globals=theme:${theme}`);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${component}-${theme}.png`, {
        fullPage: true,
        animations: "disabled",
      });
    });
  }
}

test("button - all variants light", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-button--all-variants&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("button-all-variants-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("button - all variants dark", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-button--all-variants&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("button-all-variants-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("card - grid light", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-card--card-grid&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("card-grid-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("card - grid dark", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-card--card-grid&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("card-grid-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("modal - default light", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-modal--default&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await page.click("button:has-text('Abrir Modal')");
  await page.waitForSelector('[role="dialog"]');
  await expect(page).toHaveScreenshot("modal-default-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("modal - default dark", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-modal--default&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await page.click("button:has-text('Abrir Modal')");
  await page.waitForSelector('[role="dialog"]');
  await expect(page).toHaveScreenshot("modal-default-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("table - default light", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-table--default&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("table-default-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("table - default dark", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-table--default&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("table-default-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("input - all states light", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-input--all-states&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("input-all-states-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("input - all states dark", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-input--all-states&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("input-all-states-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("badge - all variants light", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-badge--all-variants&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("badge-all-variants-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("badge - all variants dark", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-badge--all-variants&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("badge-all-variants-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("toast - all variants light", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-toast--all-variants&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("toast-all-variants-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("toast - all variants dark", async ({ page }) => {
  await page.goto("/iframe.html?id=ui-toast--all-variants&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("toast-all-variants-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("navbar - admin light", async ({ page }) => {
  await page.goto("/iframe.html?id=layout-navbar--admin&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("navbar-admin-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("navbar - admin dark", async ({ page }) => {
  await page.goto("/iframe.html?id=layout-navbar--admin&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("navbar-admin-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("sidebar - admin light", async ({ page }) => {
  await page.goto("/iframe.html?id=layout-sidebar--admin&globals=theme:light");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("sidebar-admin-light.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("sidebar - admin dark", async ({ page }) => {
  await page.goto("/iframe.html?id=layout-sidebar--admin&globals=theme:dark");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("sidebar-admin-dark.png", {
    fullPage: true,
    animations: "disabled",
  });
});