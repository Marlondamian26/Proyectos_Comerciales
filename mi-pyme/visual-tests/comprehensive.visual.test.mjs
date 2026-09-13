import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/auth/login", name: "login" },
  { path: "/auth/registro", name: "register" },
  { path: "/catalogo", name: "catalogo" },
  { path: "/carrito", name: "carrito" },
  { path: "/reservas", name: "reservas" },
  { path: "/pedidos", name: "pedidos" },
  { path: "/negocio", name: "negocio" },
  { path: "/cliente", name: "cliente" },
  { path: "/logistica", name: "logistica" },
  { path: "/admin", name: "admin" },
  { path: "/contacto", name: "contacto" },
  { path: "/servicios", name: "servicios" },
];

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const MODES = ["light", "dark"];

const SNAPSHOT_DIR = path.join(__dirname, "snapshots");
const DIFF_DIR = path.join(__dirname, "diffs");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function compareScreenshots(baselinePath, currentPath, diffPath) {
  const baselineBuffer = await fs.readFile(baselinePath);
  const currentBuffer = await fs.readFile(currentPath);

  const baselinePng = PNG.sync.read(baselineBuffer);
  const currentPng = PNG.sync.read(currentBuffer);

  const { width, height } = baselinePng;
  const diffPng = new PNG({ width, height });

  const diffPixels = pixelmatch(
    baselinePng.data,
    currentPng.data,
    diffPng.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const totalPixels = width * height;
  const diffRatio = diffPixels / totalPixels;

  await fs.writeFile(diffPath, PNG.sync.write(diffPng));

  return {
    diffPixels,
    diffRatio,
    passed: diffRatio <= 0.001,
  };
}

async function takePageScreenshot(page, routeName, mode, viewportName, type = "fullpage") {
  const filename = `${routeName}_${mode}_${viewportName}_${type}.png`;
  const filepath = path.join(SNAPSHOT_DIR, filename);

  if (type === "fullpage") {
    await page.screenshot({ path: filepath, fullPage: true, animations: "disabled" });
  } else if (type === "viewport") {
    await page.screenshot({ path: filepath, fullPage: false, animations: "disabled" });
  }

  return filepath;
}

for (const mode of MODES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`${mode} mode - ${viewport.name} viewport`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.addInitScript(
          mode === "dark"
            ? "document.documentElement.setAttribute('data-theme', 'dark')"
            : "document.documentElement.setAttribute('data-theme', 'light')"
        );
      });

      for (const route of ROUTES) {
        test(`${route.name} - visual & a11y`, async ({ page }) => {
          await ensureDir(SNAPSHOT_DIR);
          await ensureDir(DIFF_DIR);

          await page.goto(route.path, { waitUntil: "networkidle" });
          await page.waitForTimeout(500);

          const fullpagePath = await takePageScreenshot(
            page,
            route.name,
            mode,
            viewport.name,
            "fullpage"
          );

          const viewportPath = await takePageScreenshot(
            page,
            route.name,
            mode,
            viewport.name,
            "viewport"
          );

          const baselineFullpage = path.join(SNAPSHOT_DIR, `baseline_${path.basename(fullpagePath)}`);
          const baselineViewport = path.join(SNAPSHOT_DIR, `baseline_${path.basename(viewportPath)}`);

          try {
            await fs.access(baselineFullpage);
            const fullpageDiff = path.join(DIFF_DIR, `diff_${path.basename(fullpagePath)}`);
            const result = await compareScreenshots(baselineFullpage, fullpagePath, fullpageDiff);
            expect(result.passed).toBeTruthy();
            test.info().attach("visual-diff-fullpage", {
              contentType: "application/json",
              body: JSON.stringify(result, null, 2),
            });
          } catch {
            await fs.copyFile(fullpagePath, baselineFullpage);
          }

          try {
            await fs.access(baselineViewport);
            const viewportDiff = path.join(DIFF_DIR, `diff_${path.basename(viewportPath)}`);
            const result = await compareScreenshots(baselineViewport, viewportPath, viewportDiff);
            expect(result.passed).toBeTruthy();
            test.info().attach("visual-diff-viewport", {
              contentType: "application/json",
              body: JSON.stringify(result, null, 2),
            });
          } catch {
            await fs.copyFile(viewportPath, baselineViewport);
          }

          const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze();

          const criticalViolations = accessibilityScanResults.violations.filter(
            (v) => v.impact === "critical" || v.impact === "serious"
          );

          test.info().attach("a11y-results", {
            contentType: "application/json",
            body: JSON.stringify({
              route: route.name,
              mode,
              viewport: viewport.name,
              violations: accessibilityScanResults.violations.length,
              criticalViolations: criticalViolations.length,
              details: criticalViolations,
            }, null, 2),
          });

          expect(criticalViolations.length).toBe(0);
        });
      }
    });
  }
}

