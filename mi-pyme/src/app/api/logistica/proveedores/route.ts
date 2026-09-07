import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { listarProveedoresLogisticos } from "@/lib/actions";

export async function GET() {
  try {
    await requireRole([Rol.LOGISTICA, Rol.ADMIN]);

    const proveedores = await listarProveedoresLogisticos();
    return NextResponse.json(proveedores);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error fetching proveedores logisticos:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
