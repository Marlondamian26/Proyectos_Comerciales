import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/auth/constants";
import { validarPassword } from "@/lib/auth/password-policy";
import { hashToken } from "@/lib/auth/token-hash";
import { logAudit } from "@/services/utils/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string = body?.token ?? "";
    const nuevaPassword: string = body?.password ?? "";

    if (!token || !nuevaPassword) {
      return NextResponse.json(
        { error: "Token y contraseña son requeridos" },
        { status: 400 },
      );
    }

    // Validar fortaleza de la nueva contraseña
    const validacion = validarPassword(nuevaPassword);
    if (!validacion.valida) {
      return NextResponse.json(
        {
          error: "Contraseña débil",
          detalles: validacion.errores,
        },
        { status: 400 },
      );
    }

    // Buscar token válido y no expirado
    const tokenHash = hashToken(token);
    const record = await prisma.verificationToken.findFirst({
      where: {
        token: tokenHash,
        expires: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        {
          error:
            "El enlace es inválido o ha expirado. Solicita uno nuevo.",
        },
        { status: 400 },
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: record.identifier },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "No se puede restablecer la contraseña" },
        { status: 400 },
      );
    }

    // Actualizar contraseña + invalidar sesiones + eliminar token (single-use)
    const hashedPassword = await bcrypt.hash(nuevaPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          sessionVersion: { increment: 1 },
          failedLoginAttempts: 0,
          lockedUntil: null,
          mustChangePassword: false,
        },
      }),
      prisma.verificationToken.delete({
        where: { token: tokenHash },
      }),
    ]);

    await logAudit("PASSWORD_RESET_COMPLETADO", user.id, user.id, {
      email: record.identifier,
    });

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("[RESETEAR] Error:", error);
    return NextResponse.json(
      { error: "Error interno. Intenta más tarde." },
      { status: 500 },
    );
  }
}
