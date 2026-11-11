import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { emitirFactura } from "@/lib/actions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Rol.NEGOCIO, Rol.ADMIN]);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const factura = await emitirFactura(id, body);
    return NextResponse.json(factura, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("no encontrado") ? 404 :
      message.includes("existe") ? 409 :
      message.includes("denegado") || message.includes("autorizado") ? 403 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
