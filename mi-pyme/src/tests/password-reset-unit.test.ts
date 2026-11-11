import { describe, test, expect } from "vitest";
import { hashToken, verifyToken } from "@/lib/auth/token-hash";
import { validarPassword } from "@/lib/auth/password-policy";
import { rateLimit, clearRateLimit } from "@/lib/rate-limit";

describe("Password Reset — Unit (token-hash)", () => {
  test("hashToken produce hash estable y diferente al token original", () => {
    const token = "abc123-def456";
    const hash = hashToken(token);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toBe(token);
    expect(hash.length).toBe(64); // SHA-256 hex = 64 chars
  });

  test("verifyToken valida correctamente", () => {
    const token = "abc123-def456";
    const hash = hashToken(token);
    expect(verifyToken(token, hash)).toBe(true);
    expect(verifyToken("wrong-token", hash)).toBe(false);
    expect(verifyToken(token, hashToken("otro"))).toBe(false);
  });

  test("verifyToken rechaza hashes de longitud inválida", () => {
    expect(verifyToken("token", "hash-corto")).toBe(false);
  });
});

describe("Password Reset — Unit (password-policy)", () => {
  test("rechaza contraseñas demasiado cortas", () => {
    expect(validarPassword("1234567").valida).toBe(false);
    expect(validarPassword("Pass1234567").valida).toBe(true);
  });

  test("rechaza contraseñas sin letra", () => {
    expect(validarPassword("1234567890").valida).toBe(false);
  });

  test("rechaza contraseñas sin número", () => {
    expect(validarPassword("passwordabc").valida).toBe(false);
  });

  test("rechaza contraseñas de la lista negra", () => {
    expect(validarPassword("password123").valida).toBe(false);
    expect(validarPassword("admin12345").valida).toBe(false);
  });

  test("acepta contraseña válida", () => {
    expect(validarPassword("MiPass12345").valida).toBe(true);
    expect(validarPassword("Cuba2024!Pass").valida).toBe(true);
  });
});

describe("Password Reset — Unit (rate-limit)", () => {
  beforeEach(() => {
    clearRateLimit("test-key");
  });

  test("permite solicitudes dentro del límite", () => {
    const r1 = rateLimit("test-key", 3, 60000);
    const r2 = rateLimit("test-key", 3, 60000);
    const r3 = rateLimit("test-key", 3, 60000);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  test("rechaza solicitudes que exceden el límite", () => {
    rateLimit("test-key", 3, 60000);
    rateLimit("test-key", 3, 60000);
    rateLimit("test-key", 3, 60000);

    const r4 = rateLimit("test-key", 3, 60000);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  test("diferentes claves son independientes", () => {
    rateLimit("key-a", 1, 60000);
    const r = rateLimit("key-b", 1, 60000);
    expect(r.allowed).toBe(true);
  });
});
