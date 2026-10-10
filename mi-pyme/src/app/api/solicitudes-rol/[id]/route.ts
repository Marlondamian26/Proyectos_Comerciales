import { NextResponse } from "next/server";
import { cancelarSolicitudRolAction } from "@/lib/actions";
import { routeErrorResponse } from "@/lib/api/route-error";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json(await cancelarSolicitudRolAction(id));
  } catch (error: unknown) {
    return routeErrorResponse(error, "DELETE /api/solicitudes-rol/[id]");
  }
}
