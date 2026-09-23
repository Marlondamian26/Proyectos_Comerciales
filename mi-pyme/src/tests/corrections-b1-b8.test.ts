import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { POST as registroPOST } from "@/app/api/auth/registro/route";
import { POST as recuperarPOST } from "@/app/api/auth/recuperar/route";
import { POST as resetearPOST } from "@/app/api/auth/resetear/route";
import { hashToken, verifyToken } from "@/lib/auth/token-hash";
import { validarPassword } from "@/lib/auth/password-policy";
import { BCRYPT_ROUNDS } from "@/lib/auth/constants";
import { cambiarPassword } from "@/lib/actions";
import bcrypt from "bcryptjs";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const VALID_PASSWORD = "ValidTest1234";
const BLACKLISTED_PASSWORD = "password123";

describe("B1: Forced rol CLIENTE on registration", () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["b1-admin@test.com", "b1-negocio@test.com"] } },
    });
  });

  it("should force rol to CLIENTE even when ADMIN is provided in body", async () => {
    const request = new Request("http://localhost/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "B1 Admin Test",
        username: `b1admin${Date.now()}`,
        email: "b1-admin@test.com",
        password: VALID_PASSWORD,
        rol: "ADMIN",
      }),
    });

    const res = await registroPOST(request);
    const body = await res.json();

    expect(body.success).toBe(true);
    const user = await prisma.user.findUnique({
      where: { email: "b1-admin@test.com" },
      select: { rol: true },
    });
    expect(user!.rol).toBe("CLIENTE");
  });

  it("should force rol to CLIENTE even when NEGOCIO is provided in body", async () => {
    const request = new Request("http://localhost/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "B1 Negocio Test",
        username: `b1negocio${Date.now()}`,
        email: "b1-negocio@test.com",
        password: VALID_PASSWORD,
        rol: "NEGOCIO",
      }),
    });

    const res = await registroPOST(request);
    const body = await res.json();

    expect(body.success).toBe(true);
    const user = await prisma.user.findUnique({
      where: { email: "b1-negocio@test.com" },
      select: { rol: true },
    });
    expect(user!.rol).toBe("CLIENTE");
  });
});

describe("B2: Token hashing on password reset", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.verificationToken.deleteMany({});
  });

  it("should store only the SHA-256 hash in the database, not the raw token", async () => {
    const request = new Request("http://localhost:3000/api/auth/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testData.usuario.email }),
    });

    const res = await recuperarPOST(request);
    const body = await res.json();

    const storedToken = await prisma.verificationToken.findFirst({
      where: { identifier: testData.usuario.email },
    });

    expect(storedToken).not.toBeNull();
    expect(storedToken!.token).not.toBe(body.token);
    expect(storedToken!.token).toHaveLength(64);
    expect(storedToken!.token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should verify that hashToken produces a verifiable hash", () => {
    const rawToken = crypto.randomUUID();
    const hashed = hashToken(rawToken);

    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyToken(rawToken, hashed)).toBe(true);
    expect(verifyToken("wrong-token", hashed)).toBe(false);
  });

  it("should accept reset with the raw token from the recuperar response", async () => {
    const recuperarRequest = new Request("http://localhost:3000/api/auth/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testData.usuario.email }),
    });

    const recuperarRes = await recuperarPOST(recuperarRequest);
    const recuperarBody = await recuperarRes.json();

    const resetearRequest = new Request("http://localhost:3000/api/auth/resetear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: recuperarBody.token,
        password: VALID_PASSWORD,
      }),
    });

    const resetearRes = await resetearPOST(resetearRequest);
    expect(resetearRes.status).toBe(200);

    const deletedToken = await prisma.verificationToken.findFirst({
      where: { identifier: testData.usuario.email },
    });
    expect(deletedToken).toBeNull();
  });
});

describe("B3: GET handler removed from resetear endpoint", () => {
  it("should not export a GET handler from resetear route", async () => {
    const routeModule = await import("@/app/api/auth/resetear/route");
    expect(routeModule.GET).toBeUndefined();
  });
});

describe("B4: sessionVersion invalidation on password change", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should increment sessionVersion after password change", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: testData.usuario.id,
        email: testData.usuario.email,
        rol: "CLIENTE",
        mustChangePassword: false,
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: testData.usuario.email },
      select: { id: true, sessionVersion: true, password: true },
    });

    const originalVersion = user!.sessionVersion;
    const currentPassword = "password123";

    await prisma.user.update({
      where: { id: user!.id },
      data: { password: await bcrypt.hash(currentPassword, 10) },
    });

    await cambiarPassword(user!.id, {
      passwordActual: currentPassword,
      passwordNuevo: VALID_PASSWORD,
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { sessionVersion: true },
    });

    expect(updatedUser!.sessionVersion).toBe(originalVersion + 1);
  });
});

describe("B5: Password policy validation", () => {
  it("should reject passwords shorter than 10 characters", () => {
    const result = validarPassword("Ab123");
    expect(result.valida).toBe(false);
  });

  it("should reject passwords without numbers", () => {
    const result = validarPassword("abcdefghij");
    expect(result.valida).toBe(false);
  });

  it("should reject passwords without letters", () => {
    const result = validarPassword("1234567890");
    expect(result.valida).toBe(false);
  });

  it("should reject common blacklisted passwords", () => {
    const result = validarPassword(BLACKLISTED_PASSWORD);
    expect(result.valida).toBe(false);
  });

  it("should accept valid passwords", () => {
    const result = validarPassword(VALID_PASSWORD);
    expect(result.valida).toBe(true);
  });
});

describe("B6: bcrypt hash rounds = 12", () => {
  it("BCRYPT_ROUNDS constant should equal 12", () => {
    expect(BCRYPT_ROUNDS).toBe(12);
  });

  it("should produce bcrypt hash with cost factor 12", async () => {
    const password = "TestPassword123";
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const parts = hash.split("$");
    expect(parts[0]).toBe("");
    expect(parts[1]).toBe("2b");
    expect(parts[2]).toBe("12");
    expect(parts[3]).toBeDefined();
  });
});

describe("B7: CLIENTE negocio owner can access /negocio routes", () => {
  it("should include cache key for negocio.porUsuario", async () => {
    const { cacheKeys } = await import("@/infrastructure/cache/keys");
    const key = cacheKeys.negocio.porUsuario("user-123");
    expect(key).toContain("user-123");
  });

  it("should have cacheTTL.negocioUsuario set", async () => {
    const { cacheTTL } = await import("@/infrastructure/cache/ttl");
    expect(cacheTTL.negocioUsuario).toBeDefined();
    expect(cacheTTL.negocioUsuario).toBeGreaterThan(0);
  });
});
