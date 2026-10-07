import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { setupTestData, cleanupTestData } from "./setup";
import { registrarUsuario } from "@/lib/actions";
import { getDashboardPath } from "@/lib/auth/dashboard-paths";
import { Rol } from "@/lib/auth/roles";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn().mockResolvedValue({ ok: true, error: null }),
  signOut: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

describe("getDashboardPath", () => {
  it("returns /cliente for CLIENTE", () => {
    expect(getDashboardPath(Rol.CLIENTE)).toBe("/cliente");
  });
  it("returns /negocio for NEGOCIO", () => {
    expect(getDashboardPath(Rol.NEGOCIO)).toBe("/negocio");
  });
  it("returns /logistica for LOGISTICA", () => {
    expect(getDashboardPath(Rol.LOGISTICA)).toBe("/logistica");
  });
  it("returns /admin for ADMIN", () => {
    expect(getDashboardPath(Rol.ADMIN)).toBe("/admin");
  });
});

describe("registrarUsuario — auto-login", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(() => {
    vi.mocked(signIn).mockClear();
    vi.mocked(redirect).mockClear();
    vi.mocked(signIn).mockResolvedValue({ ok: true, error: null });
  });

  it("should create user, call signIn, and redirect to /cliente", async () => {
    const result = await registrarUsuario({
      nombre: "Nuevo Usuario",
      username: "nuevousuario",
      email: "nuevo@test.com",
      password: "Password123!",
      provincia: "La Habana",
      municipio: "La Habana",
    });

    expect(result).toBeUndefined();

    const signInCall = vi.mocked(signIn).mock.calls[0];
    expect(signInCall).toBeDefined();
    expect(signInCall[0]).toBe("credentials");
    expect(signInCall[1]).toMatchObject({
      email: "nuevo@test.com",
      password: "Password123!",
      redirect: false,
    });

    const redirectCall = vi.mocked(redirect).mock.calls[0];
    expect(redirectCall).toBeDefined();
    expect(redirectCall[0]).toBe("/cliente");
  });

  it("should redirect to /negocios/solicitar when quieroVender is true", async () => {
    const result = await registrarUsuario({
      nombre: "Vendedor Test",
      username: "vendedor123",
      email: "vendedor@test.com",
      password: "Password123!",
      provincia: "La Habana",
      municipio: "La Habana",
      quieroVender: true,
    });

    expect(result).toBeUndefined();

    const signInCall = vi.mocked(signIn).mock.calls[0];
    expect(signInCall).toBeDefined();

    const redirectCall = vi.mocked(redirect).mock.calls[0];
    expect(redirectCall).toBeDefined();
    expect(redirectCall[0]).toBe("/negocios/solicitar");
  });

  it("should return error when email is duplicate", async () => {
    const result = await registrarUsuario({
      nombre: "Cliente Test",
      username: "otro_usuario",
      email: testData.usuario.email,
      password: "Password123!",
      provincia: "La Habana",
      municipio: "La Habana",
    });

    expect(result).toEqual({
      success: false,
      error: "Ya existe un usuario con ese email",
    });

    expect(vi.mocked(signIn)).not.toHaveBeenCalled();
    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });

  it("should return error for invalid email", async () => {
    const result = await registrarUsuario({
      nombre: "Test",
      username: "testuser123",
      email: "invalid-email",
      password: "Password123!",
      provincia: "Test",
      municipio: "Test",
    });

    expect(result).toEqual({
      success: false,
      error: "Email invalido",
    });
    expect(vi.mocked(signIn)).not.toHaveBeenCalled();
  });

  it("should return error for short username", async () => {
    const result = await registrarUsuario({
      nombre: "Test User",
      username: "ab",
      email: "test2@test.com",
      password: "Password123!",
      provincia: "Test",
      municipio: "Test",
    });

    expect(result?.success).toBe(false);
    expect(result?.error).toContain("usuario");
    expect(vi.mocked(signIn)).not.toHaveBeenCalled();
  });
});
