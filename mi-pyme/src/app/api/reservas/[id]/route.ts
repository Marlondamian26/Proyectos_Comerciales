import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { cancelarReserva } from "@/lib/actions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    const { id } = await params;

    await cancelarReserva(id, session.id);
    return NextResponse.json({ status: "Reserva cancelada" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error canceling reserva:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
