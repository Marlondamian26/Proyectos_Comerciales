import {
  describe,
  test,
  expect,
  beforeEach,
  afterAll,
  vi,
} from "vitest";
import { prisma } from "./setup";
import { hashToken } from "@/lib/auth/token-hash";
import bcrypt from "bcryptjs";

// Mock del servicio de email para no enviar emails reales en tests
vi.mock("@/lib/auth/password-reset-email", () => ({
  enviarPasswordReset: vi.fn().mockResolvedValue(undefined),
}));

import { enviarPasswordReset } from "@/lib/auth/password-reset-email";
import { logAudit } from "@/services/utils/audit";

vi.mock("@/services/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

const TEST_EMAILS = [
  "cliente-reset@test.com",
  "negocio-reset@test.com",
  "admin-reset@test.com",
  "inactivo-reset@test.com",
];

async function limpiarUsuariosTest() {
  await prisma.user.deleteMany({
    where: { email: { in: TEST_EMAILS } },
  });
}

async function crearUsuario({
  email,
  rol,
  password = "Password123!",
  nombre = "Usuario Test",
  isActive = true,
}) {
  const hashed = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: {
      email,
      username: email.split("@")[0],
      password: hashed,
      nombre,
      rol,
      isActive,
    },
  });
}

// --- Simular la lógica del endpoint /api/auth/recuperar ---
async function solicitarRecuperacion(email: string) {
  const emailNormalizado = email.toLowerCase().trim();
  const respuestaGenerica = {
    success: true,
    message: "Si el email está registrado, recibirás un enlace en tu correo.",
  };

  const user = await prisma.user.findUnique({
    where: { email: emailNormalizado },
  });

  if (!user || !user.isActive) {
    await logAudit(
      "PASSWORD_RESET_SOLICITADO_USUARIO_INEXISTENTE",
      null,
      null,
      { email: emailNormalizado },
    );
    return { status: 200, data: respuestaGenerica };
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: user.email },
  });

  const tokenPlano = crypto.randomUUID();
  const tokenHash = hashToken(tokenPlano);
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: tokenHash,
      expires,
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/resetear/${tokenPlano}`;
  try {
    await enviarPasswordReset({
      to: user.email,
      nombre: user.nombre ?? user.email,
      resetUrl,
      expiresInMinutes: 60,
    });
  } catch {
    // No revelar error al usuario
  }

  await logAudit("PASSWORD_RESET_SOLICITADO", user.id, user.id, {
    email: user.email,
  });

  return { status: 200, data: respuestaGenerica, tokenPlano };
}

// --- Simular la lógica del endpoint /api/auth/resetear ---
async function resetearConToken(token: string, password: string) {
  const validacion = {
    valida: password.length >= 10 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password),
    errores: [] as string[],
  };
  if (!validacion.valida) {
    return { status: 400, data: { error: "Contraseña débil", detalles: validacion.errores } };
  }

  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findFirst({
    where: {
      token: tokenHash,
      expires: { gt: new Date() },
    },
  });

  if (!record) {
    return { status: 400, data: { error: "El enlace es inválido o ha expirado. Solicita uno nuevo." } };
  }

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  });

  if (!user || !user.isActive) {
    return { status: 400, data: { error: "No se puede restablecer la contraseña" } };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 },
        failedLoginAttempts: 0,
        lockedUntil: null,
        mustChangePassword: false,
      },
    }),
    prisma.verificationToken.delete({
      where: { token: tokenHash },
    }),
  ]);

  await logAudit("PASSWORD_RESET_COMPLETADO", user.id, user.id, {
    email: record.identifier,
  });

  return {
    status: 200,
    data: {
      success: true,
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
    },
  };
}

async function obtenerTokenParaEmail(email: string) {
  return prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { createdAt: "desc" },
  });
}

describe("Password Reset — Integración (lógica de endpoint)", () => {
  let cliente: Awaited<ReturnType<typeof crearUsuario>>;
  let negocio: Awaited<ReturnType<typeof crearUsuario>>;
  let admin: Awaited<ReturnType<typeof crearUsuario>>;

  beforeEach(async () => {
    vi.mocked(enviarPasswordReset).mockClear();
    vi.mocked(logAudit).mockClear();
    await prisma.verificationToken.deleteMany();
    await limpiarUsuariosTest();

    cliente = await crearUsuario({
      email: "cliente-reset@test.com",
      rol: "CLIENTE",
      nombre: "Cliente Reset",
    });
    negocio = await crearUsuario({
      email: "negocio-reset@test.com",
      rol: "NEGOCIO",
      nombre: "Negocio Reset",
    });
    admin = await crearUsuario({
      email: "admin-reset@test.com",
      rol: "ADMIN",
      nombre: "Admin Reset",
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Solicitar recuperación", () => {
    test("CLIENTE: crea token hasheado y llama al servicio de email", async () => {
      const result = await solicitarRecuperacion(cliente.email);

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.token).toBeUndefined();

      const record = await obtenerTokenParaEmail(cliente.email);
      expect(record).not.toBeNull();
      expect(record!.token).toHaveLength(64);
      expect(record!.expires.getTime()).toBeGreaterThan(Date.now());

      expect(vi.mocked(enviarPasswordReset)).toHaveBeenCalledTimes(1);
      const emailCall = vi.mocked(enviarPasswordReset).mock.calls[0][0];
      expect(emailCall.to).toBe(cliente.email);
      expect(emailCall.resetUrl).toContain("/auth/resetear/");
    });

    test("NEGOCIO: funciona para rol NEGOCIO", async () => {
      const result = await solicitarRecuperacion(negocio.email);

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);

      const record = await obtenerTokenParaEmail(negocio.email);
      expect(record).not.toBeNull();
      expect(vi.mocked(enviarPasswordReset)).toHaveBeenCalledTimes(1);
    });

    test("ADMIN: funciona para rol ADMIN", async () => {
      const result = await solicitarRecuperacion(admin.email);

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);

      const record = await obtenerTokenParaEmail(admin.email);
      expect(record).not.toBeNull();
      expect(vi.mocked(enviarPasswordReset)).toHaveBeenCalledTimes(1);
    });

    test("Usuario inexistente: respuesta genérica, no crea token", async () => {
      const result = await solicitarRecuperacion("noexiste@test.com");

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.message).toContain("Si el email está registrado");

      const record = await obtenerTokenParaEmail("noexiste@test.com");
      expect(record).toBeNull();
      expect(vi.mocked(enviarPasswordReset)).not.toHaveBeenCalled();
    });

    test("Usuario inactivo: respuesta genérica, no crea token", async () => {
      await crearUsuario({
        email: "inactivo-reset@test.com",
        rol: "CLIENTE",
        isActive: false,
      });

      const result = await solicitarRecuperacion("inactivo-reset@test.com");

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
      expect(result.data.message).toContain("Si el email está registrado");

      const record = await obtenerTokenParaEmail("inactivo-reset@test.com");
      expect(record).toBeNull();
    });

    test("Anti-enumeración: misma respuesta para email existente e inexistente", async () => {
      const resExistente = await solicitarRecuperacion(cliente.email);
      const resInexistente = await solicitarRecuperacion("noexiste@test.com");

      expect(resExistente.status).toBe(resInexistente.status);
      expect(resExistente.data.success).toBe(resInexistente.data.success);
      expect(resExistente.data.message).toBe(resInexistente.data.message);
    });

    test("Invalida tokens previos al solicitar uno nuevo", async () => {
      await solicitarRecuperacion(cliente.email);
      const primerToken = await obtenerTokenParaEmail(cliente.email);
      expect(primerToken).not.toBeNull();

      await solicitarRecuperacion(cliente.email);
      const segundoToken = await obtenerTokenParaEmail(cliente.email);
      expect(segundoToken).not.toBeNull();
      expect(segundoToken!.id).not.toBe(primerToken!.id);

      const tokenPrimero = await prisma.verificationToken.findUnique({
        where: { id: primerToken!.id },
      });
      expect(tokenPrimero).toBeNull();
    });
  });

  describe("Resetear contraseña", () => {
    let tokenValido: string;

    beforeEach(async () => {
      await solicitarRecuperacion(cliente.email);
      const record = await obtenerTokenParaEmail(cliente.email);
      expect(record).not.toBeNull();

      tokenValido = "test-token-plano-12345";
      const tokenHash = hashToken(tokenValido);
      await prisma.verificationToken.create({
        data: {
          identifier: cliente.email,
          token: tokenHash,
          expires: new Date(Date.now() + TOKEN_EXPIRATION_MS),
        },
      });
    });

    test("Token válido: cambia password, incrementa sessionVersion, elimina token", async () => {
      const sessionVersionAntes = cliente.sessionVersion;

      const result = await resetearConToken(tokenValido, "NuevaPassword123!");

      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);

      const tokenDespues = await prisma.verificationToken.findUnique({
        where: { token: hashToken(tokenValido) },
      });
      expect(tokenDespues).toBeNull();

      const userDespues = await prisma.user.findUnique({
        where: { id: cliente.id },
      });
      expect(userDespues!.password).not.toBe(cliente.password);
      expect(userDespues!.sessionVersion).toBe(sessionVersionAntes + 1);
      expect(userDespues!.failedLoginAttempts).toBe(0);
      expect(userDespues!.lockedUntil).toBeNull();
      expect(userDespues!.mustChangePassword).toBe(false);

      const valido = await bcrypt.compare("NuevaPassword123!", userDespues!.password!);
      expect(valido).toBe(true);
    });

    test("Token expirado: error", async () => {
      const tokenExpirado = "token-expirado-12345";
      const tokenHash = hashToken(tokenExpirado);
      await prisma.verificationToken.create({
        data: {
          identifier: cliente.email,
          token: tokenHash,
          expires: new Date(Date.now() - 60000),
        },
      });

      const result = await resetearConToken(tokenExpirado, "NuevaPassword123!");
      expect(result.status).toBe(400);
      expect(result.data.error).toContain("inválido o ha expirado");
    });

    test("Token inválido (no existe): error", async () => {
      const result = await resetearConToken("token-inexistente", "NuevaPassword123!");
      expect(result.status).toBe(400);
      expect(result.data.error).toContain("inválido o ha expirado");
    });

    test("Token ya usado (single-use): error en segundo uso", async () => {
      const res1 = await resetearConToken(tokenValido, "NuevaPassword123!");
      expect(res1.status).toBe(200);

      const res2 = await resetearConToken(tokenValido, "OtraPassword123!");
      expect(res2.status).toBe(400);
      expect(res2.data.error).toContain("inválido o ha expirado");
    });

    test("Contraseña débil: error", async () => {
      const result = await resetearConToken(tokenValido, "123");
      expect(result.status).toBe(400);
      expect(result.data.error).toBe("Contraseña débil");
      expect(result.data.detalles).toBeDefined();
    });

    test("Datos incompletos: error", async () => {
      const result = await resetearConToken(tokenValido, "");
      expect(result.status).toBe(400);
    });
  });
});
