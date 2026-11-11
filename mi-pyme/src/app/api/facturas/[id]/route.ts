import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { getFacturaAction, descargarFacturaAction } from "@/lib/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);

    const { searchParams } = new URL(request.url);
    const html = searchParams.get("html");

    if (html === "true") {
      const result = await descargarFacturaAction(id);
      return new NextResponse(result.html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const factura = await getFacturaAction(id);
    return NextResponse.json(factura);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("no encontrada") ? 404 :
      message.includes("denegado") || message.includes("autorizado") ? 403 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
