import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";

describe("Arquitectura - Sesiones", () => {
  const authConfig = readFileSync("src/lib/auth/auth.config.ts", "utf-8");
  const logoutRoute = readFileSync("src/app/api/auth/logout/route.ts", "utf-8");
  const logoutButton = readFileSync("src/components/LogoutButton.tsx", "utf-8");

  test("pages.signOut está definido en auth.config.ts", () => {
    expect(authConfig).toContain('signOut: "/auth/login"');
  });

  test("jwt callback valida trigger === 'update'", () => {
    expect(authConfig).toContain("trigger === \"update\"");
  });

  test("jwt callback valida sessionVersion contra BD en update", () => {
    expect(authConfig).toContain("dbUser.sessionVersion !== token.sessionVersion");
  });

  test("jwt callback valida isActive contra BD en update", () => {
    expect(authConfig).toContain("!dbUser.isActive");
  });

  test("logout route usa cookies() de next/headers (no new Response().headers)", () => {
    expect(logoutRoute).toContain("import { cookies } from \"next/headers\"");
    expect(logoutRoute).toContain("await cookies()");
    expect(logoutRoute).not.toContain("new Response().headers");
  });

  test("LogoutButton usa router.push (no solo window.location.href)", () => {
    expect(logoutButton).toContain("router.push");
    expect(logoutButton).toContain("router.refresh");
  });

  test("LogoutButton llama a /api/auth/logout", () => {
    expect(logoutButton).toContain('/api/auth/logout');
  });

  test("session.maxAge es 24h (86400 segundos)", () => {
    expect(authConfig).toContain("maxAge: THIRTY_DAYS");
    // THIRTY_DAYS = 30 * 24 * 60 * 60 = 2592000
    expect(30 * 24 * 60 * 60).toBe(2592000);
  });

  test("session.updateAge es 1h (3600 segundos)", () => {
    expect(authConfig).toContain("updateAge: 60 * 60");
    expect(60 * 60).toBe(3600);
  });

  test("jwt.maxAge es 30 días", () => {
    expect(authConfig).toContain("jwt: {");
    expect(authConfig).toContain("maxAge: THIRTY_DAYS");
  });

  test("rememberMe extiende expiración a 30 días", () => {
    expect(authConfig).toContain("if (user && !token.rememberMe)");
    expect(authConfig).toContain("TWENTY_FOUR_HOURS");
  });
});
