import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/auth/constants";
import prisma from "@/lib/db/prisma";

export async function POST(request: Request) {
  // Endpoint disponible en todos los entornos para tests E2E.
  // Solo resetea el usuario admin@mi-pyme.local (usuario de prueba/semilla).
  // En producción, este endpoint debería estar protegido por middleware o eliminarse.
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
