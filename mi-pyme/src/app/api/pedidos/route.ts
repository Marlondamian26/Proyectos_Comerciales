import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { listarPedidos, crearPedido } from "@/lib/actions";
import { BusinessError } from "@/shared/types";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  const status =
    message.includes("no existe") || message.includes("vacío")
      ? 400
      : message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
  console.error("Error fetching pedidos:", err);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const session = await requireRole([Rol.CLIENTE, Rol.NEGOCIO]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? undefined;
    const estado = searchParams.get("estado") ?? undefined;

    const result = await listarPedidos(session.id, { page, limit, search, estado });
    return NextResponse.json(result);
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
    if (err instanceof BusinessError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
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
