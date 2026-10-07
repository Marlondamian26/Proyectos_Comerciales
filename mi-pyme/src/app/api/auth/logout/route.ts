import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    redirectUrl: "/auth/login",
  });

  const authCookies = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "next-auth.pkce.code_challenge",
    "__Host-next-auth.pkce.code_challenge",
  ];

  authCookies.forEach((cookie) => {
    response.cookies.delete(cookie);
  });

  response.cookies.set("next-auth.logout", "true", {
    maxAge: 5,
    path: "/",
  });

  return response;
}
