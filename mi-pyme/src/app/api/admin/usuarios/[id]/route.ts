import { NextResponse } from "next/server";
import { eliminarUsuarioAdminAction } from "@/lib/actions";
import { readJsonBody, routeErrorResponse } from "@/lib/api/route-error";
import { requireRole } from "@/lib/auth/requireRole";
import { Rol } from "@/lib/auth/roles";

export async function DELETE(
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
      return NextResponse.json({ error: "Indica el motivo de la eliminación" }, { status: 400 });
    }
    const { id } = await params;
    await eliminarUsuarioAdminAction(id, body.motivo);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return routeErrorResponse(error, "DELETE /api/admin/usuarios/[id]");
  }
}
