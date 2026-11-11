import { NextResponse } from "next/server";
import { aprobarSolicitudRolAction } from "@/lib/actions";
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
    return NextResponse.json(await aprobarSolicitudRolAction(id));
  } catch (error: unknown) {
    return routeErrorResponse(error, "POST /api/admin/solicitudes-rol/[id]/aprobar");
  }
}
