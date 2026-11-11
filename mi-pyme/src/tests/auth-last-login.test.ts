import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { credentialsAuthorize } from "@/lib/auth/credentials-authorize";
import { actualizarLastLogin } from "@/lib/auth/actualizar-last-login";
import bcrypt from "bcryptjs";

describe("A5: lastLoginAt actualizado en login exitoso", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.user.update({
      where: { id: testData.usuario.id },
      data: {
        lastLoginAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await prisma.auditLog.deleteMany({
      where: { eventType: "LOGIN_EXITOSO" },
    });
  });

  it("should set lastLoginAt when a valid user logs in", async () => {
    const before = await prisma.user.findUnique({
      where: { id: testData.usuario.id },
      select: { lastLoginAt: true },
    });
    expect(before!.lastLoginAt).toBeNull();

    const result = await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
    });

    expect(result).not.toBeNull();

    const after = await prisma.user.findUnique({
      where: { id: testData.usuario.id },
      select: { lastLoginAt: true },
    });
    expect(after!.lastLoginAt).not.toBeNull();

    const diff = Date.now() - new Date(after!.lastLoginAt!).getTime();
    expect(diff).toBeLessThan(5000);
    expect(diff).toBeGreaterThan(-1000);
  });

  it("should NOT set lastLoginAt on wrong password", async () => {
    await credentialsAuthorize({
      email: testData.usuario.email,
      password: "wrongpassword",
    });

    const after = await prisma.user.findUnique({
      where: { id: testData.usuario.id },
      select: { lastLoginAt: true },
    });
    expect(after!.lastLoginAt).toBeNull();
  });

  it("should NOT set lastLoginAt for inactive user (even with correct password)", async () => {
    const inactiveUser = await prisma.user.create({
      data: {
        email: "inactive-lastlogin@test.com",
        username: "inactive_lastlogin",
        password: await bcrypt.hash("password123", 10),
        nombre: "Inactive LastLogin",
        rol: "CLIENTE",
        mustChangePassword: false,
        isActive: false,
      },
    });

    await credentialsAuthorize({
      email: "inactive-lastlogin@test.com",
      password: "password123",
    });

    const after = await prisma.user.findUnique({
      where: { id: inactiveUser.id },
      select: { lastLoginAt: true },
    });
    expect(after!.lastLoginAt).toBeNull();

    await prisma.user.delete({ where: { id: inactiveUser.id } });
  });

  it("should update lastLoginAt to a newer timestamp on repeated logins", async () => {
    await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
    });

    const first = await prisma.user.findUnique({
      where: { id: testData.usuario.id },
      select: { lastLoginAt: true },
    });
    const firstTime = new Date(first!.lastLoginAt!).getTime();

    await new Promise((r) => setTimeout(r, 1100));

    await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
    });

    const second = await prisma.user.findUnique({
      where: { id: testData.usuario.id },
      select: { lastLoginAt: true },
    });
    const secondTime = new Date(second!.lastLoginAt!).getTime();

    expect(secondTime).toBeGreaterThan(firstTime);
  });
});

describe("actualizarLastLogin helper (unit)", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should update lastLoginAt for a valid user", async () => {
    await prisma.user.update({
      where: { id: testData.usuario.id },
      data: { lastLoginAt: null },
    });

    await actualizarLastLogin(testData.usuario.id);

    const after = await prisma.user.findUnique({
      where: { id: testData.usuario.id },
      select: { lastLoginAt: true },
    });
    expect(after!.lastLoginAt).not.toBeNull();
  });

  it("should not throw when user does not exist (error is swallowed)", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      actualizarLastLogin("nonexistent-user-id-12345")
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should return void even when Prisma update fails", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await actualizarLastLogin("nonexistent-user-id-12345");

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
