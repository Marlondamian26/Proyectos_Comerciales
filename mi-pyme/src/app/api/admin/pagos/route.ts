import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { getResumenPagosAction } from "@/lib/actions";
import { BusinessError } from "@/shared/types";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in admin pagos API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireRole([Rol.ADMIN]);

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado")?.split(",") ?? undefined;
    const metodo = searchParams.get("metodo")?.split(",") ?? undefined;
    const entidadPago = searchParams.get("entidadPago")?.split(",") ?? undefined;
    const idTransferencia = searchParams.get("idTransferencia") ?? undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (estado && estado.length > 0) {
      where.estado = { in: estado };
    }
    if (metodo && metodo.length > 0) {
      where.metodo = { in: metodo };
    }
    if (entidadPago && entidadPago.length > 0) {
      where.entidadPago = { in: entidadPago };
    }
    if (idTransferencia) {
      where.idTransferencia = { equals: idTransferencia };
    }

    const [pagos, total, resumen] = await Promise.all([
      prisma.pago.findMany({
        where,
        include: {
          pedido: {
            include: {
              negocio: { select: { id: true, nombre: true, direccion: true } },
              usuario: { select: { id: true, email: true, nombre: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.pago.count({ where }),
      getResumenPagosAction(),
    ]);

    return NextResponse.json({
      data: pagos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      resumen,
    });
  } catch (err: unknown) {
    return handleError(err);
  }
}
