import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";

describe("Arquitectura - Sesiones", () => {
  const authConfig = readFileSync("src/lib/auth/auth.config.ts", "utf-8");
  const sessionToken = readFileSync("src/lib/auth/session-token.ts", "utf-8");
  const middleware = readFileSync("src/middleware.ts", "utf-8");
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

  test("el límite JWT predeterminado es 24h y rememberMe es 30 días", () => {
    expect(sessionToken).toContain("DEFAULT_SESSION_TTL_SECONDS = 24 * 60 * 60");
    expect(sessionToken).toContain(
      "REMEMBERED_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60"
    );
    expect(30 * 24 * 60 * 60).toBe(2592000);
  });

  test("session.updateAge es 1h (3600 segundos)", () => {
    expect(authConfig).toContain("updateAge: 60 * 60");
    expect(60 * 60).toBe(3600);
  });

  test("jwt.maxAge es 30 días", () => {
    expect(authConfig).toContain("jwt: {");
    expect(authConfig).toContain("maxAge: REMEMBERED_SESSION_TTL_SECONDS");
  });

  test("el JWT se codifica con el tiempo restante hasta su expiración absoluta", () => {
    expect(authConfig).toContain("encode: encodeSessionToken");
    expect(sessionToken).toContain("maxAge: remainingLifetime");
    expect(sessionToken).toContain("token?.sessionExpiresAt");
  });

  test("las rutas privadas anónimas vuelven al login preservando query string", () => {
    expect(middleware).toContain('new URL("/auth/login", req.url)');
    expect(middleware).toContain("`${pathname}${nextUrl.search}`");
  });

  test("los errores del middleware también protegen rutas privadas y preservan query string", () => {
    const errorHandler = middleware.slice(middleware.indexOf("} catch (err)"));
    expect(errorHandler).toContain("publicPaths.some");
    expect(errorHandler).toContain("`${pathname}${req.nextUrl.search}`");
    expect(errorHandler).toContain("NextResponse.redirect(loginUrl)");
  });

  test("logout limpia cookies de Auth.js y solo acepta POST", () => {
    expect(logoutRoute).toContain('"authjs.session-token"');
    expect(logoutRoute).toContain('"__Secure-authjs.session-token"');
    expect(logoutRoute).not.toMatch(/export async function GET/);
  });
});
