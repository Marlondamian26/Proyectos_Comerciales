import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { togglePermiteReservas, togglePermiteEnvio } from "@/lib/actions";

export async function POST(request: Request) {
  try {
    const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
    const body = await request.json();
    const { negocioId, field } = body;

    if (!negocioId || !field) {
      return NextResponse.json({ error: "negocioId y field son requeridos" }, { status: 400 });
    }

    if (field === "permiteReservas") {
      const result = await togglePermiteReservas(negocioId);
      return NextResponse.json(result);
    } else if (field === "permiteEnvio") {
      const result = await togglePermiteEnvio(negocioId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "field no válido" }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
