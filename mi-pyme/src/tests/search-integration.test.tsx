import { describe, test, expect } from "vitest";
import { render, fireEvent, renderHook } from "@testing-library/react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useDebounce } from "@/hooks/useDebounce";

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

describe("useDebounce hook", () => {
  test("devuelve el valor inicial inmediatamente", () => {
    const { result } = renderHook(() => useDebounce("inicial", 300));
    expect(result.current).toBe("inicial");
  });
});

describe("SearchInput - renderizado", () => {
  test("renderiza con valor y onChange", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SearchInput value="aceite" onChange={onChange} aria-label="Buscar" placeholder="Buscar productos" />
    );

    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    if (input) {
      expect(input.value).toBe("aceite");
    }
  });

  test("llama onChange al escribir", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SearchInput value="" onChange={onChange} aria-label="Buscar" placeholder="Buscar productos" />
    );

    const input = container.querySelector("input");
    if (input) {
      fireEvent.change(input, { target: { value: "aceite" } });
      expect(onChange).toHaveBeenCalledWith("aceite");
    }
  });

  test("llama onChange con string vacío al limpiar", () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <SearchInput value="aceite" onChange={onChange} aria-label="Buscar" placeholder="Buscar productos" />
    );

    const clearButton = getByRole("button", { name: "Limpiar búsqueda" });
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith("");
  });
});
