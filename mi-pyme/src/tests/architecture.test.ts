/**
 * Tests de arquitectura — Fase 2, Punto 8.
 *
 * Estos tests blindan el principio framework-agnostic que es la base de la
 * futura migración a Nest.js (Fase 4). Si alguien introduce un import de
 * Next.js o @nestjs dentro de src/services/, el test falla.
 *
 * Estado actual (auditoría Fase 2, Punto 8):
 * - src/services/ NO importa Next.js → verificado.
 * - nest-compat.ts NO existe (nunca fue creado) → Estrategia B.
 * - ServiceRegistry.ts NO existe → Estrategia B.
 * - InMemoryEventBus existe pero no se usa activamente → preparado para Fase 4.
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const SERVICES_DIR = join(__dirname, "../services");

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Arquitectura: framework-agnostic", () => {
  const files = collectTsFiles(SERVICES_DIR);

  it("la carpeta src/services/ no debería estar vacía", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("los servicios NO deben importar de Next.js", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const relPath = file.replace(process.cwd() + "/", "");

      // Match: import ... from "next..." or import ... from 'next...'
      const importLines = content.split("\n");
      for (const line of importLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("//")) continue;
        if (/from\s+["']next[\/"]/.test(trimmed) || /from\s+["']next\.js/.test(trimmed)) {
          offenders.push(`${relPath}: ${trimmed}`);
        }
      }
    }

    expect(offenders, `Servicios que importan Next.js:\n${offenders.join("\n")}`).toHaveLength(0);
  });

  it("los servicios NO deben importar @nestjs/*", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const relPath = file.replace(process.cwd() + "/", "");

      if (/@nestjs\/.*/.test(content)) {
        const match = content.match(/@nestjs\/[^\s'"]+/);
        if (match) {
          offenders.push(`${relPath}: ${match[0]}`);
        }
      }
    }

    expect(offenders, `Servicios que importan @nestjs:\n${offenders.join("\n")}`).toHaveLength(0);
  });

  it("los servicios deben ser archivos .ts válidos (smoke test)", () => {
    // Smoke test: the services directory should contain .ts files
    // and the collection logic works without errors
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      // Every service file should be non-empty
      expect(content.length).toBeGreaterThan(0);
    }
  });
});