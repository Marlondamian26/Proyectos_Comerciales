import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { credentialsAuthorize } from "@/lib/auth/credentials-authorize";
import bcrypt from "bcryptjs";

describe("S2: isActive filter blocks inactive users from logging in", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ["inactive-s2a@test.com", "inactive-s2b@test.com"] },
      },
    });
    await prisma.auditLog.deleteMany({
      where: { eventType: "LOGIN_FALLIDO_USUARIO_INACTIVO" },
    });
  });

  it("should allow login for active user with correct password", async () => {
    const result = await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe(testData.usuario.id);
    expect(result!.email).toBe(testData.usuario.email);
    expect(result!.rol).toBe("CLIENTE");
  });

  it("should return null for inactive user with correct password", async () => {
    const password = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        email: "inactive-s2a@test.com",
        username: "inactive_s2a",
        password,
        nombre: "Inactive User A",
        rol: "CLIENTE",
        mustChangePassword: false,
        isActive: false,
      },
    });

    const result = await credentialsAuthorize({
      email: "inactive-s2a@test.com",
      password: "password123",
    });

    expect(result).toBeNull();
  });

  it("should return null for inactive user by username (anti-enumeration)", async () => {
    const password = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        email: "inactive-s2b@test.com",
        username: "inactive_s2b",
        password,
        nombre: "Inactive User B",
        rol: "CLIENTE",
        mustChangePassword: false,
        isActive: false,
      },
    });

    const result = await credentialsAuthorize({
      email: "inactive_s2b",
      password: "password123",
    });

    expect(result).toBeNull();
  });

  it("should return the same null result for inactive user and wrong password (anti-enumeration)", async () => {
    const password = await bcrypt.hash("correctpass", 10);
    await prisma.user.create({
      data: {
        email: "inactive-s2a@test.com",
        username: "inactive_s2a",
        password,
        nombre: "Inactive User A",
        rol: "CLIENTE",
        mustChangePassword: false,
        isActive: false,
      },
    });

    const inactiveResult = await credentialsAuthorize({
      email: "inactive-s2a@test.com",
      password: "correctpass",
    });
    const wrongPassResult = await credentialsAuthorize({
      email: "inactive-s2a@test.com",
      password: "wrongpassword",
    });

    expect(inactiveResult).toBeNull();
    expect(wrongPassResult).toBeNull();
  });

  it("should log LOGIN_FALLIDO_USUARIO_INACTIVO audit event for inactive user", async () => {
    const password = await bcrypt.hash("password123", 10);
    const inactiveUser = await prisma.user.create({
      data: {
        email: "inactive-s2a@test.com",
        username: "inactive_s2a",
        password,
        nombre: "Inactive User A",
        rol: "CLIENTE",
        mustChangePassword: false,
        isActive: false,
      },
    });

    await credentialsAuthorize({
      email: "inactive-s2a@test.com",
      password: "password123",
    });

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "LOGIN_FALLIDO_USUARIO_INACTIVO",
        targetId: inactiveUser.id,
      },
    });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry!.meta).toEqual(
      expect.objectContaining({ reason: "inactive_user_login_attempt" })
    );
  });

  it("should NOT log LOGIN_FALLIDO_USUARIO_INACTIVO for a user that does not exist", async () => {
    await credentialsAuthorize({
      email: "nonexistent-s2@test.com",
      password: "password123",
    });

    const auditEntry = await prisma.auditLog.findFirst({
      where: { eventType: "LOGIN_FALLIDO_USUARIO_INACTIVO" },
    });

    expect(auditEntry).toBeNull();
  });
});
