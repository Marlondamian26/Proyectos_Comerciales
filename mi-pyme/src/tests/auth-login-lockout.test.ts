import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { credentialsAuthorize } from "@/lib/auth/credentials-authorize";

describe("Credential login lockout", () => {
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
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: null },
    });
    await prisma.auditLog.deleteMany({
      where: { actorId: testData.usuario.id },
    });
  });

  it("locks after five consecutive invalid passwords and rejects further attempts", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        credentialsAuthorize({
          email: testData.usuario.email,
          password: "wrong-password",
        })
      ).resolves.toBeNull();
    }

    const lockedUser = await prisma.user.findUniqueOrThrow({
      where: { id: testData.usuario.id },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });

    expect(lockedUser.failedLoginAttempts).toBe(5);
    expect(lockedUser.lockedUntil).not.toBeNull();
    expect(lockedUser.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    expect(lockedUser.lockedUntil!.getTime()).toBeLessThanOrEqual(
      Date.now() + 15 * 60 * 1000
    );

    await expect(
      credentialsAuthorize({
        email: testData.usuario.email,
        password: "password123",
      })
    ).resolves.toBeNull();
  });

  it("clears the failed-attempt state after a successful login", async () => {
    await prisma.user.update({
      where: { id: testData.usuario.id },
      data: {
        failedLoginAttempts: 4,
        lockedUntil: new Date(Date.now() - 60_000),
      },
    });

    const result = await credentialsAuthorize({
      email: testData.usuario.email,
      password: "password123",
    });

    expect(result).not.toBeNull();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testData.usuario.id },
      select: { failedLoginAttempts: true, lockedUntil: true, lastLoginAt: true },
    });
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
    expect(user.lastLoginAt).not.toBeNull();
  });

  it("restarts the counter after an expired lock instead of immediately relocking", async () => {
    await prisma.user.update({
      where: { id: testData.usuario.id },
      data: {
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() - 60_000),
      },
    });

    await expect(
      credentialsAuthorize({
        email: testData.usuario.email,
        password: "wrong-password",
      })
    ).resolves.toBeNull();

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: testData.usuario.id },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });
    expect(user.failedLoginAttempts).toBe(1);
    expect(user.lockedUntil).toBeNull();
  });

  it("returns the same rejected result for a currently locked account", async () => {
    await prisma.user.update({
      where: { id: testData.usuario.id },
      data: {
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 60_000),
      },
    });

    await expect(
      credentialsAuthorize({
        email: testData.usuario.email,
        password: "password123",
      })
    ).resolves.toBeNull();
  });
});
