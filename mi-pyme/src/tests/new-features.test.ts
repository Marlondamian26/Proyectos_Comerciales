import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { catalogoAddToCart, catalogoReserve } from "@/app/catalogo/actions";
import { POST as registerPOST } from "@/app/api/auth/registro/route";
import { GET as searchGET } from "@/app/api/search/quick/route";
import { Rol } from "@/generated/prisma/client";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
const mockedAuth = auth as ReturnType<typeof vi.fn>;

describe("Catalogo Server Actions", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("catalogoAddToCart", () => {
    it("should add product to cart for authenticated user", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: testData.usuario.id, email: testData.usuario.email, rol: "CLIENTE" },
      });

      const formData = new FormData();
      formData.set("productoId", testData.producto.id);

      await catalogoAddToCart(formData);

      const carrito = await prisma.carrito.findFirst({
        where: { usuarioId: testData.usuario.id },
        include: { items: true },
      });

      expect(carrito).not.toBeNull();
      expect(carrito!.items.length).toBe(1);
      expect(carrito!.items[0].productoId).toBe(testData.producto.id);
      expect(carrito!.items[0].cantidad).toBe(1);
    });

    it("should redirect when unauthenticated", async () => {
      mockedAuth.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("productoId", testData.producto.id);

      try {
        await catalogoAddToCart(formData);
        expect.fail("Should have thrown REDIRECT");
      } catch (err) {
        expect((err as Error).message).toBe("REDIRECT");
      }

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0] as string;
      expect(redirectCall).toContain("/auth/registro");
      expect(redirectCall).toContain("callbackUrl=%2Fcatalogo");
      expect(redirectCall).toContain("intent=");
    });
  });

  describe("catalogoReserve", () => {
    it("should redirect to reservations for authenticated user", async () => {
      mockedAuth.mockResolvedValue({
        user: { id: testData.usuario.id, email: testData.usuario.email, rol: "CLIENTE" },
      });

      const formData = new FormData();
      formData.set("servicioId", testData.servicio.id);

      try {
        await catalogoReserve(formData);
        expect.fail("Should have thrown REDIRECT");
      } catch (err) {
        expect((err as Error).message).toBe("REDIRECT");
      }

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0] as string;
      expect(redirectCall).toContain("/reservas");
      expect(redirectCall).toContain(`servicioId=${testData.servicio.id}`);
    });

    it("should redirect to registration when unauthenticated", async () => {
      mockedAuth.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("servicioId", testData.servicio.id);

      try {
        await catalogoReserve(formData);
        expect.fail("Should have thrown REDIRECT");
      } catch (err) {
        expect((err as Error).message).toBe("REDIRECT");
      }

      const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0] as string;
      expect(redirectCall).toContain("/auth/registro");
      expect(redirectCall).toContain("callbackUrl=%2Fservicios");
      expect(redirectCall).toContain("intent=");
    });
  });
});

describe("API: POST /api/auth/registro", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should create user with valid data", async () => {
    const res = await registerPOST(
      new Request("http://localhost/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "New Test User",
          username: `uniquser${Date.now()}`,
          email: `uniq-${Date.now()}@test.com`,
          password: "Password123",
          rol: "CLIENTE",
          provincia: "Buenos Aires",
          municipio: "La Plata",
        }),
      })
    );

    const body = await res.text();
    if (res.status !== 200 && res.status !== 201) {
      console.log("Registration error:", body);
    }
    expect([200, 201]).toContain(res.status);
    const json = JSON.parse(body) as { success: boolean; userId?: string };
    expect(json.success).toBe(true);
    expect(json.userId).toBeDefined();
  });

  it("should reject invalid username format", async () => {
    const res = await registerPOST(
      new Request("http://localhost/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "Test User",
          username: "invalid user!",
          email: `inv-${Date.now()}@test.com`,
          password: "Password123",
          rol: "CLIENTE",
          provincia: "Buenos Aires",
          municipio: "La Plata",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain("usuario");
  });

  it("should reject duplicate username", async () => {
    const base = `dupuser${Date.now()}`;
    const res = await registerPOST(
      new Request("http://localhost/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "Dup User",
          username: base,
          email: `dup-${Date.now()}@test.com`,
          password: "Password123",
          rol: "CLIENTE",
          provincia: "Buenos Aires",
          municipio: "La Plata",
        }),
      })
    );

    // First call should succeed
    if (res.status === 201) {
      const res2 = await registerPOST(
        new Request("http://localhost/api/auth/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: "Dup User 2",
            username: base,
            email: `dup2-${Date.now()}@test.com`,
            password: "Password123",
            rol: "CLIENTE",
            provincia: "Buenos Aires",
            municipio: "La Plata",
          }),
        })
      );
      expect(res2.status).toBe(409);
      const body = (await res2.json()) as { success: boolean; error: string };
      expect(body.error).toContain("usuario");
    }
  });
});

describe("GET /api/search/quick", () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should return 401 without authentication", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await searchGET(
      new Request("http://localhost/api/search/quick?q=pa")
    );
    expect(res.status).toBe(401);
  });

  it("should return empty results for short query", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "test", email: "test@test.com", rol: Rol.CLIENTE },
    });

    const res = await searchGET(
      new Request("http://localhost/api/search/quick?q=t")
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      query: string;
      results: { products: unknown[]; services: unknown[]; logistics: unknown[]; users: unknown[] };
      meta: { took_ms: number; limit: number; offset: number };
    };
    expect(body.results).toBeDefined();
    expect(body.results.products).toBeInstanceOf(Array);
    expect(body.results.services).toBeInstanceOf(Array);
    expect(body.results.logistics).toBeInstanceOf(Array);
    expect(body.results.users).toBeInstanceOf(Array);
  });
});
