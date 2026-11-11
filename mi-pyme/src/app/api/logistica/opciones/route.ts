import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { listarOpcionesLogisticas } from "@/lib/actions";

export async function GET(request: Request) {
  try {
    await requireRole([Rol.LOGISTICA, Rol.ADMIN]);

    const { searchParams } = new URL(request.url);
    const negocioId = searchParams.get("negocioId") ?? undefined;

    const opciones = await listarOpcionesLogisticas(negocioId);
    return NextResponse.json(opciones);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error fetching opciones logisticas:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
