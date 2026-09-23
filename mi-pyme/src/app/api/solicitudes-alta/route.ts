import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import {
  crearSolicitudAltaAction,
  cancelarSolicitudAltaAction,
  listarSolicitudesAction,
} from "@/lib/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await crearSolicitudAltaAction(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole([Rol.ADMIN]);
    const url = new URL(request.url);
    const estado = url.searchParams.get("estado") ?? undefined;

    const result = await listarSolicitudesAction(estado);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
