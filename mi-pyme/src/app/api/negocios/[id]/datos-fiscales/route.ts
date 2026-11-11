import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { getDatosFiscalesAction, actualizarDatosFiscalesAction } from "@/lib/actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
    const datos = await getDatosFiscalesAction(id);
    return NextResponse.json(datos);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
    const body = await request.json();
    const result = await actualizarDatosFiscalesAction(id, {
      ...body,
      confirmarCambioRegimen: body.confirmarCambioRegimen ?? true,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("no encontrado") ? 404 :
      message.includes("autorizado") || message.includes("permisos") ? 403 :
      message.includes("REGIMEN") ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
