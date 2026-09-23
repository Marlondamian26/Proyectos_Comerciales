import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/token-hash";
import { logAudit } from "@/services/utils/audit";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const tokenPlano = crypto.randomUUID();
    const tokenHash = hashToken(tokenPlano);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: tokenHash,
        expires: new Date(Date.now() + 3600000),
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[RECUPERAR] Solicitud de reset recibida para: ${email}`);
    }

    await logAudit("PASSWORD_RESET_SOLICITADO", null, user.id, { email });

    return NextResponse.json({ success: true, token: tokenPlano });
  } catch {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
