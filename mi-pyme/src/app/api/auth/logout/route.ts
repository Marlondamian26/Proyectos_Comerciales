import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  const authCookies = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "authjs.state",
    "__Secure-authjs.state",
    "authjs.pkce.code_verifier",
    "__Secure-authjs.pkce.code_verifier",
    "authjs.nonce",
    "__Secure-authjs.nonce",
    "authjs.challenge",
    "__Secure-authjs.challenge",
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
