import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { credentialsAuthorize } from "@/lib/auth/credentials-authorize";
import bcrypt from "bcryptjs";

describe("A1: Audit events logged on login attempts", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({
      where: {
        eventType: {
          in: ["LOGIN_EXITOSO", "LOGIN_FALLIDO", "LOGIN_FALLIDO_USUARIO_INACTIVO"],
        },
      },
    });
  });

  it("should log LOGIN_EXITOSO when valid credentials are provided", async () => {
    await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
    });

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "LOGIN_EXITOSO",
        actorId: testData.usuario.id,
      },
    });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry!.eventType).toBe("LOGIN_EXITOSO");
  });

  it("should include rememberMe flag in LOGIN_EXITOSO meta", async () => {
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
    expect(auditEntry!.meta).toMatchObject({
      rememberMe: true,
    });
  });

  it("should log LOGIN_FALLIDO when credentials are invalid (wrong password)", async () => {
    await credentialsAuthorize({
      email: testData.usuario.email,
      password: "wrongpassword",
    });

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "LOGIN_FALLIDO",
        actorId: testData.usuario.id,
      },
    });

    expect(auditEntry).not.toBeNull();
  });

  it("should log LOGIN_FALLIDO with null actorId when user does not exist (anti-enumeration)", async () => {
    await credentialsAuthorize({
      email: "nonexistent@test.com",
      password: "anypassword",
    });

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "LOGIN_FALLIDO",
      },
    });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry!.actorId).toBeNull();
  });

  it("should log LOGIN_FALLIDO_USUARIO_INACTIVO when user exists but isActive is false", async () => {
    const password = await bcrypt.hash("inactivepass", 10);
    const inactiveUser = await prisma.user.create({
      data: {
        email: "inactive-audit@test.com",
        username: "inactive_audit_user",
        password,
        nombre: "Inactive Audit User",
        rol: "CLIENTE",
        mustChangePassword: false,
        isActive: false,
      },
    });

    await credentialsAuthorize({
      email: "inactive-audit@test.com",
      password: "inactivepass",
    });

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "LOGIN_FALLIDO_USUARIO_INACTIVO",
        targetId: inactiveUser.id,
      },
    });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry!.meta).toMatchObject({
      identifier: "inactive-audit@test.com",
    });

    await prisma.user.delete({ where: { id: inactiveUser.id } });
  });
});
