import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BusinessError } from "@/shared/types";
import { NotificacionService } from "@/services/NotificacionService";
import type { EventoNotificacion } from "@/shared/notificaciones.types";
import type { TipoNotificacion } from "@/generated/prisma/client";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in test API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

const notificacionService = new NotificacionService();

export async function POST(request: Request) {
  try {
    const session = await requireRole([Rol.ADMIN]);
    const body = await request.json();

    const tipo = (body?.tipo ?? "BIENVENIDA") as TipoNotificacion;
    const userId = body?.userId ?? session.id;

    await notificacionService.emitirOrThrow({
      tipo,
      titulo: body?.titulo ?? "Notificación de prueba",
      mensaje: body?.mensaje ?? "Esta es una notificación de prueba.",
      enlace: body?.enlace ?? "/",
      metadata: body?.metadata ?? null,
      actorId: null,
      destinatarioUserId: userId,
    } as EventoNotificacion);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return handleError(err);
  }
}
