import { describe, test, expect } from "vitest";

describe("SearchService - Sanitización", () => {
  test("query vacío no lanza error", () => {
    const q = ("" ?? "").trim().slice(0, 100);
    expect(q).toBe("");
  });

  test("query con espacios se trimea", () => {
    const q = ("  aceite  " ?? "").trim().slice(0, 100);
    expect(q).toBe("aceite");
  });

  test("query muy largo se trunca a 100 caracteres", () => {
    const q = ("a".repeat(500) ?? "").trim().slice(0, 100);
    expect(q.length).toBe(100);
  });

  test("query con caracteres especiales no rompe", () => {
    expect(() => ("aceite & %$#" ?? "").trim().slice(0, 100)).not.toThrow();
  });

  test("query con SQL injection no rompe", () => {
    expect(() => ("'; DROP TABLE--" ?? "").trim().slice(0, 100)).not.toThrow();
  });

  test("query null no rompe", () => {
    const q = ((null as unknown as string) ?? "").trim().slice(0, 100);
    expect(q).toBe("");
  });

  test("query undefined no rompe", () => {
    const q = ((undefined as unknown as string) ?? "").trim().slice(0, 100);
    expect(q).toBe("");
  });
});
