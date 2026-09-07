import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { listarPedidos, crearPedido } from "@/lib/actions";

export async function GET() {
  try {
    const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO]);

    const pedidos = await listarPedidos(session.id);
    return NextResponse.json(pedidos);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error fetching pedidos:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO]);

    const body = await request.json();
    const pedido = await crearPedido(session.id, body);
    return NextResponse.json(pedido, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("no existe") || message.includes("vacío")
        ? 400
        : message.includes("denegado") || message.includes("autorizado")
        ? 403
        : 500;
    console.error("Error creating pedido:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
