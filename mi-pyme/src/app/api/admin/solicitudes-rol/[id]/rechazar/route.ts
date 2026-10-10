import { NextResponse } from "next/server";
import { rechazarSolicitudRolAction } from "@/lib/actions";
import { readJsonBody, routeErrorResponse } from "@/lib/api/route-error";
import { requireRole } from "@/lib/auth/requireRole";
import { Rol } from "@/lib/auth/roles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Rol.ADMIN]);
    const body = await readJsonBody(request);
    if (
      typeof body !== "object" ||
      body === null ||
      !("motivo" in body) ||
      typeof body.motivo !== "string"
    ) {
      return NextResponse.json({ error: "El motivo es obligatorio" }, { status: 400 });
    }
    const { id } = await params;
    return NextResponse.json(await rechazarSolicitudRolAction(id, body.motivo));
  } catch (error: unknown) {
    return routeErrorResponse(error, "POST /api/admin/solicitudes-rol/[id]/rechazar");
  }
}
