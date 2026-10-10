import { NextResponse } from "next/server";
import { listarMisSolicitudesAction } from "@/lib/actions";
import { routeErrorResponse } from "@/lib/api/route-error";

export async function GET() {
  try {
    return NextResponse.json(await listarMisSolicitudesAction());
  } catch (error: unknown) {
    return routeErrorResponse(error, "GET /api/solicitudes-rol/mis-solicitudes");
  }
}
