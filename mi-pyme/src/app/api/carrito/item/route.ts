import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { eliminarItemCarrito } from "@/lib/actions";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";

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

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const cantidad = body.cantidad;

    if (!cantidad || cantidad < 1) {
      return NextResponse.json(
        { error: "Cantidad inválida" },
        { status: 400 }
      );
    }

    // Verify the item belongs to the user's active cart
    const item = await prisma.carritoItem.findFirst({
      where: {
        id: itemId,
        carrito: { usuarioId: session.id, estado: "activo" },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    await prisma.carritoItem.update({
      where: { id: itemId },
      data: { cantidad },
    });

    revalidatePath("/carrito");
    revalidatePath("/api/carrito");

    return NextResponse.json({ status: "Cantidad actualizada", cantidad });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denegado") || message.includes("autorizado")
      ? 403
      : 500;
    console.error("Error updating item quantity:", err);
    return NextResponse.json({ error: message }, { status });
  }
}