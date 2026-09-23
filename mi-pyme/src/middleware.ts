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

const publicPaths = ["/login", "/api/auth", "/catalogo", "/servicios", "/auth/registro", "/auth/login", "/auth/recuperar", "/auth/resetear", "/contacto"];

const mustChangePasswordPaths = [
  "/perfil/cambiar-password",
  "/api/perfil",
];

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

    if (
      pathname === "/" ||
      publicPaths.some((path) => pathname.startsWith(path))
    ) {
      if (pathname === "/" && session?.user?.rol) {
        const rol = session.user.rol;
        if (rolToPath[rol]) {
          return NextResponse.redirect(new URL(rolToPath[rol], req.url));
        }
      }
      return NextResponse.next();
    }

    if (!session) {
      const registerUrl = new URL("/auth/registro", req.url);
      registerUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(registerUrl);
    }

    const rol = session.user?.rol;
    const userId = session.user?.id;

    if (rol && pathname.startsWith("/negocio")) {
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

    if (rol && pathname.startsWith("/")) {
      const targetPath = rolToPath[rol];

      if (pathname.startsWith("/cliente") && rol !== "CLIENTE" && rol !== "ADMIN") {
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
      if (pathname.startsWith("/negocio")) {
        return NextResponse.next();
      }
      if (pathname.startsWith("/logistica") && rol !== "LOGISTICA" && rol !== "ADMIN") {
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
      if (pathname.startsWith("/admin") && rol !== "ADMIN") {
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api/auth|api/test|_next/static|_next/image|favicon.ico|public/).*)",
  ],
};