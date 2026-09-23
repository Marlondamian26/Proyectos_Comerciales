import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { credentialsAuthorize } from "@/lib/auth/credentials-authorize";
import { middleware } from "@/middleware";
import { auth } from "@/lib/auth";
import { cambiarPassword } from "@/lib/actions";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/auth/requireRole", () => ({
  requireRole: vi.fn(async () => ({
    id: "forced-change-user",
    email: "forced@test.com",
    rol: "CLIENTE",
  })),
}));

const mockedAuth = auth as ReturnType<typeof vi.fn>;

describe("S1: credentialsAuthorize exposes mustChangePassword", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["forced@test.com", "noforoce@test.com"] } },
    });
  });

  it("should return mustChangePassword: true when user has the flag", async () => {
    const password = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email: "forced@test.com",
        username: "forced_user",
        password,
        nombre: "Forced Change User",
        rol: "CLIENTE",
        mustChangePassword: true,
        isActive: true,
      },
    });

    const result = await credentialsAuthorize({
      email: "forced@test.com",
      password: "password123",
    });

    expect(result).not.toBeNull();
    expect(result!.mustChangePassword).toBe(true);
    expect(result!.id).toBe(user.id);
  });

  it("should return mustChangePassword: false when user does not have the flag", async () => {
    const password = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        email: "noforoce@test.com",
        username: "noforoce_user",
        password,
        nombre: "No Forced Change User",
        rol: "CLIENTE",
        mustChangePassword: false,
        isActive: true,
      },
    });

    const result = await credentialsAuthorize({
      email: "noforoce@test.com",
      password: "password123",
    });

    expect(result).not.toBeNull();
    expect(result!.mustChangePassword).toBe(false);
  });
});

describe("S1: cambiarPassword clears mustChangePassword and logs audit", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let forcedUserId: string;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["forced@test.com", "noforoce@test.com"] } },
    });
    await prisma.auditLog.deleteMany({
      where: { eventType: "PASSWORD_CAMBIADO_OBLIGATORIO" },
    });

    const password = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email: "forced@test.com",
        username: "forced_user",
        password,
        nombre: "Forced Change User",
        rol: "CLIENTE",
        mustChangePassword: true,
        isActive: true,
      },
    });
    forcedUserId = user.id;
  });

  it("should set mustChangePassword to false after password change", async () => {
    await cambiarPassword(forcedUserId, {
      passwordActual: "password123",
      passwordNuevo: "newpassword456",
    });

    const updated = await prisma.user.findUnique({
      where: { id: forcedUserId },
      select: { mustChangePassword: true, password: true },
    });

    expect(updated).not.toBeNull();
    expect(updated!.mustChangePassword).toBe(false);
  });

  it("should log PASSWORD_CAMBIADO_OBLIGATORIO audit event when mustChangePassword was true", async () => {
    await cambiarPassword(forcedUserId, {
      passwordActual: "password123",
      passwordNuevo: "newpassword456",
    });

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        eventType: "PASSWORD_CAMBIADO_OBLIGATORIO",
        targetId: forcedUserId,
      },
    });

    expect(auditEntry).not.toBeNull();
  });

  it("should update the password hash in the database", async () => {
    await cambiarPassword(forcedUserId, {
      passwordActual: "password123",
      passwordNuevo: "newpassword456",
    });

    const updated = await prisma.user.findUnique({
      where: { id: forcedUserId },
      select: { password: true },
    });

    const isValid = await bcrypt.compare("newpassword456", updated!.password!);
    expect(isValid).toBe(true);
  });
});

describe("S1: Middleware enforces mustChangePassword redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to /perfil/cambiar-password when mustChangePassword is true and user visits /admin", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "1", rol: "ADMIN", mustChangePassword: true },
    });

    const req = new NextRequest("http://localhost:3000/admin");
    const response = await middleware(req, undefined as never);

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain(
      "/perfil/cambiar-password"
    );
  });

  it("should redirect from / to /perfil/cambiar-password when mustChangePassword is true", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "1", rol: "ADMIN", mustChangePassword: true },
    });

    const req = new NextRequest("http://localhost:3000/");
    const response = await middleware(req, undefined as never);

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain(
      "/perfil/cambiar-password"
    );
  });

  it("should allow access to /perfil/cambiar-password when mustChangePassword is true", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "1", rol: "ADMIN", mustChangePassword: true },
    });

    const req = new NextRequest(
      "http://localhost:3000/perfil/cambiar-password"
    );
    const response = await middleware(req, undefined as never);

    expect(response?.status).toBe(200);
    expect(response?.headers.get("location")).toBeNull();
  });

  it("should allow access to /api/perfil when mustChangePassword is true", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "1", rol: "CLIENTE", mustChangePassword: true },
    });

    const req = new NextRequest("http://localhost:3000/api/perfil");
    const response = await middleware(req, undefined as never);

    expect(response?.status).toBe(200);
    expect(response?.headers.get("location")).toBeNull();
  });

  it("should allow access to /auth/login when mustChangePassword is true (logout/login)", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "1", rol: "ADMIN", mustChangePassword: true },
    });

    const req = new NextRequest("http://localhost:3000/auth/login");
    const response = await middleware(req, undefined as never);

    expect(response?.status).toBe(200);
    expect(response?.headers.get("location")).toBeNull();
  });

  it("should NOT redirect when mustChangePassword is false", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "1", rol: "ADMIN", mustChangePassword: false },
    });

    const req = new NextRequest("http://localhost:3000/admin");
    const response = await middleware(req, undefined as never);

    expect(response?.headers.get("location")).toBeNull();
  });

  it("should NOT redirect when mustChangePassword is undefined", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "1", rol: "CLIENTE" },
    });

    const req = new NextRequest("http://localhost:3000/cliente");
    const response = await middleware(req, undefined as never);

    expect(response?.headers.get("location")).toBeNull();
  });
});
