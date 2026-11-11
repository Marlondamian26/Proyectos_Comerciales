import { NextResponse } from "next/server";
import { cambiarRolUsuarioAction } from "@/lib/actions";
import { readJsonBody, routeErrorResponse } from "@/lib/api/route-error";
import { requireRole } from "@/lib/auth/requireRole";
import { Rol } from "@/lib/auth/roles";
import type { RolUsuarioAdmin } from "@/services/AdminUserService";

const rolesValidos: readonly RolUsuarioAdmin[] = [
  "ADMIN",
  "CLIENTE",
  "NEGOCIO",
  "LOGISTICA",
];

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
      !("nuevoRol" in body) ||
      typeof body.nuevoRol !== "string"
    ) {
      return NextResponse.json({ error: "El rol indicado no es válido" }, { status: 400 });
    }
    const nuevoRol = rolesValidos.find((role) => role === body.nuevoRol);
    if (!nuevoRol) {
      return NextResponse.json({ error: "El rol indicado no es válido" }, { status: 400 });
    }
    const { id } = await params;
    await cambiarRolUsuarioAction(id, nuevoRol);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return routeErrorResponse(error, "PATCH /api/admin/usuarios/[id]/rol");
  }
}
