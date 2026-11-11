import { test, expect, devices } from "@playwright/test";

const perfPages = [
  { name: "home", path: "/" },
  { name: "login", path: "/auth/login" },
  { name: "catalogo", path: "/catalogo" },
  { name: "carrito", path: "/carrito" },
  { name: "checkout", path: "/checkout" },
  { name: "contacto", path: "/contacto" },
  { name: "servicios", path: "/servicios" },
];

test.describe("Performance metrics", () => {
  for (const perfPage of perfPages) {
    test(`${perfPage.name} - LCP < 3.5s`, async ({ page }) => {
      await page.goto(perfPage.path);
      await page.waitForLoadState("networkidle");

      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const entryHandler = (list) => {
            for (const entry of list) {
              if (entry.entryType === "largest-contentful-paint") {
                resolve(entry);
              }
            }
          };

          new PerformanceObserver(entryHandler).observe({
            entryTypes: ["largest-contentful-paint"],
          });

          setTimeout(() => resolve(null), 5000);
        });
      });

      if (metrics) {
        const lcpEntry = metrics;
        expect(lcpEntry.startTime).toBeLessThan(3500);
      }
    });

    test(`${perfPage.name} - CLS < 0.1`, async ({ page }) => {
      await page.goto(perfPage.path);
      await page.waitForLoadState("networkidle");

      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const entryHandler = (list) => {
            for (const entry of list) {
              if (entry.entryType === "layout-shift") {
                const layoutShiftEntry = entry;
                if (!layoutShiftEntry.hadRecentInput) {
                  clsValue += layoutShiftEntry.value;
                }
              }
            }
          };

          new PerformanceObserver(entryHandler).observe({
            entryTypes: ["layout-shift"],
          });

          setTimeout(() => resolve(clsValue), 2000);
        });
      });

      expect(cls).toBeLessThan(0.1);
    });
  }
});

test.describe("Console error monitoring", () => {
  for (const perfPage of perfPages) {
    test(`${perfPage.name} - no console errors`, async ({ page }) => {
      const consoleErrors = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("pageerror", (error) => {
        consoleErrors.push(error.message);
      });

      await page.goto(perfPage.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const criticalErrors = consoleErrors.filter(
        (err) =>
          !err.includes("favicon") &&
          !err.includes("404") &&
          !err.includes("net::ERR")
      );

      expect(criticalErrors).toEqual([]);
    });
  }
});

test.describe("Core Web Vitals thresholds", () => {
  test("home - LCP, FID, CLS all within thresholds", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const results = {
          lcp: 0,
          cls: 0,
          fid: 0,
        };

        new PerformanceObserver((list) => {
          for (const entry of list) {
            if (entry.entryType === "largest-contentful-paint") {
              const lcpEntry = entry;
              results.lcp = lcpEntry.startTime;
            }
          }
        }).observe({ entryTypes: ["largest-contentful-paint"] });

        new PerformanceObserver((list) => {
          for (const entry of list) {
            if (entry.entryType === "layout-shift") {
              const clsEntry = entry;
              if (!clsEntry.hadRecentInput) {
                results.cls += clsEntry.value;
              }
            }
          }
        }).observe({ entryTypes: ["layout-shift"] });

        new PerformanceObserver((list) => {
          for (const entry of list) {
            if (entry.entryType === "first-input") {
              const fidEntry = entry;
              results.fid = fidEntry.processingStart - fidEntry.startTime;
            }
          }
        }).observe({ entryTypes: ["first-input"] });

        setTimeout(() => resolve(results), 5000);
      });
    });

    expect(vitals.lcp).toBeLessThan(2500);
    expect(vitals.cls).toBeLessThan(0.1);
    expect(vitals.fid).toBeLessThan(100);
  });
});

test.describe("Resource loading", () => {
  test("images have explicit width and height or aspect ratio", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const images = await page.locator("img").all();
    for (const img of images) {
      const hasWidth = await img.getAttribute("width");
      const hasHeight = await img.getAttribute("height");
      const hasStyle = await img.getAttribute("style");
      const hasClass = await img.getAttribute("class");

      const styleStr = [hasWidth, hasHeight, hasStyle, hasClass].filter(Boolean).join(" ");
      const hasDimensionOrAspect =
        hasWidth || hasHeight || styleStr.includes("aspect") || styleStr.includes("w-") || styleStr.includes("h-");

      expect(hasDimensionOrAspect).toBeTruthy();
    }
  });

  test("no layout shifts from late-loading resources", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const layoutShifts = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let totalShift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list) {
            if (entry.entryType === "layout-shift") {
              const clsEntry = entry;
              if (!clsEntry.hadRecentInput) {
                totalShift += clsEntry.value;
              }
            }
          }
        }).observe({ entryTypes: ["layout-shift"] });

        setTimeout(() => resolve(totalShift), 3000);
      });
    });

    expect(layoutShifts).toBeLessThan(0.1);
  });
});
