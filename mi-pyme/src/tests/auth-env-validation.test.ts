import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateAuthEnv, AuthEnvError } from "@/lib/auth/validate-env";

describe("S3: validateAuthEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXTAUTH_SECRET", "dev-secret-key-change-in-production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...originalEnv };
  });

  it("should throw AuthEnvError in production with default secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", "dev-secret-key-change-in-production");

    expect(() => validateAuthEnv()).toThrow(AuthEnvError);
  });

  it("should throw AuthEnvError in production with empty secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", "");

    expect(() => validateAuthEnv()).toThrow(AuthEnvError);
  });

  it("should throw AuthEnvError in production with undefined secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", undefined as unknown as string);

    expect(() => validateAuthEnv()).toThrow(AuthEnvError);
  });

  it("should throw AuthEnvError in production with secret shorter than 32 chars", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", "short-secret");

    expect(() => validateAuthEnv()).toThrow(AuthEnvError);
  });

  it("should NOT throw in production with a valid 32+ char secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", "a-valid-secret-with-at-least-32-chars!!");

    expect(() => validateAuthEnv()).not.toThrow();
  });

  it("should only warn (not throw) in development with default secret", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXTAUTH_SECRET", "dev-secret-key-change-in-production");

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => validateAuthEnv()).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("should not warn in development with a valid secret", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXTAUTH_SECRET", "a-valid-secret-with-at-least-32-chars!!");

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => validateAuthEnv()).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
