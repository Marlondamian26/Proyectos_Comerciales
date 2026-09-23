import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { POST as registroPOST } from "@/app/api/auth/registro/route";
import { POST as recuperarPOST } from "@/app/api/auth/recuperar/route";
import { POST as resetearPOST } from "@/app/api/auth/resetear/route";
import { hashToken } from "@/lib/auth/token-hash";
import bcrypt from "bcryptjs";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("A6: Audit events for REST endpoints", () => {
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
          in: [
            "REGISTRO_USUARIO",
            "PASSWORD_RESET_SOLICITADO",
            "PASSWORD_RESET_COMPLETADO",
            "PASSWORD_CAMBIADO",
            "ROL_CAMBIADO",
          ],
        },
      },
    });
  });

  it("should log REGISTRO_USUARIO when user registration succeeds", async () => {
    const request = new Request("http://localhost:3000/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Nuevo Usuario",
        username: "nuevousuario",
        email: "nuevo@test.com",
        password: "ValidTest1234",
        rol: "CLIENTE",
      }),
    });

    await registroPOST(request);

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "REGISTRO_USUARIO",
        targetId: { not: null },
      },
      orderBy: { timestamp: "desc" },
    });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry!.meta.email).toBe("nuevo@test.com");
    expect(auditEntry!.meta.username).toBe("nuevousuario");
    expect(auditEntry!.meta.rol).toBe("CLIENTE");

    await prisma.user.deleteMany({ where: { email: "nuevo@test.com" } });
  });

  it("should log PASSWORD_RESET_SOLICITADO when password reset is requested", async () => {
    const request = new Request("http://localhost:3000/api/auth/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testData.usuario.email }),
    });

    await recuperarPOST(request);

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "PASSWORD_RESET_SOLICITADO",
        targetId: testData.usuario.id,
      },
    });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry!.meta.email).toBe(testData.usuario.email);
  });

  it("should log PASSWORD_RESET_COMPLETADO when password reset is completed with valid token", async () => {
    const user = await prisma.user.findUnique({
      where: { email: testData.usuario.email },
      select: { id: true, email: true },
    });

    const token = crypto.randomUUID();
    const tokenHash = hashToken(token);
    await prisma.verificationToken.create({
      data: {
        identifier: testData.usuario.email,
        token: tokenHash,
        expires: new Date(Date.now() + 3600000),
      },
    });

    const request = new Request("http://localhost:3000/api/auth/resetear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: "nuevapassword123",
      }),
    });

    const response = await resetearPOST(request);

    expect(response.status).toBe(200);

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "PASSWORD_RESET_COMPLETADO",
        targetId: user!.id,
      },
    });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry!.meta.email).toBe(testData.usuario.email);
  });

  it("should log PASSWORD_CAMBIADO when password is changed via /api/perfil POST", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: testData.usuario.id,
        email: testData.usuario.email,
        rol: "CLIENTE",
        mustChangePassword: false,
      },
    });

    const password = await bcrypt.hash("oldpassword", 10);
    await prisma.user.update({
      where: { id: testData.usuario.id },
      data: { password },
    });

    const { POST: perfilPOST } = await import("@/app/api/perfil/route");
    const request = new Request("http://localhost:3000/api/perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passwordActual: "oldpassword",
        passwordNuevo: "newpassword123",
      }),
    });

    await perfilPOST(request);

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "PASSWORD_CAMBIADO",
        actorId: testData.usuario.id,
      },
    });

    expect(auditEntry).not.toBeNull();
  });
});
