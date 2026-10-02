import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BusinessError } from "@/shared/types";
import { eliminarNotificacionAction } from "@/lib/actions";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in delete notificacion API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID de notificación requerido" }, { status: 400 });
  }

  try {
    await requireRole([Rol.ADMIN, Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA]);
    await eliminarNotificacionAction(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return handleError(err);
  }
}
