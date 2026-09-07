import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { listarReservas, crearReserva } from "@/lib/actions";

export async function GET() {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    const reservas = await listarReservas(session.id);
    return NextResponse.json(reservas);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error fetching reservas:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    const body = await request.json();
    const reserva = await crearReserva(session.id, body);
    return NextResponse.json(reserva, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("no encontrado") ||
      message.includes("no disponible") ||
      message.includes("sin disponibilidad")
        ? 400
        : message.includes("denegado") || message.includes("autorizado")
        ? 403
        : 500;
    console.error("Error creating reserva:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
