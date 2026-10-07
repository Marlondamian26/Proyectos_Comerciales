import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const session = await auth();
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return NextResponse.json({
    hasSession: !!session,
    session,
    cookies: allCookies.map((c) => ({
      name: c.name,
      value: c.value.substring(0, 10) + "...",
    })),
  });
}
