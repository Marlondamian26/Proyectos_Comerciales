import { NextResponse } from "next/server";
import { listarSolicitudesRolAction } from "@/lib/actions";
import { routeErrorResponse } from "@/lib/api/route-error";
import { requireRole } from "@/lib/auth/requireRole";
import { Rol } from "@/lib/auth/roles";

export async function GET(request: Request) {
  try {
    await requireRole([Rol.ADMIN]);
    const url = new URL(request.url);
    return NextResponse.json(
      await listarSolicitudesRolAction({
        tipo: url.searchParams.get("tipo") ?? undefined,
        estado: url.searchParams.get("estado") ?? undefined,
      })
    );
  } catch (error: unknown) {
    return routeErrorResponse(error, "GET /api/admin/solicitudes-rol");
  }
}
