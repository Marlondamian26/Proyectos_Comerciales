import { describe, expect, it } from "vitest";
import { getSafeCallbackPath } from "@/lib/auth/safe-callback-url";

describe("getSafeCallbackPath", () => {
  const baseUrl = "https://mi-pyme.example";

  it("preserves same-origin paths and query strings", () => {
    expect(
      getSafeCallbackPath("/pedidos?estado=pendiente", baseUrl)
    ).toBe("/pedidos?estado=pendiente");
  });

  it("rejects external destinations and protocol-relative URLs", () => {
    expect(getSafeCallbackPath("https://evil.example/", baseUrl)).toBe("/");
    expect(getSafeCallbackPath("//evil.example/", baseUrl)).toBe("/");
  });

  it("rejects malformed callback URLs", () => {
    expect(getSafeCallbackPath("http://[", baseUrl)).toBe("/");
  });
});
