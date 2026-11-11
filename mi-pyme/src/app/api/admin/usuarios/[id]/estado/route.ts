import { NextResponse } from "next/server";
import { cambiarEstadoActivoUsuarioAction } from "@/lib/actions";
import { readJsonBody, routeErrorResponse } from "@/lib/api/route-error";
import { requireRole } from "@/lib/auth/requireRole";
import { Rol } from "@/lib/auth/roles";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Rol.ADMIN]);
    const body = await readJsonBody(request);
    if (
      typeof body !== "object" ||
      body === null ||
      !("activo" in body) ||
      typeof body.activo !== "boolean"
    ) {
      return NextResponse.json({ error: "El estado indicado no es válido" }, { status: 400 });
    }
    const { id } = await params;
    await cambiarEstadoActivoUsuarioAction(id, body.activo);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return routeErrorResponse(error, "PATCH /api/admin/usuarios/[id]/estado");
  }
}
