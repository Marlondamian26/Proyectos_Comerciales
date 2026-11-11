import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/token-hash";
import { enviarPasswordReset } from "@/lib/auth/password-reset-email";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/services/utils/audit";
import crypto from "crypto";

const RESPUESTA_GENERICA = NextResponse.json({
  success: true,
  message:
    "Si el email está registrado, recibirás un enlace en tu correo.",
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 solicitudes por hora por IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = rateLimit(
      `recuperar:${ip}`,
      3,
      60 * 60 * 1000,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta más tarde." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const email: string = body?.email ?? "";

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 },
      );
    }

    const emailNormalizado = email.toLowerCase().trim();

    // Respuesta genérica SIEMPRE (anti-enumeración)
    const user = await prisma.user.findUnique({
      where: { email: emailNormalizado },
    });

    if (!user || !user.isActive) {
      await logAudit(
        "PASSWORD_RESET_SOLICITADO_USUARIO_INEXISTENTE",
        null,
        null,
        { email: emailNormalizado },
      );
      return RESPUESTA_GENERICA;
    }

    // Invalidar tokens previos del usuario
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    // Crear token hasheado
    const tokenPlano = crypto.randomUUID();
    const tokenHash = hashToken(tokenPlano);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: tokenHash,
        expires,
      },
    });

    // Enviar email con el token plano SOLO en el enlace
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/resetear/${tokenPlano}`;

    try {
      await enviarPasswordReset({
        to: user.email,
        nombre: user.nombre ?? user.email,
        resetUrl,
        expiresInMinutes: 60,
      });
    } catch (emailError) {
      console.error("[RECUPERAR] Error enviando email:", emailError);
      // No revelar error al usuario
    }

    await logAudit("PASSWORD_RESET_SOLICITADO", user.id, user.id, {
      email: user.email,
    });

    return RESPUESTA_GENERICA;
  } catch (error) {
    console.error("[RECUPERAR] Error:", error);
    return NextResponse.json(
      { error: "Error interno. Intenta más tarde." },
      { status: 500 },
    );
  }
}
