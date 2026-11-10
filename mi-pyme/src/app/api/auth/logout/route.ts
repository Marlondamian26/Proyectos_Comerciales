import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

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
    cookieStore.delete(cookieName);
  }

  return NextResponse.json({ success: true, redirectUrl: "/auth/login" });
}

export async function GET() {
  return POST();
}
