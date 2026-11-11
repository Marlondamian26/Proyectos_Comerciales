import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BusinessError } from "@/shared/types";
import { bulkSetDisponibilidadAction } from "@/lib/actions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
    const { id } = await params;
    const body = await request.json();

    const total = await bulkSetDisponibilidadAction(
      id,
      body.fechas,
      body.cantidad
    );

    return NextResponse.json({ success: true, total });
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("denegado") || message.includes("autorizado")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Error in bulk disponibilidad:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
