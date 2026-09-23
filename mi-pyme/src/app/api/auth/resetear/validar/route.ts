import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/token-hash";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const tokenHash = hashToken(token);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
