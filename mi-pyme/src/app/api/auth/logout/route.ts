import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = new Response().headers;
  const response = NextResponse.json({ success: true, redirectUrl: "/auth/login" });

  const authCookies = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "next-auth.state",
    "__Secure-next-auth.state",
    "next-auth.pkce.code_verifier",
    "__Secure-next-auth.pkce.code_verifier",
    "next-auth.nonce",
    "__Secure-next-auth.nonce",
    "next-auth.logout",
    "__Secure-next-auth.logout",
  ];

  for (const cookieName of authCookies) {
    response.cookies.delete({ name: cookieName, path: "/" });
    response.cookies.delete({ name: cookieName, path: "/", secure: true, sameSite: "lax" });
    response.cookies.set(cookieName, "", { maxAge: 0, path: "/", httpOnly: true });
    response.cookies.set(cookieName, "", {
      maxAge: 0,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}

export async function GET() {
  return POST();
}
