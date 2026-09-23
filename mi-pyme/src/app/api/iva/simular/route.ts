import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { simularIVAAction } from "@/lib/actions";

export async function GET(request: Request) {
  try {
    await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);

    const { searchParams } = new URL(request.url);
    const negocioId = searchParams.get("negocioId");
    if (!negocioId) {
      return NextResponse.json({ error: "negocioId es requerido" }, { status: 400 });
    }

    const itemsRaw = searchParams.get("items");
    if (!itemsRaw) {
      return NextResponse.json({ error: "items es requerido" }, { status: 400 });
    }

    let items: Array<{
      precio: number | string;
      cantidad: number;
      tratamientoIVA: string;
      tasaOverride?: number | string | null;
    }>;
    try {
      items = JSON.parse(itemsRaw);
    } catch {
      return NextResponse.json({ error: "items JSON inválido" }, { status: 400 });
    }

    const result = await simularIVAAction({ negocioId, items });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("no encontrado") ? 404 :
      message.includes("denegado") || message.includes("autorizado") ? 403 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
