import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { asignarLogistica } from "@/lib/actions";

export async function POST(request: Request) {
  try {
    await requireRole([Rol.LOGISTICA, Rol.ADMIN]);

    const body = await request.json();
    const pedido = await asignarLogistica(body.pedidoId, body.opcionLogisticaId);
    return NextResponse.json(pedido);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("no encontrada")
        ? 404
        : message.includes("denegado") || message.includes("autorizado")
        ? 403
        : 500;
    console.error("Error assigning logistica:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
