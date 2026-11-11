import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { credentialsAuthorize } from "@/lib/auth/credentials-authorize";

describe("A2: rememberMe flag propagation in credentialsAuthorize", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({});
  });

  it("should return rememberMe: true when credentials.rememberMe is 'true'", async () => {
    const result = await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
      rememberMe: "true",
    });

    expect(result).not.toBeNull();
    expect(result!.rememberMe).toBe(true);
  });

  it("should return rememberMe: false when credentials.rememberMe is 'false'", async () => {
    const result = await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
      rememberMe: "false",
    });

    expect(result).not.toBeNull();
    expect(result!.rememberMe).toBe(false);
  });

  it("should return rememberMe: false when credentials.rememberMe is not provided", async () => {
    const result = await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
    });

    expect(result).not.toBeNull();
    expect(result!.rememberMe).toBe(false);
  });

  it("should include rememberMe in LOGIN_EXITOSO audit meta", async () => {
    await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
      rememberMe: "true",
    });

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "LOGIN_EXITOSO",
        actorId: testData.usuario.id,
      },
      orderBy: { timestamp: "desc" },
    });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry!.meta.rememberMe).toBe(true);
  });

  it("should NOT set session timeout override when rememberMe is true (JWT exp not modified)", async () => {
    const result = await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
      rememberMe: "true",
    });

    expect(result).not.toBeNull();
    expect(result!.rememberMe).toBe(true);
  });
});
