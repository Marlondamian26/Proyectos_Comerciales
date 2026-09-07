import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { eliminarItemCarrito } from "@/lib/actions";

export async function DELETE(request: Request) {
  try {
    const session = await requireRole([Rol.CLIENTE]);

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      );
    }

    await eliminarItemCarrito(itemId, session.id);
    return NextResponse.json({ status: "Item eliminado" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error removing item from carrito:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
