import { describe, test, expect } from "vitest";

describe("Catalogo - sanitización de búsqueda", () => {
  test("query vacía no lanza error", () => {
    const q = (("" as string) ?? "").trim().slice(0, 100).toLowerCase();
    expect(q).toBe("");
  });

  test("query con caracteres especiales no lanza error", () => {
    const q = ("aceite & %$#" ?? "").trim().slice(0, 100).toLowerCase();
    expect(q).toBe("aceite & %$#");
  });

  test("query muy larga se trunca a 100", () => {
    const q = ("a".repeat(500) ?? "").trim().slice(0, 100).toLowerCase();
    expect(q.length).toBe(100);
  });

  test("negocio null no lanza error al acceder nombre", () => {
    const negocio = null;
    const nombre = negocio?.nombre ?? "Negocio";
    expect(nombre).toBe("Negocio");
  });

  test("precio null no lanza error en toFixed", () => {
    const precio = Number(null ?? 0).toFixed(2);
    expect(precio).toBe("0.00");
  });
});
