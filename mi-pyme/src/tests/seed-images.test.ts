import { describe, test, expect } from "vitest";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

describe("Seed - Verificación de archivos de imágenes", () => {
  const seedImagesPath = resolve(__dirname, "../../prisma/seed-images.ts");
  const seedPath = resolve(__dirname, "../../prisma/seed.ts");

  test("seed-images.ts existe y exporta IMAGENES", () => {
    expect(existsSync(seedImagesPath)).toBe(true);
    const content = readFileSync(seedImagesPath, "utf-8");
    expect(content).toContain("export const IMAGENES");
    expect(content).toContain("export function getImagen");
    expect(content).toContain("export function getImagenDe");
  });

  test("seed-images.ts contiene categorías de imágenes", () => {
    const content = readFileSync(seedImagesPath, "utf-8");
    // Verificar que tiene categorías principales
    expect(content).toContain("aseo");
    expect(content).toContain("alimentos");
    expect(content).toContain("saludBelleza");
    expect(content).toContain("comida");
    expect(content).toContain("servicios");
    expect(content).toContain("tecnologia");
    expect(content).toContain("textil");
    expect(content).toContain("transporte");
    expect(content).toContain("portadas");
    expect(content).toContain("combos");
    expect(content).toContain("heroFondos");
  });

  test("seed.ts referencia imagenUrl en entidades", () => {
    const content = readFileSync(seedPath, "utf-8");
    const imagenUrlCount = (content.match(/imagenUrl:/g) || []).length;
    expect(imagenUrlCount).toBeGreaterThan(20);
  });

  test("next.config.ts permite imágenes de Unsplash y Pexels", () => {
    const nextConfigPath = resolve(__dirname, "../../next.config.ts");
    expect(existsSync(nextConfigPath)).toBe(true);
    const content = readFileSync(nextConfigPath, "utf-8");
    expect(content).toContain("images.unsplash.com");
    expect(content).toContain("images.pexels.com");
  });
});
