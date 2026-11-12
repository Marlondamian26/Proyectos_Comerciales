import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST, DELETE } from "@/app/api/carrito/route";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import {
  anadirItemCarrito,
  obtenerCarrito,
  vaciarCarrito,
} from "@/lib/actions";

vi.mock("@/lib/auth/requireRole", () => ({
  requireRole: vi.fn().mockResolvedValue({ id: "admin-user", rol: "ADMIN" }),
}));

vi.mock("@/lib/actions", () => ({
  anadirItemCarrito: vi.fn().mockResolvedValue({ id: "cart" }),
  obtenerCarrito: vi.fn().mockResolvedValue({ id: "cart" }),
  vaciarCarrito: vi.fn().mockResolvedValue(undefined),
}));

describe("cart API role access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows ADMIN to read, add to, and empty their cart", async () => {
    const readResponse = await GET();
    const addResponse = await POST(
      new Request("http://localhost/api/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId: "product-1" }),
      })
    );
    const clearResponse = await DELETE();

    expect(readResponse.status).toBe(200);
    expect(addResponse.status).toBe(200);
    expect(clearResponse.status).toBe(200);
    expect(requireRole).toHaveBeenNthCalledWith(1, [Rol.CLIENTE, Rol.ADMIN]);
    expect(requireRole).toHaveBeenNthCalledWith(2, [Rol.CLIENTE, Rol.ADMIN]);
    expect(requireRole).toHaveBeenNthCalledWith(3, [Rol.CLIENTE, Rol.ADMIN]);
    expect(obtenerCarrito).toHaveBeenCalledWith("admin-user");
    expect(anadirItemCarrito).toHaveBeenCalledWith("admin-user", {
      productoId: "product-1",
    });
    expect(vaciarCarrito).toHaveBeenCalledWith("admin-user");
  });
});
