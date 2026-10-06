# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.mjs >> Console error monitoring >> servicios - no console errors
- Location: visual-tests/performance.test.mjs:76:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 31

- Array []
+ Array [
+   "%o
+
+ %s Error: Event handlers cannot be passed to Client Component props.
+   <... href=... aria-label=... onClick={function onClick} children=...>
+                                        ^^^^^^^^^^^^^^^^^^
+ If you need interactivity, consider converting part of this to a Client Component.
+     at resolveErrorDev (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:1937:105)
+     at processFullStringRow (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2456:29)
+     at processFullBinaryRow (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2415:9)
+     at processBinaryChunk (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2524:221)
+     at progress (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2711:13) The above error occurred in the <Slot> component. It was handled by the <ErrorBoundaryHandler> error boundary.",
+   "Application error: Error: Event handlers cannot be passed to Client Component props.
+   <... href=... aria-label=... onClick={function onClick} children=...>
+                                        ^^^^^^^^^^^^^^^^^^
+ If you need interactivity, consider converting part of this to a Client Component.
+     at resolveErrorDev (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:1937:105)
+     at processFullStringRow (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2456:29)
+     at processFullBinaryRow (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2415:9)
+     at processBinaryChunk (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2524:221)
+     at progress (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2711:13)",
+   "Application error: Error: Event handlers cannot be passed to Client Component props.
+   <... href=... aria-label=... onClick={function onClick} children=...>
+                                        ^^^^^^^^^^^^^^^^^^
+ If you need interactivity, consider converting part of this to a Client Component.
+     at resolveErrorDev (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:1937:105)
+     at processFullStringRow (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2456:29)
+     at processFullBinaryRow (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2415:9)
+     at processBinaryChunk (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2524:221)
+     at progress (http://localhost:3000/_next/static/chunks/1jni_next_dist_compiled_react-server-dom-turbopack_1ss1ay5._.js:2711:13)",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]
    - generic [ref=e11]:
      - button "Open issues overlay" [ref=e12]:
        - generic [ref=e13]:
          - generic [aria-hidden] [ref=e14]: "0"
          - generic [ref=e15]: "1"
        - generic [ref=e16]: Issue
      - button "Collapse issues badge" [ref=e17]
  - alert [ref=e20]
  - main [ref=e21]:
    - generic [ref=e23]:
      - button "Cambiar a modo oscuro" [ref=e24]:
        - generic [ref=e27]: Sistema
      - generic [ref=e28]: Modo claro activado
      - button "Opciones de tema" [ref=e29]
    - generic [ref=e32]:
      - generic [ref=e36]:
        - heading "Algo salió mal" [level=1] [ref=e37]
        - paragraph [ref=e38]: Ocurrió un error inesperado. Por favor, inténtalo de nuevo.
      - generic [ref=e39]:
        - button "Reintentar" [ref=e40]
        - button "Volver al inicio" [ref=e46]
```

# Test source

```ts
  1   | import { test, expect, devices } from "@playwright/test";
  2   | 
  3   | const perfPages = [
  4   |   { name: "home", path: "/" },
  5   |   { name: "login", path: "/auth/login" },
  6   |   { name: "catalogo", path: "/catalogo" },
  7   |   { name: "carrito", path: "/carrito" },
  8   |   { name: "checkout", path: "/checkout" },
  9   |   { name: "contacto", path: "/contacto" },
  10  |   { name: "servicios", path: "/servicios" },
  11  | ];
  12  | 
  13  | test.describe("Performance metrics", () => {
  14  |   for (const perfPage of perfPages) {
  15  |     test(`${perfPage.name} - LCP < 3.5s`, async ({ page }) => {
  16  |       await page.goto(perfPage.path);
  17  |       await page.waitForLoadState("networkidle");
  18  | 
  19  |       const metrics = await page.evaluate(() => {
  20  |         return new Promise((resolve) => {
  21  |           const entryHandler = (list) => {
  22  |             for (const entry of list) {
  23  |               if (entry.entryType === "largest-contentful-paint") {
  24  |                 resolve(entry);
  25  |               }
  26  |             }
  27  |           };
  28  | 
  29  |           new PerformanceObserver(entryHandler).observe({
  30  |             entryTypes: ["largest-contentful-paint"],
  31  |           });
  32  | 
  33  |           setTimeout(() => resolve(null), 5000);
  34  |         });
  35  |       });
  36  | 
  37  |       if (metrics) {
  38  |         const lcpEntry = metrics;
  39  |         expect(lcpEntry.startTime).toBeLessThan(3500);
  40  |       }
  41  |     });
  42  | 
  43  |     test(`${perfPage.name} - CLS < 0.1`, async ({ page }) => {
  44  |       await page.goto(perfPage.path);
  45  |       await page.waitForLoadState("networkidle");
  46  | 
  47  |       const cls = await page.evaluate(() => {
  48  |         return new Promise<number>((resolve) => {
  49  |           let clsValue = 0;
  50  |           const entryHandler = (list) => {
  51  |             for (const entry of list) {
  52  |               if (entry.entryType === "layout-shift") {
  53  |                 const layoutShiftEntry = entry;
  54  |                 if (!layoutShiftEntry.hadRecentInput) {
  55  |                   clsValue += layoutShiftEntry.value;
  56  |                 }
  57  |               }
  58  |             }
  59  |           };
  60  | 
  61  |           new PerformanceObserver(entryHandler).observe({
  62  |             entryTypes: ["layout-shift"],
  63  |           });
  64  | 
  65  |           setTimeout(() => resolve(clsValue), 2000);
  66  |         });
  67  |       });
  68  | 
  69  |       expect(cls).toBeLessThan(0.1);
  70  |     });
  71  |   }
  72  | });
  73  | 
  74  | test.describe("Console error monitoring", () => {
  75  |   for (const perfPage of perfPages) {
  76  |     test(`${perfPage.name} - no console errors`, async ({ page }) => {
  77  |       const consoleErrors = [];
  78  | 
  79  |       page.on("console", (msg) => {
  80  |         if (msg.type() === "error") {
  81  |           consoleErrors.push(msg.text());
  82  |         }
  83  |       });
  84  | 
  85  |       page.on("pageerror", (error) => {
  86  |         consoleErrors.push(error.message);
  87  |       });
  88  | 
  89  |       await page.goto(perfPage.path);
  90  |       await page.waitForLoadState("networkidle");
  91  |       await page.waitForTimeout(1000);
  92  | 
  93  |       const criticalErrors = consoleErrors.filter(
  94  |         (err) =>
  95  |           !err.includes("favicon") &&
  96  |           !err.includes("404") &&
  97  |           !err.includes("net::ERR")
  98  |       );
  99  | 
> 100 |       expect(criticalErrors).toEqual([]);
      |                              ^ Error: expect(received).toEqual(expected) // deep equality
  101 |     });
  102 |   }
  103 | });
  104 | 
  105 | test.describe("Core Web Vitals thresholds", () => {
  106 |   test("home - LCP, FID, CLS all within thresholds", async ({ page }) => {
  107 |     await page.goto("/");
  108 |     await page.waitForLoadState("networkidle");
  109 | 
  110 |     const vitals = await page.evaluate(() => {
  111 |       return new Promise((resolve) => {
  112 |         const results = {
  113 |           lcp: 0,
  114 |           cls: 0,
  115 |           fid: 0,
  116 |         };
  117 | 
  118 |         new PerformanceObserver((list) => {
  119 |           for (const entry of list) {
  120 |             if (entry.entryType === "largest-contentful-paint") {
  121 |               const lcpEntry = entry;
  122 |               results.lcp = lcpEntry.startTime;
  123 |             }
  124 |           }
  125 |         }).observe({ entryTypes: ["largest-contentful-paint"] });
  126 | 
  127 |         new PerformanceObserver((list) => {
  128 |           for (const entry of list) {
  129 |             if (entry.entryType === "layout-shift") {
  130 |               const clsEntry = entry;
  131 |               if (!clsEntry.hadRecentInput) {
  132 |                 results.cls += clsEntry.value;
  133 |               }
  134 |             }
  135 |           }
  136 |         }).observe({ entryTypes: ["layout-shift"] });
  137 | 
  138 |         new PerformanceObserver((list) => {
  139 |           for (const entry of list) {
  140 |             if (entry.entryType === "first-input") {
  141 |               const fidEntry = entry;
  142 |               results.fid = fidEntry.processingStart - fidEntry.startTime;
  143 |             }
  144 |           }
  145 |         }).observe({ entryTypes: ["first-input"] });
  146 | 
  147 |         setTimeout(() => resolve(results), 5000);
  148 |       });
  149 |     });
  150 | 
  151 |     expect(vitals.lcp).toBeLessThan(2500);
  152 |     expect(vitals.cls).toBeLessThan(0.1);
  153 |     expect(vitals.fid).toBeLessThan(100);
  154 |   });
  155 | });
  156 | 
  157 | test.describe("Resource loading", () => {
  158 |   test("images have explicit width and height or aspect ratio", async ({ page }) => {
  159 |     await page.goto("/");
  160 |     await page.waitForLoadState("networkidle");
  161 | 
  162 |     const images = await page.locator("img").all();
  163 |     for (const img of images) {
  164 |       const hasWidth = await img.getAttribute("width");
  165 |       const hasHeight = await img.getAttribute("height");
  166 |       const hasStyle = await img.getAttribute("style");
  167 |       const hasClass = await img.getAttribute("class");
  168 | 
  169 |       const styleStr = [hasWidth, hasHeight, hasStyle, hasClass].filter(Boolean).join(" ");
  170 |       const hasDimensionOrAspect =
  171 |         hasWidth || hasHeight || styleStr.includes("aspect") || styleStr.includes("w-") || styleStr.includes("h-");
  172 | 
  173 |       expect(hasDimensionOrAspect).toBeTruthy();
  174 |     }
  175 |   });
  176 | 
  177 |   test("no layout shifts from late-loading resources", async ({ page }) => {
  178 |     await page.goto("/");
  179 |     await page.waitForLoadState("networkidle");
  180 | 
  181 |     const layoutShifts = await page.evaluate(() => {
  182 |       return new Promise<number>((resolve) => {
  183 |         let totalShift = 0;
  184 |         new PerformanceObserver((list) => {
  185 |           for (const entry of list) {
  186 |             if (entry.entryType === "layout-shift") {
  187 |               const clsEntry = entry;
  188 |               if (!clsEntry.hadRecentInput) {
  189 |                 totalShift += clsEntry.value;
  190 |               }
  191 |             }
  192 |           }
  193 |         }).observe({ entryTypes: ["layout-shift"] });
  194 | 
  195 |         setTimeout(() => resolve(totalShift), 3000);
  196 |       });
  197 |     });
  198 | 
  199 |     expect(layoutShifts).toBeLessThan(0.1);
  200 |   });
```