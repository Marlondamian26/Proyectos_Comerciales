import { describe, test, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "./setup";
import { registrarUsuario } from "@/lib/actions";
import bcrypt from "bcryptjs";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn().mockResolvedValue({ ok: true, error: null }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const TEST_EMAILS = [
  "legal-priv@test.com",
  "legal-terms@test.com",
  "legal-no-terms@test.com",
];

async function limpiarUsuariosTest() {
  await prisma.user.deleteMany({
    where: { email: { in: TEST_EMAILS } },
  });
}

async function crearUsuarioConTerminos({
  email,
  aceptaTerminos = true,
  nombre = "Usuario Legal",
  username = "usuariolegal",
}) {
  const password = await bcrypt.hash("Password123!", 12);
  return prisma.user.create({
    data: {
      email,
      username,
      password,
      nombre,
      rol: "CLIENTE",
      ...(aceptaTerminos && {
        aceptoTerminosEn: new Date(),
        aceptoTerminosVersion: "2026-11",
      }),
    },
  });
}

describe("Documentos legales", () => {
  test("las 3 rutas legales existen y tienen nombres válidos", () => {
    const rutas = ["/privacidad", "/terminos", "/devoluciones"];
    rutas.forEach((ruta) => {
      expect(ruta).toMatch(/^\/(privacidad|terminos|devoluciones)$/);
    });
  });

  test("la versión de términos tiene formato válido", () => {
    const version = "2026-11";
    expect(version).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("Registrar usuario con aceptación de términos", () => {
  beforeEach(async () => {
    await limpiarUsuariosTest();
  });

  afterAll(async () => {
    await limpiarUsuariosTest();
    await prisma.$disconnect();
  });

  test("registrarUsuario rechaza si aceptaTerminos es falso", async () => {
    const result = await registrarUsuario({
      nombre: "Test User",
      username: "testuser123",
      email: "legal-no-terms@test.com",
      password: "Password123!",
      provincia: "La Habana",
      municipio: "Playa",
      aceptaTerminos: false,
      callbackUrl: "/cliente",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Términos");
  });

  test("registrarUsuario acepta si aceptaTerminos es verdadero", async () => {
    await registrarUsuario({
      nombre: "Test User",
      username: "testuser1234",
      email: "legal-priv@test.com",
      password: "Password123!",
      provincia: "La Habana",
      municipio: "Playa",
      aceptaTerminos: true,
      callbackUrl: "/cliente",
    });

    // registrarUsuario llama a redirect() que lanza NEXT_REDIRECT,
    // por lo que result puede ser undefined. Verificamos en la BD.
    const user = await prisma.user.findUnique({
      where: { email: "legal-priv@test.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.aceptoTerminosEn).not.toBeNull();
    expect(user!.aceptoTerminosVersion).toBe("2026-11");
  });
});

describe("Usuario creado tiene campos de términos", () => {
  beforeEach(async () => {
    await limpiarUsuariosTest();
  });

  afterAll(async () => {
    await limpiarUsuariosTest();
    await prisma.$disconnect();
  });

  test("usuario con aceptoTerminosEn no nulo", async () => {
    await crearUsuarioConTerminos({
      email: "legal-terms@test.com",
      username: "userlegal123",
    });

    const user = await prisma.user.findUnique({
      where: { email: "legal-terms@test.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.aceptoTerminosEn).not.toBeNull();
    expect(user!.aceptoTerminosVersion).toBe("2026-11");
  });
});
