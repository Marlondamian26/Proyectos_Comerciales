import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { obtenerCarrito, anadirItemCarrito, vaciarCarrito } from "@/lib/actions";

export async function GET() {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    const carrito = await obtenerCarrito(session.id);
    return NextResponse.json(carrito);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error fetching carrito:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    const body = await request.json();
    const carrito = await anadirItemCarrito(session.id, body);
    return NextResponse.json(carrito);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error adding item to carrito:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    await vaciarCarrito(session.id);
    return NextResponse.json({ status: "Carrito vaciado" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error clearing carrito:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
