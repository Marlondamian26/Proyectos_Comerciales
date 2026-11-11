import { describe, test, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walkDir(dir: string, ext = ".tsx"): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkDir(full, ext));
    } else if (full.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

describe("Arquitectura - Buscadores", () => {
  test("TODOS los Server Components con searchParams lo await'ean", () => {
    const appFiles = walkDir("src/app");
    const violations: string[] = [];

    for (const file of appFiles) {
      if (!file.endsWith("page.tsx")) continue;
      const content = readFileSync(file, "utf-8");

      // Solo Server Components (tienen searchParams en props y son async)
      if (
        content.includes("searchParams") &&
        content.includes("export default async")
      ) {
        if (
          !content.includes("await searchParams") &&
          !content.includes("const params = await searchParams") &&
          !content.includes("(await searchParams)")
        ) {
          violations.push(file);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test("TODOS los archivos que importan useSearchParams son Client Components", () => {
    const appFiles = walkDir("src/app");
    const violations: string[] = [];

    for (const file of appFiles) {
      const content = readFileSync(file, "utf-8");

      if (!content.includes("useSearchParams")) continue;

      if (!content.includes('"use client"')) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  test("Ningún acceso a searchParams. sin await en Server Components", () => {
    const appFiles = walkDir("src/app");
    const violations: string[] = [];

    for (const file of appFiles) {
      if (!file.endsWith("page.tsx")) continue;
      const content = readFileSync(file, "utf-8");

      // Solo Server Components async con searchParams prop
      if (
        !content.includes("export default async") ||
        !content.includes("searchParams")
      ) continue;

      // Si tiene acceso directo a searchParams. sin await
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.includes("searchParams.") && !line.includes("await")) {
          violations.push(file);
          break;
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
