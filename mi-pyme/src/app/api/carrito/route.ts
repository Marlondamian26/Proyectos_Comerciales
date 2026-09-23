import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { obtenerCarrito, anadirItemCarrito, vaciarCarrito } from "@/lib/actions";
import { BusinessError } from "@/shared/types";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("denegado") || message.includes("autorizado")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  console.error("Error in carrito API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    const carrito = await obtenerCarrito(session.id);
    return NextResponse.json(carrito);
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    const body = await request.json();
    const carrito = await anadirItemCarrito(session.id, body);
    return NextResponse.json(carrito);
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function DELETE() {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    await vaciarCarrito(session.id);
    return NextResponse.json({ status: "Carrito vaciado" });
  } catch (err: unknown) {
    return handleError(err);
  }
}