test.describe("Component visual regression", () => {
  const COMPONENTS = [
    { id: "ui-button--default", name: "button", variants: ["primary", "secondary", "accent", "outline", "ghost", "destructive", "gradient"] },
    { id: "ui-card--default", name: "card", variants: ["default", "elevated", "outlined", "ghost"] },
    { id: "ui-modal--default", name: "modal", variants: ["default"] },
    { id: "ui-table--default", name: "table", variants: ["default"] },
    { id: "ui-input--all-states", name: "input", variants: ["default", "error", "disabled"] },
    { id: "ui-badge--all-variants", name: "badge", variants: ["default", "success", "warning", "error", "info"] },
    { id: "ui-toast--all-variants", name: "toast", variants: ["default", "success", "warning", "error", "info"] },
    { id: "layout-navbar--admin", name: "navbar", variants: ["admin"] },
    { id: "layout-sidebar--admin", name: "sidebar", variants: ["admin"] },
  ];

  for (const mode of MODES) {
    test.describe(`${mode} mode`, () => {
      test.beforeEach(async ({ page }) => {
        await page.addInitScript(
          mode === "dark"
            ? "document.documentElement.setAttribute('data-theme', 'dark')"
            : "document.documentElement.setAttribute('data-theme', 'light')"
        );
      });

      for (const component of COMPONENTS) {
        for (const variant of component.variants) {
          test(`${component.name} - ${variant}`, async ({ page }) => {
            await ensureDir(SNAPSHOT_DIR);
            await ensureDir(DIFF_DIR);

            const storyId = variant === "default" ? component.id : `${component.id.replace("--default", `--${variant}`)}`;
            await page.goto(`/iframe.html?id=${storyId}&globals=theme:${mode}`, { waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            if (component.name === "modal") {
              await page.click("button:has-text('Abrir Modal')");
              await page.waitForSelector('[role="dialog"]');
            }

            const screenshotPath = await takePageScreenshot(
              page,
              `${component.name}-${variant}`,
              mode,
              "component",
              "viewport"
            );

            const baselinePath = path.join(SNAPSHOT_DIR, `baseline_${path.basename(screenshotPath)}`);
            const diffPath = path.join(DIFF_DIR, `diff_${path.basename(screenshotPath)}`);

            try {
              await fs.access(baselinePath);
              const result = await compareScreenshots(baselinePath, screenshotPath, diffPath);
              expect(result.passed).toBeTruthy();
            } catch {
              await fs.copyFile(screenshotPath, baselinePath);
            }

            const accessibilityScanResults = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
              .analyze();

            const criticalViolations = accessibilityScanResults.violations.filter(
              (v) => v.impact === "critical" || v.impact === "serious"
            );

            expect(criticalViolations.length).toBe(0);
          });
        }
      }
    });
  }
});

test.describe("Interactive states visual regression", () => {
  const INTERACTIONS = [
    {
      name: "catalogo-with-filters",
      path: "/catalogo",
      actions: async (page) => {
        await page.click('button:has-text("Mostrar filtros")');
        await page.waitForTimeout(300);
      },
    },
    {
      name: "catalogo-paginated",
      path: "/catalogo?page=2",
      actions: async (page) => {
        await page.waitForTimeout(300);
      },
    },
  ];

  for (const mode of MODES) {
    for (const viewport of VIEWPORTS) {
      test.describe(`${mode} - ${viewport.name}`, () => {
        test.beforeEach(async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.addInitScript(
            mode === "dark"
              ? "document.documentElement.setAttribute('data-theme', 'dark')"
              : "document.documentElement.setAttribute('data-theme', 'light')"
          );
        });

        for (const interaction of INTERACTIONS) {
          test(`${interaction.name}`, async ({ page }) => {
            await ensureDir(SNAPSHOT_DIR);
            await ensureDir(DIFF_DIR);

            await page.goto(interaction.path, { waitUntil: "networkidle" });
            await page.waitForTimeout(500);

            if (interaction.actions) {
              await interaction.actions(page);
            }

            const screenshotPath = await takePageScreenshot(
              page,
              interaction.name,
              mode,
              viewport.name,
              "fullpage"
            );

            const baselinePath = path.join(SNAPSHOT_DIR, `baseline_${path.basename(screenshotPath)}`);
            const diffPath = path.join(DIFF_DIR, `diff_${path.basename(screenshotPath)}`);

            try {
              await fs.access(baselinePath);
              const result = await compareScreenshots(baselinePath, screenshotPath, diffPath);
              expect(result.passed).toBeTruthy();
            } catch {
              await fs.copyFile(screenshotPath, baselinePath);
            }
          });
        }
      });
    }
  }
});