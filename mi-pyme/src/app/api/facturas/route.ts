import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { listarFacturas, emitirFactura } from "@/lib/actions";

export async function GET(request: Request) {
  try {
    const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const negocioId = searchParams.get("negocioId") ?? undefined;

    const result = await listarFacturas(
      negocioId ? undefined : session.id,
      negocioId,
      { page, limit }
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error fetching facturas:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Rol.NEGOCIO, Rol.ADMIN]);

    const body = await request.json();
    const factura = await emitirFactura(body.pedidoId);
    return NextResponse.json(factura, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("no encontrado") || message.includes("existe")
        ? 400
        : message.includes("denegado") || message.includes("autorizado")
        ? 403
        : 500;
    console.error("Error emitting factura:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
