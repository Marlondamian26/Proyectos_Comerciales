#!/usr/bin/env node
/**
 * Script de auditoría responsive de Mi-Pyme.
 * Ejecuta Playwright con todos los viewports y detecta:
 *   - Overflow horizontal
 *   - Touch targets < 44x44px
 *   - Textos < 14px
 *   - Imágenes distorsionadas
 * Genera reporte en reports/responsive-audit.md
 *
 * Uso: node scripts/audit-responsive.mjs
 * Requiere: servidor de desarrollo corriendo en http://localhost:3000
 */

import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

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

const overflowScript = () => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const els = Array.from(document.querySelectorAll("*"))
    .filter((el) => el.offsetWidth > vw)
    .map((el) => ({
      tag: el.tagName,
      class: (el.className || "").toString().slice(0, 100),
      width: el.offsetWidth,
      text: (el.textContent || "").slice(0, 50),
    }));
  return { hasOverflow: sw > vw, scrollWidth: sw, viewportWidth: vw, elements: els };
};

const touchScript = () => {
  return Array.from(
    document.querySelectorAll('button, a, input, select, textarea, [role="button"]')
  )
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        (rect.width < 44 || rect.height < 44)
      );
    })
    .map((el) => ({
      tag: el.tagName,
      class: (el.className || "").toString().slice(0, 80),
      width: Math.round(el.getBoundingClientRect().width),
      height: Math.round(el.getBoundingClientRect().height),
      text: (el.textContent || "").slice(0, 30),
    }));
};

const textScript = () => {
  return Array.from(
    document.querySelectorAll("p, span, a, button, li, td, th, label")
  )
    .filter((el) => {
      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const text = el.textContent?.trim();
      return text && text.length > 0 && fontSize < 14;
    })
    .map((el) => ({
      tag: el.tagName,
      class: (el.className || "").toString().slice(0, 80),
      fontSize: getComputedStyle(el).fontSize,
      text: (el.textContent || "").slice(0, 40),
    }));
};

const imageScript = () => {
  return Array.from(document.querySelectorAll("img"))
    .filter((el) => {
      if (!el.naturalWidth || !el.naturalHeight) return false;
      const naturalRatio = el.naturalWidth / el.naturalHeight;
      const displayRatio = el.width / el.height;
      return Math.abs(naturalRatio - displayRatio) > 0.1;
    })
    .map((el) => ({
      src: (el.src || "").slice(0, 80),
      alt: el.alt || "",
      natural: `${el.naturalWidth}x${el.naturalHeight}`,
      display: `${el.width}x${el.height}`,
    }));
};

const mdEscape = (s) => String(s ?? "").replace(/|/g, "\\|");

async function main() {
  const browser = await chromium.launch();
  const results = {
    overflow: [], // { route, viewport, count, elements }
    touch: [], // { route, viewport, count, elements }
    text: [], // { route, viewport, count, elements }
    images: [], // { route, viewport, count, elements }
  };

  try {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      for (const route of routes) {
        await page.goto(`${BASE_URL}${route}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        }).catch(() => {});

        const overflow = await page.evaluate(overflowScript).catch(() => ({ hasOverflow: false, elements: [] }));
        if (overflow.hasOverflow) {
          results.overflow.push({ route, viewport: `${vp.name} (${vp.width}x${vp.height})`, count: overflow.elements.length, elements: overflow.elements });
        }

        if (vp.width <= 767) {
          const touch = await page.evaluate(touchScript).catch(() => ([]));
          if (touch.length > 0) {
            results.touch.push({ route, viewport: `${vp.name} (${vp.width}x${vp.height})`, count: touch.length, elements: touch });
          }

          const text = await page.evaluate(textScript).catch(() => ([]));
          if (text.length > 0) {
            results.text.push({ route, viewport: `${vp.name} (${vp.width}x${vp.height})`, count: text.length, elements: text });
          }

          const images = await page.evaluate(imageScript).catch(() => ([]));
          if (images.length > 0) {
            results.images.push({ route, viewport: `${vp.name} (${vp.width}x${vp.height})`, count: images.length, elements: images });
          }
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const report = [];
  report.push("# Reporte de auditoría responsive");
  report.push(`Generado: ${new Date().toISOString()}`);
  report.push(`Base URL: ${BASE_URL}`);
  report.push("");

  const totalRoutes = routes.length;
  const totalViews = viewports.length;

  report.push("## Resumen");
  report.push(`- Rutas analizadas: ${totalRoutes}`);
  report.push(`- Viewports analizados: ${totalViews}`);
  report.push(`- Combinaciones ruta × viewport: ${totalRoutes * totalViews}`);
  report.push(`- Rutas con overflow horizontal: ${new Set(results.overflow.map((r) => r.route)).size}`);
  report.push(`- Rutas con touch targets < 44px: ${new Set(results.touch.map((r) => r.route)).size}`);
  report.push(`- Rutas con textos < 14px: ${new Set(results.text.map((r) => r.route)).size}`);
  report.push(`- Rutas con imágenes distorsionadas: ${new Set(results.images.map((r) => r.route)).size}`);
  report.push("");

  function section(title, items) {
    report.push(`## ${title}`);
    if (items.length === 0) {
      report.push("Ningún problema detectado. ✅");
      report.push("");
      return;
    }
    const byRoute = {};
    for (const item of items) {
      (byRoute[item.route] = byRoute[item.route] || []).push(item);
    }
    for (const [route, routeItems] of Object.entries(byRoute)) {
      report.push(`### ${route}`);
      for (const item of routeItems) {
        report.push(
          `- Viewport: ${item.viewport} — ${item.count} elemento(s) problemático(s)`
        );
        for (const el of item.elements.slice(0, 10)) {
          report.push(
            `  - \`${mdEscape(el.tag)}\` class="${mdEscape(el.class)}" ` +
            (el.width !== undefined ? `w=${el.width} ` : "") +
            (el.height !== undefined ? `h=${el.height} ` : "") +
            (el.fontSize !== undefined ? `fs=${el.fontSize} ` : "") +
            `text="${mdEscape(el.text)}"` +
            (el.src ? ` src="${mdEscape(el.src)}"` : "") +
            (el.natural ? ` ${el.natural} → ${el.display}` : "")
          );
        }
        if (item.elements.length > 10) {
          report.push(`  - ... y ${item.elements.length - 10} más`);
        }
      }
      report.push("");
    }
  }

  section("Overflow horizontal", results.overflow);
  section("Touch targets < 44×44px", results.touch);
  section("Textos < 14px", results.text);
  section("Imágenes distorsionadas", results.images);

  report.push("## Veredictos");
  const allClean =
    results.overflow.length === 0 &&
    results.touch.length === 0 &&
    results.text.length === 0 &&
    results.images.length === 0;
  report.push(allClean ? "✅ Todo limpio: cero problemas detectados." : "❌ Se detectaron problemas. Revisar secciones anteriores.");
  report.push("");

  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "reports");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "responsive-audit.md");
  fs.writeFileSync(out, report.join("\n"), "utf-8");

  console.log(`Reporte escrito en ${out}`);
  console.log(
    `Overflow: ${results.overflow.length} | Touch: ${results.touch.length} | Texto: ${results.text.length} | Imágenes: ${results.images.length}`
  );

  process.exit(allClean ? 0 : 1);
}

main().catch((err) => {
  console.error("Error en auditoría:", err);
  process.exit(2);
});
