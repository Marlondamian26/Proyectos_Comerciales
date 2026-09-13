import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

const rolToPath: Record<string, string> = {
  CLIENTE: "/cliente",
  NEGOCIO: "/negocio",
  LOGISTICA: "/logistica",
  ADMIN: "/admin",
};

const publicPaths = ["/login", "/api/auth", "/catalogo", "/servicios", "/auth/registro", "/auth/login", "/auth/recuperar", "/auth/resetear", "/contacto"];

export const runtime = "nodejs";
export const preferredRegion = "home";

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  try {
    const session = (await auth()) as { user?: { rol?: string } } | null;
    const { nextUrl } = req;
    const pathname = nextUrl.pathname;

    if (pathname === "/" || publicPaths.some((path) => pathname.startsWith(path))) {
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
    if (rol && pathname.startsWith("/")) {
      const targetPath = rolToPath[rol];

      if (pathname.startsWith("/cliente") && rol !== "CLIENTE" && rol !== "ADMIN") {
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
      if (pathname.startsWith("/negocio") && rol !== "NEGOCIO" && rol !== "ADMIN") {
        return NextResponse.redirect(new URL(targetPath, req.url));
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)",
  ],
};