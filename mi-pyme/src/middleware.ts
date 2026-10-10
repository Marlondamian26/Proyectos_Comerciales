import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { NegocioService } from "@/services/NegocioService";
import { getCache } from "@/infrastructure";

const negocioService = new NegocioService(getCache());

const rolToPath: Record<string, string> = {
  CLIENTE: "/cliente",
  NEGOCIO: "/negocio",
  LOGISTICA: "/logistica",
  ADMIN: "/admin",
};

const publicPaths = ["/login", "/api/auth", "/api", "/catalogo", "/servicios", "/auth/registro", "/auth/login", "/auth/recuperar", "/auth/resetear", "/contacto", "/images", "/_next"];

const mustChangePasswordPaths = [
  "/perfil/cambiar-password",
  "/api/perfil",
];

function isPathUnder(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export const runtime = "nodejs";
export const preferredRegion = "home";

export async function middleware(req: NextRequest) {
  try {
    const session = (await auth()) as { user?: { id?: string; rol?: string; mustChangePassword?: boolean } } | null;
    const { nextUrl } = req;
    const pathname = nextUrl.pathname;

    if (session?.user?.mustChangePassword === true) {
      const isAllowedPath =
        mustChangePasswordPaths.some((path) => pathname.startsWith(path)) ||
        pathname.startsWith("/auth/") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";

      if (!isAllowedPath) {
        return NextResponse.redirect(new URL("/perfil/cambiar-password", req.url));
      }
      return NextResponse.next();
    }

    if (pathname === "/" || publicPaths.some((path) => isPathUnder(pathname, path))) {
      return NextResponse.next();
    }

    if (!session) {
      const shouldRedirectToLogin = [
        "/cliente",
        "/negocio",
        "/logistica",
        "/admin",
      ].some((route) => isPathUnder(pathname, route));

      const targetUrl = shouldRedirectToLogin ? "/auth/login" : "/auth/registro";
      const authUrl = new URL(targetUrl, req.url);
      authUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(authUrl);
    }

    const rol = session.user?.rol;
    const userId = session.user?.id;

    if (rol && isPathUnder(pathname, "/negocio")) {
      const isNegocioOwner = rol === "NEGOCIO" || rol === "ADMIN"
        ? true
        : rol === "CLIENTE" && userId
          ? await negocioService.esPropietarioDeAlgunNegocio(userId)
          : false;

      if (!isNegocioOwner) {
        const targetPath = rolToPath[rol] || "/cliente";
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
    }

    if (rol) {
      const targetPath = rolToPath[rol];

      if (isPathUnder(pathname, "/cliente") && rol !== "CLIENTE" && rol !== "ADMIN") {
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
      if (isPathUnder(pathname, "/negocio")) {
        return NextResponse.next();
      }
      if (isPathUnder(pathname, "/logistica") && rol !== "LOGISTICA" && rol !== "ADMIN") {
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
      if (isPathUnder(pathname, "/admin") && rol !== "ADMIN") {
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Proxy error:", err);
    const pathname = req.nextUrl.pathname;
    if (
      ["/cliente", "/negocio", "/logistica", "/admin"].some((route) =>
        isPathUnder(pathname, route)
      )
    ) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
     "/((?!api/auth|api/test|api/keep-alive|_next/static|_next/image|favicon.ico|public/|images/).*)",
  ],
};