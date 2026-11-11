/**
 * Tests de arquitectura: autenticación y seguridad — Etapa 5.
 *
 * Verifican por análisis estático del código fuente que las reglas de auth
 * no se hayan revertido. Complementan los tests funcionales (truth runtime),
 * no los sustituyen. Si un test falla, es una regresión real: alguien rompió
 * una regla. La regla es la fuente de verdad, no el test.
 *
 * Refinamientos notables:
 * - Test 6 (console.log): se saltan archivos de test (que contienen nombres
 *   descriptivos que mencionan "token"/"password") y se eliminan literales de
 *   cadena (single/double quote) antes de buscar palabras sensibles, para no
 *   flaggear labels descriptivos como "Error changing password:". Los template
 *   literals (backticks) NO se eliminan — fugas via ${token} siguen detectidas.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function readFile(path: string): string {
  return readFileSync(path, "utf-8");
}

function stripQuotedStrings(line: string): string {
  return line.replace(/(['"])(?:(?:\\.|[^'\\])*)\1/g, "");
}

describe("Arquitectura: autenticación y seguridad", () => {
  /**
   * Test 1: El registro público solo permite CLIENTE.
   *
   * PROHIBIDO permitir selección de rol distinto de CLIENTE en el registro.
   * Si alguien añade `rol: "NEGOCIO"` al body aceptado, este test falla.
   */
  it("el registro solo permite CLIENTE", () => {
    const content = readFile("src/app/api/auth/registro/route.ts");
    expect(content).not.toMatch(
      /rol\s*[:=]\s*["'](NEGOCIO|ADMIN|LOGISTICA)["']/
    );
    expect(content).toMatch(/CLIENTE/);
  });

  /**
   * Test 2: El formulario de registro no muestra selector de rol.
   *
   * PROHIBIDO que el UI de registro tenga un <select> para elegir rol.
   */
  it("el formulario de registro no tiene selector de rol", () => {
    const content = readFile("src/app/auth/registro/page.tsx");
    expect(content).not.toMatch(/<select[^>]*name=["']rol["']/i);
  });

  /**
   * Test 3: Todo endpoint /api/admin/* valida rol ADMIN.
   *
   * PROHIBIDO implementar endpoints /api/admin sin requireRole o check de ADMIN.
   */
  it("todo endpoint /api/admin valida rol ADMIN", () => {
    const adminDir = "src/app/api/admin";
    const routes = walkDir(adminDir).filter((f) => f.endsWith("route.ts"));
    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      const content = readFile(route);
      expect(content).toMatch(/requireRole|ADMIN/);
    }
  });

  /**
   * Test 4: Las mutaciones de servicios validan pertenencia.
   *
   * PROHIBIDO omitir validación de propiedad en mutaciones.
   * Si un servicio tiene métodos async crear/actualizar/eliminar/toggle,
   * debe usar assertPertenencia o assertPropietario.
   */
  it("las mutaciones de servicios validan pertenencia", () => {
    const services = [
      "src/services/NegocioService.ts",
      "src/services/CatalogService.ts",
      "src/services/PagoService.ts",
    ];
    for (const service of services) {
      const content = readFile(service);
      if (/async\s+(crear|actualizar|eliminar|toggle)/.test(content)) {
        expect(content).toMatch(/assertPertenencia|assertPropietario/);
      }
    }
  });

  /**
   * Test 5: Los tokens de reset se hashean antes de guardar.
   *
   * PROHIBIDO guardar tokens de reset en texto plano. Siempre hashear (SHA-256).
   */
  it("los tokens de reset se hashean antes de guardar", () => {
    const content = readFile("src/app/api/auth/recuperar/route.ts");
    expect(content).toMatch(/hashToken/);
    expect(content).not.toMatch(
      /prisma\.verificationToken\.create\s*\(\s*\{\s*data\s*:\s*\{\s*token\s*:\s*token\b/
    );
  });

  /**
   * Test 6: No hay console.log/error/warn que filtren tokens, passwords o secrets.
   *
   * PROHIBIDO loggear credenciales. Se saltan archivos de test (que contienen
   * nombres descriptivos con estas palabras) y se eliminan literales de cadena
   * para evitar falsos positivos en labels descriptivos como "Error changing password".
   */
  it("no hay console.log con tokens, passwords o secrets", () => {
    const files = walkDir("src").filter(
      (f) => f.endsWith(".ts") || f.endsWith(".tsx")
    );
    for (const file of files) {
      if (file.includes("/tests/") || file.includes(".test.")) continue;

      const content = readFile(file);
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("/*")
        )
          continue;

        const stripped = stripQuotedStrings(line);

        if (
          /console\.(log|error|warn)/.test(line) &&
          /\b(token|password|secret)\b/i.test(stripped)
        ) {
          throw new Error(
            `console.log con token/password/secret en ${file}:${i + 1}`
          );
        }
      }
    }
  });

  /**
   * Test 7: Los servicios no importan Next.js.
   *
   * Los servicios deben ser framework-agnostic (futura migración a Nest.js).
   */
  it("los servicios no importan Next.js", () => {
    const files = walkDir("src/services").filter((f) => f.endsWith(".ts"));
    for (const file of files) {
      const content = readFile(file);
      expect(content).not.toMatch(/from\s+["']next/);
    }
  });

  /**
   * Test 8: Los helpers de auth no importan Next.js.
   *
   * Los helpers auth (token-hash, password-policy, constants) deben ser
   * puramente framework-agnostic.
   */
  it("los helpers de auth no importan Next.js", () => {
    const files = [
      "src/lib/auth/token-hash.ts",
      "src/lib/auth/password-policy.ts",
      "src/lib/auth/constants.ts",
    ];
    for (const file of files) {
      const content = readFile(file);
      expect(content).not.toMatch(/from\s+["']next/);
    }
  });

  /**
   * Test 9: sessionVersion se incrementa al cambiar password.
   *
   * OBLIGATORIO incrementar sessionVersion al cambiar password.
   */
  it("sessionVersion se incrementa al cambiar password", () => {
    const content = readFile("src/lib/actions.ts");
    expect(content).toMatch(
      /sessionVersion\s*:\s*\{\s*increment\s*:\s*1\s*\}/
    );
  });

  /**
   * Test 10: bcrypt usa 12 rounds (o más) en producción.
   *
   * OBLIGATORIO usar bcrypt con 12 rounds (BCRYPT_ROUNDS).
   * No se aceptan 10 o menos en código de producción.
   */
  it("bcrypt usa 12 rounds en producción", () => {
    const files = walkDir("src").filter((f) => f.endsWith(".ts"));
    for (const file of files) {
      if (file.includes("/tests/") || file.includes(".test.") || file.includes("__tests__")) continue;

      const content = readFile(file);
      const matches = content.matchAll(/bcrypt\.hash\([^,]+,\s*(\d+)\)/g);
      for (const match of matches) {
        const rounds = parseInt(match[1], 10);
        expect(rounds).toBeGreaterThanOrEqual(12);
      }
    }
  });
});
