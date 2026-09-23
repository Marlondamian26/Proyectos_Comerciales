import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { eliminarItemCarrito } from "@/lib/actions";
import { BusinessError } from "@/shared/types";
import prisma from "@/lib/db/prisma";
import { DisponibilidadService } from "@/services/DisponibilidadService";
import { normalizarFecha } from "@/shared/utils/fecha";

const dispService = new DisponibilidadService();

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
  console.error("Error in carrito item API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await requireRole([Rol.CLIENTE]);
    const { itemId } = await params;

    const body = await request.json();
    const cantidad = body.cantidad;

    if (!cantidad || cantidad < 1) {
      return NextResponse.json(
        { error: "Cantidad inválida" },
        { status: 400 }
      );
    }

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

    const fechaEntrega = normalizarFecha(item.fechaEntrega ?? new Date());

    if (item.productoId) {
      await dispService.puedeComprarProducto(
        item.productoId,
        cantidad,
        fechaEntrega
      );
    } else if (item.servicioId) {
      await dispService.puedeReservarServicio(
        item.servicioId,
        fechaEntrega,
        cantidad
      );
    }

    await prisma.carritoItem.update({
      where: { id: itemId },
      data: { cantidad },
    });

    return NextResponse.json({ success: true, cantidad });
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await requireRole([Rol.CLIENTE]);
    const { itemId } = await params;

    await eliminarItemCarrito(itemId, session.id);
    return NextResponse.json({ success: true, status: "Item eliminado" });
  } catch (err: unknown) {
    return handleError(err);
  }
}
