import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("prisma/seed.ts (reducido)", () => {
  const seed = readFileSync(resolve(process.cwd(), "prisma/seed.ts"), "utf8");

  it("define 4 negocios representativos", () => {
    const slugs = [
      "pizzeria-bella-napoli",
      "salon-belleza-estrella",
      "ferreteria-el-tornillo",
      "tecnocell-cuba",
    ];
    for (const slug of slugs) expect(seed).toContain(`slug: "${slug}"`);
  });

  it("asigna imagenUrl de Unsplash a productos/servicios/negocios", () => {
    const matches = seed.match(/imagenUrl:\s*"https:\/\/images\.unsplash\.com\//g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(20);
  });

  it("incluye portadas de negocio", () => {
    expect(seed).toContain("imagenPortada");
    expect((seed.match(/imagenPortada:\s*"https:\/\/images\.unsplash\.com\//g) ?? []).length).toBe(4);
  });
});
