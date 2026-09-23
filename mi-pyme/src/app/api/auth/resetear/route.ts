import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/auth/constants";
import { validarPassword } from "@/lib/auth/password-policy";
import { hashToken } from "@/lib/auth/token-hash";
import { logAudit } from "@/services/utils/audit";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token y contrasena son requeridos" }, { status: 400 });
    }

    const passwordValidation = validarPassword(password);
    if (!passwordValidation.valida) {
      return NextResponse.json({ error: passwordValidation.errores.join("; ") }, { status: 400 });
    }

    const tokenHash = hashToken(token);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json({ error: "Token invalido o expirado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const updatedUser = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 },
      },
    });

    await logAudit("PASSWORD_RESET_COMPLETADO", updatedUser.id, updatedUser.id, {
      email: verificationToken.identifier,
    });

    await prisma.verificationToken.delete({
      where: { token: tokenHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al restablecer la contrasena" }, { status: 500 });
  }
}
