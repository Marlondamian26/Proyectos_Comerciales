import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { reporteProductosMasVendidos } from "@/lib/actions";

export async function GET(request: Request) {
  try {
    await requireRole([Rol.NEGOCIO, Rol.ADMIN]);

    const { searchParams } = new URL(request.url);
    const negocioId = searchParams.get("negocioId");

    if (!negocioId) {
      return NextResponse.json(
        { error: "negocioId es requerido" },
        { status: 400 }
      );
    }

    const reporte = await reporteProductosMasVendidos(negocioId);
    return NextResponse.json(reporte);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error fetching reporte de productos:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
