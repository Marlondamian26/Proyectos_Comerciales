import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/auth/constants";
import prisma from "@/lib/db/prisma";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const password = body.password || "12345678";
  const mustChangePassword = body.mustChangePassword ?? true;

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { email: "admin@mi-pyme.local" },
    data: {
      password: hashedPassword,
      mustChangePassword: mustChangePassword,
    },
  });

  return NextResponse.json({ success: true });
}
