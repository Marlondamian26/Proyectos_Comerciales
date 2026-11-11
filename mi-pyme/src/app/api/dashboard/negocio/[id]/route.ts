import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { getResumenAction, getPedidosRecientesAction, getReservasProximasAction } from "@/lib/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const desde = url.searchParams.get("desde") ?? undefined;
    const hasta = url.searchParams.get("hasta") ?? undefined;
    const limit = url.searchParams.get("limit") ?? "10";
    const tipo = url.searchParams.get("tipo") ?? "resumen";

    await requireRole([Rol.NEGOCIO, Rol.ADMIN]);

    if (tipo === "pedidos") {
      const result = await getPedidosRecientesAction(id, Number(limit));
      return NextResponse.json(result);
    }

    if (tipo === "reservas") {
      const result = await getReservasProximasAction(id, Number(limit));
      return NextResponse.json(result);
    }

    const result = await getResumenAction(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
