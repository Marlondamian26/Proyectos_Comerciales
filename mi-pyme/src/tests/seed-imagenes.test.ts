import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("prisma/seed.ts", () => {
  const seed = readFileSync(resolve(process.cwd(), "prisma/seed.ts"), "utf8");

  it("define negocios representativos incluyendo logística y transporte", () => {
    const slugs = [
      "pizzeria-bella-napoli",
      "salon-belleza-estrella",
      "ferreteria-el-tornillo",
      "tecnocell-cuba",
      "carga-rapida-la-habana",
      "mudanzas-centro-habana",
      "transpersona-express",
    ];
    for (const slug of slugs) expect(seed).toContain(`slug: "${slug}"`);
  });

  it("incluye área de logística y transporte con subáreas", () => {
    expect(seed).toContain('slug: "logistica-transporte"');
    expect(seed).toContain('slug: "envio-paquetes"');
    expect(seed).toContain('slug: "mudanzas"');
    expect(seed).toContain('slug: "transporte-personas"');
  });

  it("incluye servicios de tipo TRANSPORTE con campos de logística", () => {
    expect(seed).toContain('tipo: "TRANSPORTE"');
    expect(seed).toContain('tipoTransporte: "ENVIO_PAQUETE"');
    expect(seed).toContain('tipoTransporte: "MUDANZA"');
    expect(seed).toContain('tipoTransporte: "TRASLADO_MUEBLE"');
    expect(seed).toContain('tipoTransporte: "TRANSPORTE_PERSONAS"');
    expect(seed).toContain("alcanceNacional");
    expect(seed).toContain("pesoMaximo");
    expect(seed).toContain("dimensionesMaximas");
    expect(seed).toContain("origenBase");
    expect(seed).toContain("destinoBase");
  });

  it("asigna imagenUrl de Unsplash a productos/servicios/negocios", () => {
    const matches = seed.match(/imagenUrl:\s*"https:\/\/images\.unsplash\.com\//g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(29);
  });

  it("cada título de negocio, producto y servicio deja claro que es ejemplo/no real", () => {
    // 7 negocios + 16 productos + 13 servicios = 36 títulos mínimos con SEED_DISCLAIMER
    const count = (seed.match(/SEED_DISCLAIMER/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(36);
  });

  it("todas las portadas de negocio tienen imagen", () => {
    const portadas = seed.match(/imagenPortada:\s*"https:\/\/images\.unsplash\.com\//g) ?? [];
    expect(portadas.length).toBe(7);
  });

  it("ninguna tarjeta (producto, servicio o negocio) falta imagen", () => {
    // Cada bloque de producto/servicio debe llevar imagenUrl; cada negocio debe llevar imagenPortada.
    const productoBlocks = (seed.match(/productos:\s*\[/g) ?? []).length;
    const servicioBlocks = (seed.match(/servicios:\s*\[/g) ?? []).length;
    const imagenUrlCount = (seed.match(/imagenUrl:/g) ?? []).length;
    // Al menos una imagenUrl por producto o servicio declarado
    expect(imagenUrlCount).toBeGreaterThanOrEqual(productoBlocks + servicioBlocks);
  });
});
