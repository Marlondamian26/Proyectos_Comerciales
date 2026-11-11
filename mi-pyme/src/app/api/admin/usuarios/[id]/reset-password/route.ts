import { NextResponse } from "next/server";
import { resetearPasswordUsuarioAction } from "@/lib/actions";
import { routeErrorResponse } from "@/lib/api/route-error";
import { requireRole } from "@/lib/auth/requireRole";
import { Rol } from "@/lib/auth/roles";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Rol.ADMIN]);
    const { id } = await params;
    const temporaryPassword = await resetearPasswordUsuarioAction(id);
    return NextResponse.json({ temporaryPassword });
  } catch (error: unknown) {
    return routeErrorResponse(error, "POST /api/admin/usuarios/[id]/reset-password");
  }
}
